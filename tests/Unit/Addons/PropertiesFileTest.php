<?php

namespace Pterodactyl\Tests\Unit\Addons;

use Pterodactyl\Tests\TestCase;
use Pterodactyl\Addons\ServerProperties\PropertiesFile;

class PropertiesFileTest extends TestCase
{
    private const FILE = "#Minecraft server properties\n#Tue Oct 14 2026\nmotd=A \\u00A7aMinecraft Server\nlevel-type=minecraft\\:normal\npvp=true\nmax-players=20\ndifficulty=easy\nlevel-seed=\n\n! another comment\n";

    public function testPropertiesAreParsedWithTypesAndUnescapedValues(): void
    {
        $properties = collect((new PropertiesFile(self::FILE))->properties())->keyBy('key');

        $this->assertCount(6, $properties);
        $this->assertSame('A §aMinecraft Server', $properties['motd']['value']);
        $this->assertSame('text', $properties['motd']['type']);
        $this->assertSame('minecraft:normal', $properties['level-type']['value']);
        $this->assertSame('select', $properties['level-type']['type']);
        $this->assertSame('boolean', $properties['pvp']['type']);
        $this->assertSame('number', $properties['max-players']['type']);
        $this->assertSame(['peaceful', 'easy', 'normal', 'hard'], $properties['difficulty']['options']);
        $this->assertSame('', $properties['level-seed']['value']);
    }

    public function testUpdateOnlyRewritesChangedKeysAndKeepsTheRestOfTheFile(): void
    {
        $file = new PropertiesFile(self::FILE);

        $changed = $file->update([
            'pvp' => 'false',
            'motd' => 'Hello = world §b!',
            'level-type' => 'minecraft:flat',
            'max-players' => '20',
            'not-in-file' => 'ignored',
        ]);

        $this->assertSame(['motd', 'level-type', 'pvp'], $changed);
        $this->assertSame(
            "#Minecraft server properties\n#Tue Oct 14 2026\nmotd=Hello \\= world \\u00A7b\\!\nlevel-type=minecraft\\:flat\npvp=false\nmax-players=20\ndifficulty=easy\nlevel-seed=\n\n! another comment\n",
            $file->contents()
        );

        // Reading the written file back gives the values that were saved.
        $properties = collect((new PropertiesFile($file->contents()))->properties())->pluck('value', 'key');
        $this->assertSame('Hello = world §b!', $properties['motd']);
        $this->assertSame('minecraft:flat', $properties['level-type']);
    }

    public function testWindowsLineEndingsArePreserved(): void
    {
        $file = new PropertiesFile("pvp=true\r\nmax-players=20\r\n");
        $file->update(['pvp' => 'false']);

        $this->assertSame("pvp=false\r\nmax-players=20\r\n", $file->contents());
    }

    public function testLineBreaksInValuesAreEscaped(): void
    {
        $file = new PropertiesFile("motd=hi\n");
        $file->update(['motd' => "line\nop-permission-level=4"]);

        $this->assertSame("motd=line\\nop-permission-level\\=4\n", $file->contents());
        $this->assertCount(1, (new PropertiesFile($file->contents()))->properties());
    }
}
