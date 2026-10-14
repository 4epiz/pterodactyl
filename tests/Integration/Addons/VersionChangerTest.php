<?php

namespace Pterodactyl\Tests\Integration\Addons;

use Mockery\MockInterface;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Addons\VersionChanger\Models\VersionGroup;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Repositories\Wings\DaemonDownloadRepository;
use Pterodactyl\Addons\VersionChanger\Models\InstalledVersion;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class VersionChangerTest extends ClientApiIntegrationTestCase
{
    use UsesMinecraftServers;

    public function setUp(): void
    {
        parent::setUp();

        if (!defined('LARAVEL_START')) {
            define('LARAVEL_START', microtime(true));
        }

        // Integration tests share one database; start without any groups.
        InstalledVersion::query()->delete();
        VersionGroup::query()->delete();
    }

    private function downloadGroup(Server $server): VersionGroup
    {
        $group = VersionGroup::query()->create(['name' => 'Paper', 'type' => 'download', 'eggs' => [$server->egg_id]]);
        $group->versions()->create(['name' => '1.21.4', 'download_url' => 'https://example.com/paper.jar', 'filename' => 'server.jar']);

        return $group->load('versions');
    }

    private function wings(string $state, ?callable $files = null, ?callable $downloads = null): void
    {
        $this->mock(DaemonServerRepository::class, function (MockInterface $mock) use ($state) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            $mock->shouldReceive('getDetails')->andReturn(['state' => $state]);
            $mock->shouldReceive('reinstall');
        });
        $this->mock(DaemonFileRepository::class, function (MockInterface $mock) use ($files) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            $files ? $files($mock) : $mock->shouldNotReceive('deleteFiles');
        });
        $this->mock(DaemonDownloadRepository::class, function (MockInterface $mock) use ($downloads) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            $downloads ? $downloads($mock) : $mock->shouldNotReceive('download');
        });
    }

    public function testListsGroupsForTheServersEgg(): void
    {
        [$user, $server] = $this->paperAccount();
        $group = $this->downloadGroup($server);
        VersionGroup::query()->create(['name' => 'Other egg', 'type' => 'download', 'eggs' => [999999]]);

        $this->actingAs($user)->getJson($this->link($server, '/versions'))
            ->assertOk()
            ->assertJsonCount(1, 'groups')
            ->assertJsonPath('groups.0.id', $group->id)
            ->assertJsonPath('groups.0.versions.0.name', '1.21.4')
            ->assertJsonPath('current', null);
    }

    public function testDownloadReplacesJarsAndRemembersTheVersion(): void
    {
        [$user, $server] = $this->paperAccount();
        $group = $this->downloadGroup($server);

        $this->wings('offline', function (MockInterface $files) {
            $files->expects('getDirectory')->with('/')->andReturn([
                ['name' => 'server.jar', 'file' => true],
                ['name' => 'old.jar', 'file' => true],
                ['name' => 'world', 'file' => false],
                ['name' => 'server.properties', 'file' => true],
            ]);
            $files->expects('deleteFiles')->with('/', ['server.jar', 'old.jar']);
        }, function (MockInterface $downloads) {
            $downloads->expects('download')->with('https://example.com/paper.jar', '/', 'server.jar', 600);
        });

        $this->actingAs($user)
            ->postJson($this->link($server, '/versions/install'), ['group' => $group->id, 'version' => $group->versions[0]->id])
            ->assertOk()
            ->assertJsonPath('name', '1.21.4');

        $this->assertSame('1.21.4', InstalledVersion::query()->find($server->id)->name);
        $this->assertDatabaseHas('activity_logs', ['event' => 'server:version.install']);
    }

    public function testRefusesWhileTheServerIsRunning(): void
    {
        [$user, $server] = $this->paperAccount();
        $group = $this->downloadGroup($server);
        $this->wings('running');

        $this->actingAs($user)
            ->postJson($this->link($server, '/versions/install'), ['group' => $group->id, 'version' => $group->versions[0]->id])
            ->assertStatus(400)
            ->assertJsonPath('errors.0.detail', 'Stop the server before changing its version.');
    }

    public function testEggSwitchChangesTheEggAndReinstalls(): void
    {
        [$user, $server] = $this->paperAccount();
        $vanilla = Egg::query()->where('name', 'Vanilla Minecraft')->firstOrFail();
        $group = VersionGroup::query()->create(['name' => 'Type', 'type' => 'egg', 'eggs' => [$server->egg_id, $vanilla->id]]);
        $this->wings('offline');

        $this->actingAs($user)
            ->postJson($this->link($server, '/versions/install'), ['group' => $group->id, 'version' => $vanilla->id])
            ->assertOk()
            ->assertJsonPath('reinstalling', true);

        $server->refresh();
        $this->assertSame($vanilla->id, $server->egg_id);
        $this->assertSame($vanilla->startup, $server->startup);
        $this->assertSame(Server::STATUS_INSTALLING, $server->status);
    }

    public function testCannotUseVersionsFromOtherGroupsOrEggs(): void
    {
        [$user, $server] = $this->paperAccount();
        $group = VersionGroup::query()->create(['name' => 'Other', 'type' => 'download', 'eggs' => [999999]]);
        $version = $group->versions()->create(['name' => 'x', 'download_url' => 'https://example.com/x.jar', 'filename' => 'server.jar']);
        $eggGroup = VersionGroup::query()->create(['name' => 'Type', 'type' => 'egg', 'eggs' => [$server->egg_id]]);
        $this->wings('offline');

        $this->actingAs($user)->postJson($this->link($server, '/versions/install'), ['group' => $group->id, 'version' => $version->id])->assertStatus(400);
        // An egg that is not part of the group.
        $rust = Egg::query()->where('name', 'Rust')->firstOrFail();
        $this->postJson($this->link($server, '/versions/install'), ['group' => $eggGroup->id, 'version' => $rust->id])->assertStatus(400);
        $this->assertSame($server->egg_id, $server->refresh()->egg_id);
    }

    public function testPermissionsAreEnforced(): void
    {
        [$user, $server] = $this->paperAccount(['versions.read']);
        $group = $this->downloadGroup($server);

        $this->actingAs($user)->getJson($this->link($server, '/versions'))->assertOk();
        $this->postJson($this->link($server, '/versions/install'), ['group' => $group->id, 'version' => $group->versions[0]->id])->assertForbidden();
    }

    public function testAdminCanManageGroupsAndVersions(): void
    {
        $admin = User::factory()->create(['root_admin' => true]);
        $egg = Egg::query()->where('name', 'Paper')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('admin.addons.versions'), ['name' => 'Paper', 'type' => 'download', 'eggs' => [$egg->id]])
            ->assertRedirect();
        $group = VersionGroup::query()->where('name', 'Paper')->firstOrFail();
        $this->assertSame([$egg->id], $group->eggIds());

        $this->post(route('admin.addons.versions.store', $group->id), ['name' => '1.21.4', 'download_url' => 'https://example.com/a.jar', 'filename' => 'server.jar'])
            ->assertRedirect(route('admin.addons.versions.view', $group->id));
        $this->assertSame(1, $group->versions()->count());

        $this->withHeaders(['Accept' => 'text/html'])
            ->post(route('admin.addons.versions.store', $group->id), ['name' => 'Bad', 'download_url' => 'file:///etc/passwd', 'filename' => '../x.jar'])
            ->assertSessionHasErrors(['download_url', 'filename']);

        $this->get(route('admin.addons.versions'))->assertOk()->assertSee('Paper');
        $this->get(route('admin.addons.versions.view', $group->id))->assertOk()->assertSee('1.21.4');

        $this->delete(route('admin.addons.versions.view', $group->id))->assertRedirect(route('admin.addons.versions'));
        $this->assertSame(0, VersionGroup::query()->count());
    }

    public function testOnlyAvailableForMinecraftServers(): void
    {
        [$user, $server] = $this->accountWithEgg('Rust');
        $this->actingAs($user)->getJson($this->link($server, '/versions'))->assertNotFound();

        // Every kind of Minecraft server, proxies included, can change version.
        [$user, $server] = $this->accountWithEgg('Bungeecord');
        $this->actingAs($user)->getJson($this->link($server, '/versions'))->assertOk();
    }

    public function testClientApiExplainsWhenTheTablesAreMissing(): void
    {
        [$user, $server] = $this->paperAccount();
        $this->pretendNotInstalled();

        $this->actingAs($user)->getJson($this->link($server, '/versions'))
            ->assertStatus(400)
            ->assertJsonPath('errors.0.detail', 'Versions are not set up on this panel yet. Ask your host to finish installing the version changer.');
    }

    public function testAdminPageExplainsWhenTheTablesAreMissing(): void
    {
        $this->pretendNotInstalled();

        $this->actingAs(User::factory()->create(['root_admin' => true]))
            ->get(route('admin.addons.versions'))
            ->assertStatus(503)
            ->assertSee('php artisan migrate --force');
    }

    private function pretendNotInstalled(): void
    {
        $flag = new \ReflectionProperty(\Pterodactyl\Addons\VersionChanger\Http\EnsureInstalled::class, 'installed');
        $flag->setValue(null, false);
        $this->beforeApplicationDestroyed(fn () => $flag->setValue(null, null));
    }
}
