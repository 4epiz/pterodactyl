<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Server;

/**
 * Works out which game a server runs, and for Minecraft which platform
 * (Paper, a proxy, Forge, ...), using the same rules as the client area
 * (resources/scripts/components/theme/gameRules.json): the egg name first,
 * then the docker image, startup command and variable names.
 */
class GameDetector
{
    public const PLATFORM_UNKNOWN = 'unknown';

    private static ?array $rules = null;

    public function detect(Server $server): string
    {
        return $this->firstMatch($server, self::rules()['games']) ?? 'generic';
    }

    /**
     * The Minecraft platform: bukkit, bungee, velocity, sponge, modded,
     * bedrock, vanilla or unknown. Null for other games.
     */
    public function platform(Server $server): ?string
    {
        if ($this->detect($server) !== 'minecraft') {
            return null;
        }

        return $this->firstMatch($server, self::rules()['platforms']) ?? self::PLATFORM_UNKNOWN;
    }

    public function is(Server $server, string ...$games): bool
    {
        return in_array($this->detect($server), $games, true);
    }

    /**
     * Checks the server against "game" or "game/platform" requirements, such
     * as "minecraft" or "minecraft/bukkit". Matching any of them is enough.
     */
    public function matches(Server $server, string ...$requirements): bool
    {
        $game = $this->detect($server);

        foreach ($requirements as $requirement) {
            [$wantedGame, $wantedPlatform] = array_pad(explode('/', $requirement, 2), 2, null);

            if ($wantedGame === $game && (is_null($wantedPlatform) || $wantedPlatform === $this->platform($server))) {
                return true;
            }
        }

        return false;
    }

    private function firstMatch(Server $server, array $rules): ?string
    {
        $fromEgg = $this->match(strtolower($server->egg?->name ?? ''), $rules);
        if (!is_null($fromEgg)) {
            return $fromEgg;
        }

        $rest = implode(' ', [
            $server->image ?? '',
            $server->startup ?? '',
            ...$server->egg?->variables?->pluck('env_variable')->all() ?? [],
        ]);

        return $this->match(strtolower($rest), $rules);
    }

    private function match(string $text, array $rules): ?string
    {
        foreach ($rules as [$key, $pattern]) {
            if (preg_match($pattern, $text) === 1) {
                return $key;
            }
        }

        return null;
    }

    private static function rules(): array
    {
        if (is_null(self::$rules)) {
            $json = json_decode(file_get_contents(resource_path('scripts/components/theme/gameRules.json')), true);
            $compile = fn (array $rules, string $key) => array_map(
                fn (array $rule) => [$rule[$key], '/' . str_replace('/', '\/', $rule['pattern']) . '/'],
                $rules
            );

            self::$rules = [
                'games' => $compile($json['rules'] ?? [], 'game'),
                'platforms' => $compile($json['minecraft_platforms'] ?? [], 'platform'),
            ];
        }

        return self::$rules;
    }
}
