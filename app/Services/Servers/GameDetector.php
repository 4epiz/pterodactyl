<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Server;

/**
 * Works out which game a server runs, using the same rules as the client area
 * (resources/scripts/components/theme/gameRules.json): the egg name first, then
 * the docker image, startup command and variable names.
 */
class GameDetector
{
    private static ?array $rules = null;

    public function detect(Server $server): string
    {
        $fromEgg = $this->match(strtolower($server->egg?->name ?? ''));
        if (!is_null($fromEgg)) {
            return $fromEgg;
        }

        $rest = implode(' ', [
            $server->image ?? '',
            $server->startup ?? '',
            ...$server->egg?->variables?->pluck('env_variable')->all() ?? [],
        ]);

        return $this->match(strtolower($rest)) ?? 'generic';
    }

    public function is(Server $server, string ...$games): bool
    {
        return in_array($this->detect($server), $games, true);
    }

    private function match(string $text): ?string
    {
        foreach (self::rules() as [$game, $pattern]) {
            if (preg_match($pattern, $text) === 1) {
                return $game;
            }
        }

        return null;
    }

    private static function rules(): array
    {
        if (is_null(self::$rules)) {
            $json = json_decode(file_get_contents(resource_path('scripts/components/theme/gameRules.json')), true);

            self::$rules = array_map(
                fn (array $rule) => [$rule['game'], '/' . str_replace('/', '\/', $rule['pattern']) . '/'],
                $json['rules'] ?? []
            );
        }

        return self::$rules;
    }
}
