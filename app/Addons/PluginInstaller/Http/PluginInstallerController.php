<?php

namespace Pterodactyl\Addons\PluginInstaller\Http;

use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Illuminate\Support\Collection;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Services\Servers\GameDetector;
use Pterodactyl\Addons\PluginInstaller\PluginSources;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonDownloadRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Addons\PluginInstaller\Http\Requests\ReadPluginsRequest;
use Pterodactyl\Addons\PluginInstaller\Http\Requests\InstallPluginRequest;
use Pterodactyl\Addons\PluginInstaller\Http\Requests\UninstallPluginRequest;

class PluginInstallerController extends ClientApiController
{
    private const FOLDER = '/plugins';

    private const DOWNLOAD_TIMEOUT = 300;

    public function __construct(
        private PluginSources $sources,
        private DaemonFileRepository $files,
        private DaemonDownloadRepository $downloads,
        private GameDetector $detector,
    ) {
        parent::__construct();
    }

    /**
     * Searches a plugin source.
     */
    public function search(ReadPluginsRequest $request, Server $server): array
    {
        $platform = $this->detector->platform($server);

        return $this->sources->search(
            $this->source($request->input('source'), $platform),
            trim((string) $request->input('query', '')),
            (int) $request->input('page', 1),
            $request->filled('category') ? (int) $request->input('category') : null,
            $request->input('version') ?: null,
            $platform,
        );
    }

    /**
     * Versions of a plugin.
     */
    public function versions(ReadPluginsRequest $request, Server $server, string $source, string $id): array
    {
        $platform = $this->detector->platform($server);

        return ['versions' => $this->sources->versions($this->source($source, $platform), $id, $platform)];
    }

    /**
     * The .jar files in the server's plugins folder.
     */
    public function installed(ReadPluginsRequest $request, Server $server): array
    {
        return ['plugins' => $this->listPlugins($server)->values()];
    }

    /**
     * Downloads a plugin into the plugins folder, replacing an older copy of
     * the same plugin that was installed from here.
     */
    public function install(InstallPluginRequest $request, Server $server): array
    {
        $platform = $this->detector->platform($server);
        $source = $this->source($request->input('source'), $platform);
        $id = $request->input('id');
        $download = $this->sources->download($source, $id, $request->input('version'), $platform);

        $existing = $this->listPlugins($server, create: true);
        $replaced = $existing
            ->filter(fn (array $plugin) => $plugin['source'] === $source && $plugin['id'] === $id && $plugin['file'] !== $download['filename'])
            ->pluck('file');

        // Download first, so a failed download leaves the old version in place.
        $this->downloads->setServer($server)->download($download['url'], self::FOLDER, $download['filename'], self::DOWNLOAD_TIMEOUT);

        if ($replaced->isNotEmpty()) {
            $this->files->setServer($server)->deleteFiles(self::FOLDER, $replaced->all());
        }

        Activity::event('server:plugin.install')
            ->property(['source' => $source, 'plugin' => $download['name'], 'file' => $download['filename']])
            ->log();

        return ['file' => $download['filename'], 'plugins' => $this->listPlugins($server)->values()];
    }

    /**
     * Deletes a plugin's .jar file.
     */
    public function uninstall(UninstallPluginRequest $request, Server $server): array
    {
        $file = $request->input('file');

        if (!$this->listPlugins($server)->contains('file', $file)) {
            throw new DisplayException('That plugin is not installed.');
        }

        $this->files->setServer($server)->deleteFiles(self::FOLDER, [$file]);

        Activity::event('server:plugin.uninstall')->property('file', $file)->log();

        return ['plugins' => $this->listPlugins($server)->values()];
    }

    /**
     * The requested source, or the first one available for the server's
     * platform. Refuses sources without plugins for it.
     */
    private function source(?string $requested, ?string $platform): string
    {
        $available = PluginSources::sourcesFor($platform);

        if (is_null($requested)) {
            return $available[0];
        }

        if (!in_array($requested, $available, true)) {
            throw new DisplayException('That plugin source has no plugins for this type of server.');
        }

        return $requested;
    }

    private function listPlugins(Server $server, bool $create = false): Collection
    {
        $files = $this->files->setServer($server);

        // Check the folder exists before listing it: Wings versions answer a
        // missing folder with different errors.
        $exists = collect($files->getDirectory('/'))
            ->contains(fn (array $file) => $file['name'] === 'plugins' && !($file['file'] ?? false));

        if (!$exists) {
            if ($create) {
                $files->createDirectory('plugins', '/');
            }

            return collect();
        }

        return collect($files->getDirectory(self::FOLDER))
            ->filter(fn (array $file) => ($file['file'] ?? false) && str_ends_with(strtolower($file['name']), '.jar'))
            ->map(fn (array $file) => array_merge(
                ['file' => $file['name'], 'size' => $file['size'] ?? 0, 'modified_at' => $file['modified'] ?? null],
                PluginSources::parseFileName($file['name']) ?? ['source' => null, 'id' => null, 'version' => null],
            ))
            ->sortBy(fn (array $plugin) => strtolower($plugin['file']));
    }
}
