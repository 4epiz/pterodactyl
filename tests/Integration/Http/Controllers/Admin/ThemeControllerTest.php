<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin;

use Pterodactyl\Models\User;
use Pterodactyl\Services\Theme\ThemeSettingsService;
use Pterodactyl\Tests\Integration\Http\HttpTestCase;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class ThemeControllerTest extends HttpTestCase
{
    public function setUp(): void
    {
        parent::setUp();

        // The admin layout prints the page render time, which public/index.php
        // normally sets up.
        if (!defined('LARAVEL_START')) {
            define('LARAVEL_START', microtime(true));
        }

        // The settings repository caches values statically between tests.
        $this->app->make(SettingsRepositoryInterface::class)->set(ThemeSettingsService::SETTINGS_KEY, '{}');
    }

    public function testThemePageRendersForAdmins(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.theme'))
            ->assertOk()
            ->assertSee('Announcement')
            ->assertSee('Game artwork');
    }

    public function testThemePageIsNotAvailableToRegularUsers(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.theme'))
            ->assertForbidden();
    }

    public function testSettingsAreSavedAndExposedToTheClientArea(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('admin.theme'), $this->payload([
                'announcement' => [
                    'enabled' => '1',
                    'type' => 'warning',
                    'title' => 'Maintenance',
                    'message' => 'Nodes restart on Sunday.',
                    'link_url' => 'https://status.example.com',
                    'link_label' => 'Status',
                    'dismissible' => '1',
                ],
                'appearance' => ['accent' => 'violet', 'allow_accent_change' => '0'],
                'links' => ['billing_url' => 'https://billing.example.com'],
                'game_images' => ['minecraft' => '/themes/minecraft.jpg'],
                'unknown' => ['key' => 'ignored'],
            ]))
            ->assertRedirect(route('admin.theme'))
            ->assertSessionHasNoErrors();

        $theme = $this->app->make(ThemeSettingsService::class)->forFrontend();

        $this->assertSame('violet', $theme['appearance']['accent']);
        $this->assertFalse($theme['appearance']['allow_accent_change']);
        $this->assertTrue($theme['appearance']['allow_mode_change']);
        $this->assertSame('Nodes restart on Sunday.', $theme['announcement']['message']);
        $this->assertSame(12, strlen($theme['announcement']['id']));
        $this->assertSame('https://billing.example.com', $theme['links']['billing_url']);
        $this->assertSame(['minecraft' => '/themes/minecraft.jpg'], $theme['game_images']);
        $this->assertArrayNotHasKey('unknown', $theme);

        $this->get('/')->assertOk()->assertSee('"accent":"violet"', false);
    }

    public function testDisabledAnnouncementIsNotSentToTheClientArea(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('admin.theme'), $this->payload([
                'announcement' => ['enabled' => '0', 'message' => 'Hidden'],
            ]))
            ->assertSessionHasNoErrors();

        $this->assertNull($this->app->make(ThemeSettingsService::class)->forFrontend()['announcement']);
    }

    public function testInvalidValuesAreRejected(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->withHeaders(['Accept' => 'text/html'])
            ->patch(route('admin.theme'), $this->payload([
                'announcement' => ['enabled' => '1', 'message' => ''],
                'appearance' => ['accent' => 'neon'],
                'links' => ['billing_url' => 'javascript:alert(1)', 'support_url' => 'https://x.test/"onmouseover="a'],
            ]))
            ->assertSessionHasErrors([
                'announcement.message',
                'appearance.accent',
                'links.billing_url',
                'links.support_url',
            ]);

        $this->assertSame('lime', $this->app->make(ThemeSettingsService::class)->get()['appearance']['accent']);
    }

    /**
     * Builds a full form submission from the defaults, as the admin page does.
     */
    private function payload(array $overrides): array
    {
        $payload = ThemeSettingsService::defaults();
        unset($payload['announcement']['id']);

        array_walk_recursive($payload, function (&$value) {
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }
        });

        return array_replace_recursive($payload, $overrides);
    }
}
