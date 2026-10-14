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
}
