<?php

namespace Pterodactyl\Addons\ServerProperties;

/**
 * Reads and updates a server.properties file while keeping its comments,
 * ordering and line endings intact. Values are unescaped on read and escaped
 * on write the way Java's Properties class does it, so "\u00A7a" reads as
 * "§a" and "minecraft\:normal" as "minecraft:normal".
 */
class PropertiesFile
{
    /**
     * Known keys that only accept a fixed set of values.
     */
    public const CHOICES = [
        'difficulty' => ['peaceful', 'easy', 'normal', 'hard'],
        'gamemode' => ['survival', 'creative', 'adventure', 'spectator'],
        'level-type' => ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified', 'minecraft:single_biome_surface'],
        'op-permission-level' => ['1', '2', '3', '4'],
        'function-permission-level' => ['1', '2', '3', '4'],
        'region-file-compression' => ['deflate', 'lz4', 'none'],
    ];

    private array $lines;

    private string $eol;

    public function __construct(string $contents)
    {
        $this->eol = str_contains($contents, "\r\n") ? "\r\n" : "\n";
        $this->lines = explode($this->eol, $contents);
    }

    /**
     * Returns every property with the type of input that suits it.
     */
    public function properties(): array
    {
        $properties = [];

        foreach ($this->lines as $line) {
            if (is_null($parsed = $this->parse($line))) {
                continue;
            }

            [$key, $value] = $parsed;

            $properties[] = [
                'key' => $key,
                'value' => $value,
                'type' => $this->typeOf($key, $value),
                'options' => self::CHOICES[$key] ?? [],
            ];
        }

        return $properties;
    }

    /**
     * Replaces the values of existing keys. Keys that are not in the file are
     * ignored. Returns the keys that actually changed.
     */
    public function update(array $values): array
    {
        $changed = [];

        foreach ($this->lines as $index => $line) {
            if (is_null($parsed = $this->parse($line))) {
                continue;
            }

            [$key, $value] = $parsed;
            if (!array_key_exists($key, $values)) {
                continue;
            }

            $new = (string) ($values[$key] ?? '');
            if ($new !== $value) {
                $this->lines[$index] = $this->rawKey($line) . '=' . self::escape($new);
                $changed[] = $key;
            }
        }

        return $changed;
    }

    public function contents(): string
    {
        return implode($this->eol, $this->lines);
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    private function parse(string $line): ?array
    {
        $trimmed = ltrim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#') || str_starts_with($trimmed, '!') || !str_contains($line, '=')) {
            return null;
        }

        // Only the first unescaped "=" separates the key; values may contain more.
        [$key, $value] = preg_split('/(?<!\\\\)=/', $line, 2) + [1 => ''];

        return [self::unescape(trim($key)), self::unescape(ltrim($value))];
    }

    private function rawKey(string $line): string
    {
        return trim(preg_split('/(?<!\\\\)=/', $line, 2)[0]);
    }

    /**
     * Reverses Java's escaping: \uXXXX, \t, \n, \r, \f and a backslash before
     * any other character.
     */
    public static function unescape(string $value): string
    {
        return preg_replace_callback('/\\\\(u[0-9a-fA-F]{4}|.)/u', function (array $match) {
            $escaped = $match[1];
            if (strlen($escaped) === 5) {
                return mb_chr(hexdec(substr($escaped, 1)), 'UTF-8');
            }

            return ['t' => "\t", 'n' => "\n", 'r' => "\r", 'f' => "\f"][$escaped] ?? $escaped;
        }, $value);
    }

    /**
     * Escapes a value like Java's Properties::store: backslashes, separators,
     * comment characters, control characters and anything outside ASCII.
     */
    public static function escape(string $value): string
    {
        $out = '';
        foreach (mb_str_split($value, 1, 'UTF-8') as $index => $char) {
            $code = mb_ord($char, 'UTF-8');
            $out .= match (true) {
                $char === '\\' => '\\\\',
                $char === "\t" => '\\t',
                $char === "\n" => '\\n',
                $char === "\r" => '\\r',
                $char === "\f" => '\\f',
                $char === ' ' && $index === 0 => '\\ ',
                in_array($char, ['=', ':', '#', '!'], true) => '\\' . $char,
                $code < 0x20 || $code > 0x7E => sprintf('\\u%04X', $code),
                default => $char,
            };
        }

        return $out;
    }

    private function typeOf(string $key, string $value): string
    {
        if (isset(self::CHOICES[$key])) {
            return 'select';
        }

        if ($value === 'true' || $value === 'false') {
            return 'boolean';
        }

        if (preg_match('/^-?\d+$/', $value) === 1) {
            return 'number';
        }

        return 'text';
    }
}
