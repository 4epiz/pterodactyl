<?php

namespace Pterodactyl\Tests\Unit\Services\Servers;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\EggVariable;
use PHPUnit\Framework\Attributes\DataProvider;
use Pterodactyl\Services\Servers\GameDetector;

class GameDetectorTest extends TestCase
{
    #[DataProvider('servers')]
    public function testDetectsTheGame(string $eggName, string $image, array $variables, string $expected): void
    {
        $egg = new Egg(['name' => $eggName]);
        $egg->setRelation('variables', collect(array_map(fn ($env) => new EggVariable(['env_variable' => $env]), $variables)));

        $server = new Server(['image' => $image, 'startup' => '']);
        $server->setRelation('egg', $egg);

        $this->assertSame($expected, (new GameDetector())->detect($server));
    }

    public static function servers(): array
    {
        // Mirrors resources/scripts/components/theme/games.spec.ts.
        return [
            'paper' => ['Paper', 'ghcr.io/pterodactyl/yolks:java_21', ['SERVER_JARFILE'], 'minecraft'],
            'bungeecord' => ['Bungeecord', 'ghcr.io/pterodactyl/yolks:java_17', [], 'minecraft'],
            'fivem' => ['FiveM', 'ghcr.io/pterodactyl/yolks:debian', [], 'gta'],
            'redm is not gta' => ['RedM', 'ghcr.io/pterodactyl/yolks:debian', [], 'western'],
            'rust' => ['Rust', 'ghcr.io/pterodactyl/games:rust', [], 'rust'],
            'ark' => ['Ark: Survival Evolved', 'ghcr.io/pterodactyl/games:source', [], 'ark'],
            'teamspeak' => ['Teamspeak3 Server', 'ghcr.io/pterodactyl/yolks:debian', [], 'voice'],
            'egg name wins over image' => ['Garrys Mod', 'ghcr.io/pterodactyl/yolks:java_21', [], 'fps'],
            'falls back to variables' => ['My Custom Egg', 'example/image', ['SERVER_JARFILE'], 'minecraft'],
            'unknown' => ['Something', 'example/image', [], 'generic'],
        ];
    }

    #[DataProvider('platforms')]
    public function testDetectsTheMinecraftPlatform(string $eggName, ?string $expected): void
    {
        $egg = new Egg(['name' => $eggName]);
        $egg->setRelation('variables', collect());

        $server = new Server(['image' => 'ghcr.io/pterodactyl/yolks:java_21', 'startup' => 'java -jar server.jar']);
        $server->setRelation('egg', $egg);

        $this->assertSame($expected, (new GameDetector())->platform($server));
    }

    public static function platforms(): array
    {
        return [
            ['Paper', 'bukkit'],
            ['Purpur', 'bukkit'],
            ['Mohist', 'bukkit'],
            ['Bungeecord', 'bungee'],
            ['Waterfall', 'bungee'],
            ['Velocity', 'velocity'],
            ['Forge Minecraft', 'modded'],
            ['NeoForge', 'modded'],
            ['Fabric', 'modded'],
            ['Sponge (SpongeVanilla)', 'sponge'],
            ['Vanilla Minecraft', 'vanilla'],
            ['Vanilla Bedrock', 'bedrock'],
            ['Minecraft Java', 'unknown'],
            ['Rust', null],
        ];
    }
}
