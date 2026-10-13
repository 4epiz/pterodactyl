<?php

namespace Pterodactyl\Services\Theme;

use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

/**
 * Stores the Graphite theme settings managed from the admin area. Everything
 * is kept as a single JSON document in the settings table so new options can
 * be added without migrations; missing keys fall back to the defaults below.
 */
class ThemeSettingsService
{
    public const SETTINGS_KEY = 'settings::theme:config';

    public const ACCENTS = ['lime', 'mono', 'blue', 'violet', 'emerald', 'amber', 'rose'];

    public const MODES = ['system', 'dark', 'light'];

    public const ANNOUNCEMENT_TYPES = ['info', 'success', 'warning', 'danger'];

    public const GAMES = [
        'minecraft' => 'Minecraft',
        'gta' => 'FiveM / GTA',
        'western' => 'RedM',
        'rust' => 'Rust',
        'ark' => 'ARK',
        'valheim' => 'Valheim',
        'terraria' => 'Terraria',
        'fps' => 'Source games (CS2, GMod, TF2)',
        'survival' => 'Survival games (Zomboid, DayZ, 7DTD)',
        'voice' => 'Voice servers',
        'code' => 'Bots & applications',
        'database' => 'Databases',
        'generic' => 'Everything else',
    ];

    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public static function defaults(): array
    {
        return [
            'branding' => [
                'subtitle' => 'Control panel',
                'logo_url' => '',
                'login_title' => 'Sign in',
                'login_subtitle' => 'Welcome back. Enter your details to manage your servers.',
                'footer_text' => '',
            ],
            'appearance' => [
                'accent' => 'lime',
                'allow_accent_change' => true,
                'default_mode' => 'system',
                'allow_mode_change' => true,
                'show_greeting' => true,
                'show_featured' => true,
            ],
            'announcement' => [
                'enabled' => false,
                'type' => 'info',
                'title' => '',
                'message' => '',
                'link_url' => '',
                'link_label' => '',
                'dismissible' => true,
                // Changes whenever the text changes so dismissed banners reappear.
                'id' => '',
            ],
            'links' => [
                'billing_url' => '',
                'support_url' => '',
                'status_url' => '',
                'discord_url' => '',
            ],
            'game_images' => array_fill_keys(array_keys(self::GAMES), ''),
        ];
    }

    /**
     * Returns the stored settings merged over the defaults. Unknown keys in the
     * stored document are ignored.
     */
    public function get(): array
    {
        $defaults = self::defaults();

        try {
            $stored = json_decode($this->settings->get(self::SETTINGS_KEY, '{}') ?: '{}', true);
        } catch (\Throwable) {
            // The settings table may not exist yet (e.g. during installation).
            return $defaults;
        }

        if (!is_array($stored)) {
            return $defaults;
        }

        foreach ($defaults as $section => $values) {
            foreach ($values as $key => $default) {
                $value = $stored[$section][$key] ?? null;
                if (is_null($value)) {
                    continue;
                }

                $defaults[$section][$key] = is_bool($default) ? (bool) $value : (string) $value;
            }
        }

        return $defaults;
    }

    /**
     * Saves a (validated) settings array. Only known keys are kept.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function save(array $input): array
    {
        $settings = self::defaults();

        foreach ($settings as $section => $values) {
            foreach ($values as $key => $default) {
                $value = $input[$section][$key] ?? null;
                $settings[$section][$key] = is_bool($default) ? (bool) $value : trim((string) ($value ?? ''));
            }
        }

        $announcement = $settings['announcement'];
        $settings['announcement']['id'] = substr(sha1(implode('|', [
            $announcement['type'],
            $announcement['title'],
            $announcement['message'],
            $announcement['link_url'],
        ])), 0, 12);

        $this->settings->set(self::SETTINGS_KEY, json_encode($settings));

        return $settings;
    }

    /**
     * The settings the client side needs. Announcements are only included
     * while enabled.
     */
    public function forFrontend(): array
    {
        $settings = $this->get();

        if (!$settings['announcement']['enabled'] || $settings['announcement']['message'] === '') {
            $settings['announcement'] = null;
        }

        $settings['game_images'] = array_filter($settings['game_images']);

        return $settings;
    }
}
