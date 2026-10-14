<?php

namespace Pterodactyl\Addons\PluginInstaller;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Client\PendingRequest;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Http\Client\ConnectionException;

/**
 * Searches SpigotMC (through the Spiget API), Modrinth and Polymart, and works
 * out where Wings can download a plugin from. Results are normalised to:
 *
 *   [source, id, name, summary, icon, author, downloads, rating, updated_at,
 *    url, premium, installable, game_versions, latest_version]
 */
class PluginSources
{
    public const SPIGOT = 'spigot';
    public const MODRINTH = 'modrinth';
    public const POLYMART = 'polymart';

    public const SOURCES = [self::SPIGOT, self::MODRINTH, self::POLYMART];

    /**
     * SpigotMC resource categories.
     */
    public const SPIGOT_CATEGORIES = [
        4 => 'Spigot',
        2 => 'Bungee - Spigot',
        3 => 'Bungee - Proxy',
        5 => 'Transportation',
        6 => 'Chat',
        7 => 'Tools and Utilities',
        8 => 'Misc',
        9 => 'Libraries / APIs',
    ];

    // Modrinth loaders whose plugins run on each Minecraft platform.
    private const MODRINTH_LOADERS = [
        'bukkit' => ['bukkit', 'spigot', 'paper', 'purpur', 'folia'],
        'bungee' => ['bungeecord', 'waterfall'],
        'velocity' => ['velocity'],
    ];

    // SpigotMC's category for BungeeCord proxy plugins.
    private const SPIGOT_PROXY_CATEGORY = 3;

    // Letters used in installed file names: Name-S1234-5678.jar
    public const FILE_PREFIX = [self::SPIGOT => 'S', self::MODRINTH => 'M', self::POLYMART => 'P'];

    /**
     * Sources with plugins for a Minecraft platform (see GameDetector).
     * Velocity plugins are only listed on Modrinth, Polymart only has
     * plugins for Bukkit-based servers.
     */
    public static function sourcesFor(?string $platform): array
    {
        return match ($platform) {
            'velocity' => [self::MODRINTH],
            'bungee' => [self::SPIGOT, self::MODRINTH],
            default => self::SOURCES,
        };
    }

    /**
     * @return array{plugins: array, page: int, has_more: bool}
     */
    public function search(string $source, string $query, int $page, ?int $category = null, ?string $gameVersion = null, ?string $platform = null): array
    {
        $key = 'addons:plugins:search:' . sha1(json_encode(func_get_args()));

        return Cache::remember($key, $this->config('cache_ttl', 300), fn () => match ($source) {
            // Proxies only get proxy plugins when browsing.
            self::SPIGOT => $this->searchSpigot($query, $page, $platform === 'bungee' ? self::SPIGOT_PROXY_CATEGORY : $category),
            self::MODRINTH => $this->searchModrinth($query, $page, $gameVersion, $platform),
            self::POLYMART => $this->searchPolymart($query, $page),
        });
    }

    /**
     * Versions of a plugin, newest first.
     *
     * @return array<array{id: string, name: string, downloads: int|null, released_at: string|null, game_versions: array, installable: bool}>
     */
    public function versions(string $source, string $id, ?string $platform = null): array
    {
        return match ($source) {
            self::SPIGOT => array_map(fn (array $version) => [
                'id' => (string) $version['id'],
                'name' => (string) ($version['name'] ?? $version['id']),
                'downloads' => $version['downloads'] ?? null,
                'released_at' => $this->date($version['releaseDate'] ?? null),
                'game_versions' => [],
                // Spiget only keeps a copy of the latest file.
                'installable' => false,
            ], $this->get($this->config('spiget_url') . "/resources/$id/versions", ['size' => 25, 'sort' => '-releaseDate'])),
            self::MODRINTH => array_map(fn (array $version) => [
                'id' => (string) $version['id'],
                'name' => (string) ($version['name'] ?: $version['version_number']),
                'downloads' => $version['downloads'] ?? null,
                'released_at' => $this->date($version['date_published'] ?? null),
                'game_versions' => $version['game_versions'] ?? [],
                'installable' => !is_null($this->primaryFile($version)),
            ], $this->modrinthVersions($id, $platform)),
            self::POLYMART => array_map(fn (array $update) => [
                'id' => (string) $update['id'],
                'name' => (string) ($update['version'] ?? $update['title'] ?? $update['id']),
                'downloads' => null,
                'released_at' => $this->date($update['time'] ?? null),
                'game_versions' => [],
                'installable' => false,
            ], Arr::wrap(Arr::get($this->get($this->config('polymart_url') . '/getResourceUpdates', ['resource_id' => $id]), 'response.updates', []))),
        };
    }

