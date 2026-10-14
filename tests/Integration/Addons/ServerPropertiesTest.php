<?php

namespace Pterodactyl\Tests\Integration\Addons;

use Mockery\MockInterface;
use Pterodactyl\Models\Egg;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Exception\ClientException;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class ServerPropertiesTest extends ClientApiIntegrationTestCase
{
    public function testPropertiesCanBeReadAndSaved(): void
    {
        [$user, $server] = $this->generateTestAccount();

        $this->mock(DaemonFileRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('setServer')->andReturnSelf();
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

    public function testMissingFileGivesAHelpfulError(): void
    {
        [$user, $server] = $this->generateTestAccount();

        $this->mock(DaemonFileRepository::class, function (MockInterface $mock) {
            $mock->shouldReceive('setServer')->andReturnSelf();
            $mock->shouldReceive('getContent')->andThrow(new DaemonConnectionException(
                new ClientException('not found', new Request('GET', '/'), new Response(404, [], '{"error":"not found"}'))
            ));
        });

        $this->actingAs($user)->getJson($this->link($server, '/properties'))
            ->assertStatus(400)
            ->assertJsonPath('errors.0.detail', 'This server has no server.properties file yet. Start the server once to create it.');
    }

    public function testValuesWithLineBreaksAreRejected(): void
    {
        [$user, $server] = $this->generateTestAccount();

        $this->actingAs($user)->postJson($this->link($server, '/properties'), ['values' => ['motd' => "a\nop=1"]])
            ->assertUnprocessable();
    }

    public function testPermissionsAreEnforced(): void
    {
        [$user, $server] = $this->generateTestAccount(['properties.read']);

        $this->actingAs($user)->postJson($this->link($server, '/properties'), ['values' => ['pvp' => 'true']])->assertForbidden();

        [$user, $server] = $this->generateTestAccount(['file.read']);
        $this->actingAs($user)->getJson($this->link($server, '/properties'))->assertForbidden();
    }

    public function testOnlyAvailableForMinecraftServers(): void
    {
        [$user, $server] = $this->generateTestAccount();
        $server->forceFill(['egg_id' => Egg::query()->where('name', 'Rust')->firstOrFail()->id])->save();

        $this->actingAs($user)->getJson($this->link($server, '/properties'))->assertNotFound();
    }
}
