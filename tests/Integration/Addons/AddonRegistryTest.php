<?php

namespace Pterodactyl\Tests\Integration\Addons;

use Pterodactyl\Models\Permission;
use Pterodactyl\Services\Addons\AddonRegistry;
use Pterodactyl\Tests\Integration\IntegrationTestCase;

class AddonRegistryTest extends IntegrationTestCase
{
    public function testAddonsAreDiscovered(): void
    {
        $this->assertArrayHasKey('VersionChanger', AddonRegistry::all());
        $this->assertArrayHasKey('versions', Permission::permissions());
        $this->assertArrayHasKey('properties', Permission::permissions());
        $this->assertContains('admin.addons.versions', array_column(AddonRegistry::adminNavigation(), 'route'));
    }

    public function testAdminOverviewListsAddons(): void
    {
        if (!defined('LARAVEL_START')) {
            define('LARAVEL_START', microtime(true));
        }

        $this->actingAs(\Pterodactyl\Models\User::factory()->create(['root_admin' => true]))
            ->get(route('admin.addons'))
            ->assertOk()
            ->assertSee('Version Changer')
            ->assertSee('Plugin Installer')
            ->assertSee('Server Properties')
            ->assertSee('Ready');

        $this->assertSame([], AddonRegistry::pendingMigrations());
    }

    public function testClientServerApiIncludesTheGame(): void
    {
        [$user, $server] = $this->generateTestAccount();

        $this->actingAs($user)->getJson('/api/client/servers/' . $server->uuid)
            ->assertOk()
            ->assertJsonPath('attributes.game', 'minecraft');
    }
}