    /**
     * Works out what to download for a plugin version (the latest when no
     * version is given).
     *
     * @return array{url: string, filename: string, version: string, name: string}
     */
    public function download(string $source, string $id, ?string $version = null, ?string $platform = null): array
    {
        return match ($source) {
            self::SPIGOT => $this->downloadSpigot($id, $version),
            self::MODRINTH => $this->downloadModrinth($id, $version, $platform),
            self::POLYMART => $this->downloadPolymart($id, $version),
        };
    }

    /**
     * File name a plugin is saved under, so it can be recognised later.
     */
    public static function fileName(string $source, string $name, string $id, string $version): string
    {
        $base = preg_replace('/[^A-Za-z0-9]/', '', Str::ascii($name)) ?: 'Plugin';

        return sprintf('%s-%s%s-%s.jar', Str::limit($base, 48, ''), self::FILE_PREFIX[$source], $id, preg_replace('/[^A-Za-z0-9]/', '', $version));
    }

    /**
     * Reads the source, id and version back from a file name made by fileName().
     */
    public static function parseFileName(string $file): ?array
    {
        if (preg_match('/^(.+)-([SMP])([A-Za-z0-9]+)-([A-Za-z0-9]+)\.jar$/', $file, $matches) !== 1) {
            return null;
        }

        return [
            'source' => array_search($matches[2], self::FILE_PREFIX, true),
            'id' => $matches[3],
            'version' => $matches[4],
        ];
    }

    private function searchSpigot(string $query, int $page, ?int $category): array
    {
        $size = $this->perPage();
        $params = ['size' => $size, 'page' => $page, 'sort' => '-downloads'];
        $base = $this->config('spiget_url');

        if ($query !== '') {
            $url = $base . '/search/resources/' . rawurlencode($query);
            $params['field'] = 'name';
        } elseif ($category && isset(self::SPIGOT_CATEGORIES[$category])) {
            $url = "$base/categories/$category/resources";
        } else {
            $url = "$base/resources";
        }

        // Spiget answers a search without results with a 404.
        $results = $this->get($url, $params, allowMissing: $query !== '');

        $plugins = array_map(function (array $resource) {
            $icon = Arr::get($resource, 'icon.url');
            $premium = (bool) ($resource['premium'] ?? false);
            $external = ($resource['external'] ?? false) || Arr::get($resource, 'file.type') === 'external';

            return [
                'source' => self::SPIGOT,
                'id' => (string) $resource['id'],
                'name' => (string) ($resource['name'] ?? 'Unknown'),
                'summary' => (string) ($resource['tag'] ?? ''),
                'icon' => $icon ? 'https://www.spigotmc.org/' . ltrim($icon, '/') : null,
                'author' => null,
                'downloads' => (int) ($resource['downloads'] ?? 0),
                'rating' => Arr::has($resource, 'rating.average') ? round((float) $resource['rating']['average'], 1) : null,
                'updated_at' => $this->date($resource['updateDate'] ?? null),
                'url' => 'https://www.spigotmc.org/resources/' . $resource['id'],
                'premium' => $premium,
                // Premium plugins have to be bought, and external ones are hosted elsewhere.
                'installable' => !$premium && !$external,
                'game_versions' => array_values(Arr::wrap($resource['testedVersions'] ?? [])),
                'latest_version' => isset($resource['version']['id']) ? (string) $resource['version']['id'] : null,
            ];
        }, Arr::wrap($results));

        return ['plugins' => $plugins, 'page' => $page, 'has_more' => count($results) >= $size];
    }

