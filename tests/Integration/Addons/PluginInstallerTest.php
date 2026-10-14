<?php

namespace Pterodactyl\Tests\Integration\Addons;

use Mockery\MockInterface;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Addons\PluginInstaller\PluginSources;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonDownloadRepository;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class PluginInstallerTest extends ClientApiIntegrationTestCase
{
    use UsesMinecraftServers;

    public function setUp(): void
    {
        parent::setUp();

        config()->set('addons.plugin_installer', array_merge(config('addons.plugin_installer'), [
            'spiget_url' => 'https://spiget.test/v2',
            'spiget_cdn_url' => 'https://cdn.spiget.test/files',
            'modrinth_url' => 'https://modrinth.test/v2',
            'polymart_url' => 'https://polymart.test/v1',
            'cache_ttl' => 0,
        ]));

        Http::preventStrayRequests();
        Http::fake([
            'spiget.test/v2/resources/1001' => Http::response(['id' => 1001, 'name' => 'Luck Perms!', 'premium' => false, 'file' => ['type' => '.jar'], 'version' => ['id' => 777]]),
            'spiget.test/v2/resources/1002' => Http::response(['id' => 1002, 'name' => 'Paid', 'premium' => true, 'file' => ['type' => '.jar'], 'version' => ['id' => 1]]),
            'spiget.test/v2/categories/*' => Http::response([]),
            'spiget.test/v2/resources*' => Http::response([
                ['id' => 1001, 'name' => 'LuckPerms', 'tag' => 'Permissions', 'icon' => ['url' => 'data/icon.png'], 'rating' => ['average' => 4.88], 'downloads' => 5, 'premium' => false, 'file' => ['type' => '.jar'], 'testedVersions' => ['1.21'], 'version' => ['id' => 777], 'updateDate' => 1760000000],
                ['id' => 1003, 'name' => 'External', 'premium' => false, 'external' => true, 'file' => ['type' => 'external'], 'version' => ['id' => 1]],
            ]),
            'spiget.test/v2/search/resources/*' => Http::response(['error' => 'none'], 404),
            'modrinth.test/v2/search*' => Http::response(['hits' => [['project_id' => 'AbC123', 'slug' => 'abc', 'title' => 'Abc', 'description' => 'd', 'downloads' => 9, 'versions' => ['1.21.4'], 'latest_version' => 'v2']], 'total_hits' => 1]),
            'modrinth.test/v2/project/AbC123/version*' => Http::response([
                ['id' => 'v2', 'name' => 'Abc 2', 'version_number' => '2', 'files' => [['url' => 'https://cdn.modrinth.test/abc-2.jar', 'filename' => 'abc-2.jar', 'primary' => true]]],
                ['id' => 'v1', 'name' => 'Abc 1', 'version_number' => '1', 'files' => [['url' => 'https://cdn.modrinth.test/abc-1.jar', 'filename' => 'abc-1.jar', 'primary' => true]]],
            ]),
            'modrinth.test/v2/project/AbC123' => Http::response(['id' => 'AbC123', 'title' => 'Abc']),
            'polymart.test/v1/search*' => Http::response(['response' => ['result' => [['id' => '55']], 'more' => false]]),
            'polymart.test/v1/getResourceInfo*' => Http::response(['response' => ['resource' => ['id' => '55', 'title' => 'Poly', 'price' => '0.00', 'url' => 'https://polymart.org/resource/55', 'updates' => ['latest' => ['id' => '901']]]]]),
            'polymart.test/v1/getDownloadURL*' => Http::response(['response' => ['result' => ['url' => 'https://polymart.test/dl/55.jar']]]),
        ]);
    }

    private function wings(array $installed, ?callable $expect = null): void
    {
        $this->mock(DaemonFileRepository::class, function (MockInterface $mock) use ($installed) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            $mock->shouldReceive('getDirectory')->with('/')->andReturn([['name' => 'plugins', 'file' => false]]);
            $mock->shouldReceive('getDirectory')->with('/plugins')->andReturn(array_map(fn ($name) => ['name' => $name, 'file' => true, 'size' => 1, 'modified' => null], $installed));
            $mock->shouldReceive('deleteFiles')->byDefault();
        });
        $this->mock(DaemonDownloadRepository::class, function (MockInterface $mock) use ($expect) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            $expect ? $expect($mock) : $mock->shouldNotReceive('download');
        });
    }

    public function testSearchesEachSource(): void
    {
        [$user, $server] = $this->paperAccount();

        $this->actingAs($user)->getJson($this->link($server, '/plugins?source=spigot'))
            ->assertOk()
            ->assertJsonPath('plugins.0.name', 'LuckPerms')
            ->assertJsonPath('plugins.0.icon', 'https://www.spigotmc.org/data/icon.png')
            ->assertJsonPath('plugins.0.rating', 4.9)
            ->assertJsonPath('plugins.0.installable', true)
            ->assertJsonPath('plugins.0.latest_version', '777')
            ->assertJsonPath('plugins.1.installable', false);

        $this->getJson($this->link($server, '/plugins?source=spigot&query=nothing'))->assertOk()->assertJsonCount(0, 'plugins');

        $this->getJson($this->link($server, '/plugins?source=modrinth&version=1.21.4'))
            ->assertOk()
            ->assertJsonPath('plugins.0.id', 'AbC123')
            ->assertJsonPath('plugins.0.url', 'https://modrinth.com/plugin/abc');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'modrinth.test/v2/search') && str_contains(urldecode($request->url()), '["versions:1.21.4"]'));

        $this->getJson($this->link($server, '/plugins?source=polymart'))
            ->assertOk()
            ->assertJsonPath('plugins.0.name', 'Poly')
            ->assertJsonPath('plugins.0.installable', true);
    }

    public function testInstallsAndReplacesOlderCopies(): void
    {
        [$user, $server] = $this->paperAccount();

        $this->wings(['Abc-MAbC123-v1.jar', 'Other.jar'], function (MockInterface $downloads) {
            $downloads->expects('download')->with('https://cdn.modrinth.test/abc-2.jar', '/plugins', 'Abc-MAbC123-v2.jar', 300);
        });
        app(DaemonFileRepository::class)->expects('deleteFiles')->with('/plugins', ['Abc-MAbC123-v1.jar']);

        $this->actingAs($user)->postJson($this->link($server, '/plugins/install'), ['source' => 'modrinth', 'id' => 'AbC123'])
            ->assertOk()
            ->assertJsonPath('file', 'Abc-MAbC123-v2.jar');

        $this->assertDatabaseHas('activity_logs', ['event' => 'server:plugin.install']);
    }

    public function testSpigotAndPolymartDownloads(): void
    {
        [$user, $server] = $this->paperAccount();

        $this->wings([], function (MockInterface $downloads) {
            $downloads->expects('download')->with('https://cdn.spiget.test/files/1001.jar', '/plugins', 'LuckPerms-S1001-777.jar', 300);
            $downloads->expects('download')->with('https://polymart.test/dl/55.jar', '/plugins', 'Poly-P55-901.jar', 300);
        });

        $this->actingAs($user)->postJson($this->link($server, '/plugins/install'), ['source' => 'spigot', 'id' => '1001'])->assertOk();
        $this->postJson($this->link($server, '/plugins/install'), ['source' => 'polymart', 'id' => '55'])->assertOk();

        $this->postJson($this->link($server, '/plugins/install'), ['source' => 'spigot', 'id' => '1002'])
            ->assertStatus(400)
            ->assertJsonPath('errors.0.detail', 'This is a premium plugin. Buy it on SpigotMC and upload it through the file manager.');
    }

    public function testMissingPluginsFolderIsNotAnErrorAndIsCreatedOnInstall(): void
    {
        [$user, $server] = $this->paperAccount();

        $this->mock(DaemonFileRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            // The folder is never listed while it does not exist.
            $mock->shouldReceive('getDirectory')->with('/')->andReturn([['name' => 'server.jar', 'file' => true]]);
            $mock->shouldNotReceive('getDirectory')->with('/plugins');
            $mock->expects('createDirectory')->with('plugins', '/');
        });
        $this->mock(DaemonDownloadRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            $mock->expects('download');
        });

        $this->actingAs($user)->getJson($this->link($server, '/plugins/installed'))
            ->assertOk()
            ->assertJsonPath('plugins', []);

        $this->postJson($this->link($server, '/plugins/install'), ['source' => 'spigot', 'id' => '1001'])->assertOk();
    }

    public function testProxiesGetProxyPluginSources(): void
    {
        [$user, $server] = $this->accountWithEgg('Bungeecord');

        $this->actingAs($user)->getJson($this->link($server, '/plugins?source=polymart'))->assertStatus(400);
        $this->getJson($this->link($server, '/plugins?source=spigot'))->assertOk();
        $this->getJson($this->link($server, '/plugins?source=modrinth'))->assertOk();

        Http::assertSent(fn ($request) => str_contains($request->url(), 'spiget.test/v2/categories/3/resources'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'modrinth.test/v2/search') && str_contains(urldecode($request->url()), 'categories:bungeecord') && !str_contains(urldecode($request->url()), 'categories:paper'));
    }

    public function testOnlyAvailableOnServersThatRunPlugins(): void
    {
        foreach (['Bungeecord' => 200, 'Paper' => 200, 'Forge Minecraft' => 404, 'Vanilla Minecraft' => 404, 'Sponge (SpongeVanilla)' => 404, 'Rust' => 404] as $egg => $status) {
            [$user, $server] = $this->accountWithEgg($egg);
            $this->wings([]);

            $this->actingAs($user)->getJson($this->link($server, '/plugins/installed'))->assertStatus($status);
        }
    }

    public function testUninstallOnlyTouchesJarsInThePluginsFolder(): void
    {
        [$user, $server] = $this->paperAccount();
        $this->wings(['A.jar']);
        app(DaemonFileRepository::class)->expects('deleteFiles')->with('/plugins', ['A.jar']);

        $this->actingAs($user)->postJson($this->link($server, '/plugins/uninstall'), ['file' => 'A.jar'])->assertOk();
        $this->postJson($this->link($server, '/plugins/uninstall'), ['file' => '../server.jar'])->assertUnprocessable();
        $this->postJson($this->link($server, '/plugins/uninstall'), ['file' => 'B.jar'])->assertStatus(400);
    }

    public function testPermissionsAndGameAreEnforced(): void
    {
        [$user, $server] = $this->paperAccount(['file.read']);

        $this->actingAs($user)->getJson($this->link($server, '/plugins?source=spigot'))->assertOk();
        $this->postJson($this->link($server, '/plugins/install'), ['source' => 'spigot', 'id' => '1001'])->assertForbidden();
        $this->postJson($this->link($server, '/plugins/uninstall'), ['file' => 'A.jar'])->assertForbidden();

        [$user, $server] = $this->accountWithEgg('Rust');
        $this->actingAs($user)->getJson($this->link($server, '/plugins?source=spigot'))->assertNotFound();
    }

    public function testFileNamesRoundTrip(): void
    {
        $name = PluginSources::fileName('modrinth', 'Abc Plugin: Reloaded', 'AbC123', 'v-2.0');

        $this->assertSame('AbcPluginReloaded-MAbC123-v20.jar', $name);
        $this->assertSame(['source' => 'modrinth', 'id' => 'AbC123', 'version' => 'v20'], PluginSources::parseFileName($name));
        $this->assertNull(PluginSources::parseFileName('Manual.jar'));
    }
}
