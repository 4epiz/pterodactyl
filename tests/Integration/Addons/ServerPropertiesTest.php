<?php

namespace Pterodactyl\Tests\Integration\Addons;

use Mockery\MockInterface;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class ServerPropertiesTest extends ClientApiIntegrationTestCase
{
    use UsesMinecraftServers;

    public function testPropertiesCanBeReadAndSaved(): void
    {
        [$user, $server] = $this->paperAccount();

        $this->mock(DaemonFileRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            $mock->shouldReceive('getDirectory')->with('/')->andReturn([['name' => 'server.properties', 'file' => true]]);
            $mock->shouldReceive('getContent')->with('server.properties', 512 * 1024)->andReturn("#comment\npvp=true\nmax-players=20\n");
            $mock->expects('putContent')->with('server.properties', "#comment\npvp=false\nmax-players=20\n");
        });

        $this->actingAs($user)->getJson($this->link($server, '/properties'))
            ->assertOk()
            ->assertJsonPath('properties.0.key', 'pvp')
            ->assertJsonPath('properties.0.type', 'boolean')
            ->assertJsonPath('properties.1.type', 'number');

        $this->postJson($this->link($server, '/properties'), ['values' => ['pvp' => 'false', 'max-players' => '20']])
            ->assertOk()
            ->assertJsonPath('changed', ['pvp']);
    }

    public function testMissingFileIsNotAnError(): void
    {
        [$user, $server] = $this->paperAccount();

        $this->mock(DaemonFileRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            // The file is never requested, whatever error Wings would give for it.
            $mock->shouldReceive('getDirectory')->with('/')->andReturn([['name' => 'world', 'file' => false]]);
            $mock->shouldNotReceive('getContent');
            $mock->shouldNotReceive('putContent');
        });

        $this->actingAs($user)->getJson($this->link($server, '/properties'))
            ->assertOk()
            ->assertJsonPath('exists', false)
            ->assertJsonPath('properties', []);

        $this->postJson($this->link($server, '/properties'), ['values' => ['pvp' => 'false']])
            ->assertStatus(400)
            ->assertJsonPath('errors.0.detail', 'This server has no server.properties file yet. Start the server once to create it.');
    }

    public function testOnlyAvailableOnServersWithServerProperties(): void
    {
        foreach (['Bungeecord' => 404, 'Forge Minecraft' => 200, 'Vanilla Minecraft' => 200, 'Rust' => 404] as $egg => $status) {
            [$user, $server] = $this->accountWithEgg($egg);
            $this->mock(DaemonFileRepository::class, function (MockInterface $mock) {
                $mock->shouldReceive('setServer')->andReturnSelf();
                $mock->shouldReceive('getDirectory')->andReturn([]);
            });

            $this->actingAs($user)->getJson($this->link($server, '/properties'))->assertStatus($status);
        }
    }

    public function testValuesWithLineBreaksAreRejected(): void
    {
        [$user, $server] = $this->paperAccount();

        $this->actingAs($user)->postJson($this->link($server, '/properties'), ['values' => ['motd' => "a\nop=1"]])
            ->assertUnprocessable();
    }

    public function testPermissionsAreEnforced(): void
    {
        [$user, $server] = $this->paperAccount(['properties.read']);

        $this->actingAs($user)->postJson($this->link($server, '/properties'), ['values' => ['pvp' => 'true']])->assertForbidden();

        [$user, $server] = $this->paperAccount(['file.read']);
        $this->actingAs($user)->getJson($this->link($server, '/properties'))->assertForbidden();
    }
}