    private function searchModrinth(string $query, int $page, ?string $gameVersion, ?string $platform): array
    {
        $size = $this->perPage();
        $facets = [array_map(fn ($loader) => "categories:$loader", self::loaders($platform)), ['project_type:mod']];
        if ($gameVersion) {
            $facets[] = ["versions:$gameVersion"];
        }

        $results = $this->get($this->config('modrinth_url') . '/search', [
            'query' => $query,
            'limit' => $size,
            'offset' => ($page - 1) * $size,
            'index' => $query === '' ? 'downloads' : 'relevance',
            'facets' => json_encode($facets),
        ]);

        $plugins = array_map(fn (array $hit) => [
            'source' => self::MODRINTH,
            'id' => (string) $hit['project_id'],
            'name' => (string) ($hit['title'] ?? 'Unknown'),
            'summary' => (string) ($hit['description'] ?? ''),
            'icon' => ($hit['icon_url'] ?? null) ?: null,
            'author' => $hit['author'] ?? null,
            'downloads' => (int) ($hit['downloads'] ?? 0),
            'rating' => null,
            'updated_at' => $this->date($hit['date_modified'] ?? null),
            'url' => 'https://modrinth.com/plugin/' . ($hit['slug'] ?? $hit['project_id']),
            'premium' => false,
            'installable' => true,
            'game_versions' => array_values(Arr::wrap($hit['versions'] ?? [])),
            'latest_version' => isset($hit['latest_version']) ? (string) $hit['latest_version'] : null,
        ], Arr::wrap($results['hits'] ?? []));

        $total = (int) ($results['total_hits'] ?? 0);

        return ['plugins' => $plugins, 'page' => $page, 'has_more' => $page * $size < $total];
    }

    private function searchPolymart(string $query, int $page): array
    {
        $size = $this->perPage();
        $results = $this->get($this->config('polymart_url') . '/search', array_filter([
            'query' => $query,
            'start' => ($page - 1) * $size,
            'limit' => $size,
            'referrer' => $this->config('polymart_referral'),
        ], fn ($value) => $value !== '' && !is_null($value)));

        $plugins = array_values(array_filter(array_map(function (array $result) {
            $resource = $this->polymartResource((string) $result['id']);
            if (!$resource) {
                return null;
            }

            $premium = ((float) ($resource['price'] ?? 0)) > 0;

            return [
                'source' => self::POLYMART,
                'id' => (string) $resource['id'],
                'name' => (string) ($resource['title'] ?? 'Unknown'),
                'summary' => (string) ($resource['subtitle'] ?? ''),
                'icon' => ($resource['thumbnailURL'] ?? null) ?: null,
                'author' => Arr::get($resource, 'owner.name'),
                'downloads' => (int) ($resource['downloads'] ?? 0),
                'rating' => Arr::has($resource, 'reviews.stars') ? round((float) $resource['reviews']['stars'], 1) : null,
                'updated_at' => $this->date(Arr::get($resource, 'updates.latest.time')),
                'url' => (string) ($resource['url'] ?? 'https://polymart.org/resource/' . $resource['id']),
                'premium' => $premium,
                'installable' => !$premium,
                'game_versions' => array_values(Arr::wrap($resource['supportedMinecraftVersions'] ?? [])),
                'latest_version' => Arr::has($resource, 'updates.latest.id') ? (string) $resource['updates']['latest']['id'] : null,
            ];
        }, Arr::wrap(Arr::get($results, 'response.result', [])))));

        return [
            'plugins' => $plugins,
            'page' => $page,
            'has_more' => (bool) Arr::get($results, 'response.more', count($plugins) >= $size),
        ];
    }

    private function downloadSpigot(string $id, ?string $version): array
    {
        $resource = $this->get($this->config('spiget_url') . "/resources/$id");

        if ($resource['premium'] ?? false) {
            throw new DisplayException('This is a premium plugin. Buy it on SpigotMC and upload it through the file manager.');
        }

        if (($resource['external'] ?? false) || Arr::get($resource, 'file.type') === 'external') {
            throw new DisplayException('This plugin is hosted outside SpigotMC. Download it from its page and upload it through the file manager.');
        }

        $latest = (string) Arr::get($resource, 'version.id', '0');
        if (!is_null($version) && $version !== $latest) {
            throw new DisplayException('Only the latest version of SpigotMC plugins can be installed.');
        }

        return [
            'url' => rtrim($this->config('spiget_cdn_url'), '/') . "/$id.jar",
            'filename' => self::fileName(self::SPIGOT, (string) ($resource['name'] ?? $id), $id, $latest),
            'version' => $latest,
            'name' => (string) ($resource['name'] ?? $id),
        ];
    }

    private function downloadModrinth(string $id, ?string $version, ?string $platform): array
    {
        $project = $this->get($this->config('modrinth_url') . "/project/$id");
        $versions = $this->modrinthVersions($id, $platform);

        $selected = is_null($version)
            ? collect($versions)->first(fn (array $item) => !is_null($this->primaryFile($item)))
            : collect($versions)->firstWhere('id', $version);

        $file = $selected ? $this->primaryFile($selected) : null;
        if (!$file) {
            throw new DisplayException('No version of this plugin works on this type of server.');
        }

        return [
            'url' => $file['url'],
            'filename' => self::fileName(self::MODRINTH, (string) ($project['title'] ?? $id), (string) ($project['id'] ?? $id), $selected['id']),
            'version' => (string) $selected['id'],
            'name' => (string) ($project['title'] ?? $id),
        ];
    }

    private function downloadPolymart(string $id, ?string $version): array
    {
        $resource = $this->polymartResource($id);
        if (!$resource) {
            throw new DisplayException('This plugin could not be found on Polymart.');
        }

        if (((float) ($resource['price'] ?? 0)) > 0) {
            throw new DisplayException('This is a paid plugin. Buy it on Polymart and upload it through the file manager.');
        }

        $latest = (string) Arr::get($resource, 'updates.latest.id', '0');
        if (!is_null($version) && $version !== $latest) {
            throw new DisplayException('Only the latest version of Polymart plugins can be installed.');
        }

        $url = Arr::get($this->get($this->config('polymart_url') . '/getDownloadURL', ['resource_id' => $id]), 'response.result.url');
        if (!is_string($url) || !preg_match('#^https?://#i', $url)) {
            throw new DisplayException('Polymart did not provide a download for this plugin.');
        }

        return [
            'url' => $url,
            'filename' => self::fileName(self::POLYMART, (string) ($resource['title'] ?? $id), $id, $latest),
            'version' => $latest,
            'name' => (string) ($resource['title'] ?? $id),
        ];
    }

    private function modrinthVersions(string $id, ?string $platform): array
    {
        return Arr::wrap($this->get($this->config('modrinth_url') . "/project/$id/version", [
            'loaders' => json_encode(self::loaders($platform)),
        ]));
    }

    private static function loaders(?string $platform): array
    {
        return self::MODRINTH_LOADERS[$platform] ?? self::MODRINTH_LOADERS['bukkit'];
    }

    private function polymartResource(string $id): ?array
    {
        return Cache::remember("addons:plugins:polymart:$id", $this->config('cache_ttl', 300), function () use ($id) {
            $resource = Arr::get($this->get($this->config('polymart_url') . '/getResourceInfo', ['resource_id' => $id]), 'response.resource');

            return is_array($resource) && isset($resource['id']) ? $resource : null;
        });
    }

    private function primaryFile(array $version): ?array
    {
        $files = collect($version['files'] ?? [])->filter(fn ($file) => str_ends_with(strtolower($file['filename'] ?? ''), '.jar'));

        return $files->firstWhere('primary', true) ?? $files->first();
    }

    private function get(string $url, array $query = [], bool $allowMissing = false): array
    {
        try {
            $response = $this->http()->get($url, $query);
        } catch (ConnectionException) {
            throw new DisplayException('The plugin service could not be reached. Try again in a moment.');
        }

        if ($allowMissing && $response->status() === 404) {
            return [];
        }

        if ($response->failed()) {
            throw new DisplayException(sprintf('The plugin service returned an error (%d).', $response->status()));
        }

        $json = $response->json();
        if (!is_array($json)) {
            throw new DisplayException('The plugin service returned an unexpected response.');
        }

        return $json;
    }

    private function http(): PendingRequest
    {
        return Http::timeout($this->config('timeout', 10))
            ->acceptJson()
            ->withUserAgent('Pterodactyl-Panel-PluginInstaller/1.0 (+' . config('app.url') . ')');
    }

    private function date(mixed $value): ?string
    {
        if (is_null($value) || $value === '') {
            return null;
        }

        try {
            // Spiget and Polymart send seconds since the epoch, Modrinth sends ISO dates.
            return (is_numeric($value) ? Carbon::createFromTimestamp((int) $value) : Carbon::parse($value))->toAtomString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function perPage(): int
    {
        return (int) $this->config('per_page', 18);
    }

    private function config(string $key, mixed $default = null): mixed
    {
        return config("addons.plugin_installer.$key", $default);
    }
}
