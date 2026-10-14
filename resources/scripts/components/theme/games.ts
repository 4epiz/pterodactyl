import gameRules from './gameRules.json';
import { Server } from '@/api/server/getServer';

export type GameKey =
    | 'minecraft'
    | 'gta'
    | 'western'
    | 'rust'
    | 'ark'
    | 'valheim'
    | 'terraria'
    | 'fps'
    | 'survival'
    | 'voice'
    | 'code'
    | 'database'
    | 'generic';

export const gameLabels: Record<GameKey, string> = {
    minecraft: 'Minecraft',
    gta: 'FiveM',
    western: 'RedM',
    rust: 'Rust',
    ark: 'ARK',
    valheim: 'Valheim',
    terraria: 'Terraria',
    fps: 'Source',
    survival: 'Survival',
    voice: 'Voice',
    code: 'Application',
    database: 'Database',
    generic: 'Server',
};

/**
 * Optional artwork overrides. The theme ships original illustrations only; if
 * you hold the rights to use other images, map a game to a URL here (for
 * example '/themes/graphite/games/minecraft.jpg' placed in /public) and rebuild.
 */
export const customGameImages: Partial<Record<GameKey, string>> = {
    minecraft:
        'https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/Minecraft%20_Holiday_Game_Drop_2025_OV-PMP_1280x720.jpg',
    gta: 'https://ccdn.g-portal.com/original_webp_header_cover_Five_M_c82d1daf1c.webp',
    western:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNW0PLtRO-3GqGJnagKOAtnHVEOyFyzs1mAwKKUnvzX018gFrY3E3Zl0Mh&s=10',
    rust: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5JjA1kCKYwyn5yd53TaB2RwTIBIdn0WhhbdImTtiaPGPU-Cb-t5Q7uvLW&s=10',
    ark: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS312DiFpvaLgDSiI6rILZ6qXyNX-SqbupD4uL8Rk9-YEaipNXX753iyy0&s=10',
    valheim:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnH0Zv64B2-iJXMhofiZmmUHvIVjB9xLmaOeCyf1xkWvTducUuy9XSAymF&s=10',
    terraria:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQczZ9Fug5nwxddIUv5g-Wm8b5uDEvbO4ZHCSV8StZnk8jpm7pTqNpiPCA&s=10',
    fps: 'Source',
    survival: 'Survival',
    voice: 'Voice',
    code: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJAfmFosj9-_NWJrf0N5AsaJlTXwZi4EhN6I6MsCG8OIIhnoItl3srUdc&s=10',
    database:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZyRwO3Ves8rBYMOlQpqzEa3KgfkteAUYs83WMTH1U6xtbDzUUCqiqFjL-&s=10',
    generic: 'Server',
};

// Checked in order, first match wins. Matched against the egg name, docker
// image, startup command and variable names of the server. The same rules are
// used by the panel backend (app/Services/Servers/GameDetector.php).
const rules: [GameKey, RegExp][] = gameRules.rules.map(({ game, pattern }) => [game as GameKey, new RegExp(pattern)]);

const match = (text: string): GameKey | undefined => rules.find(([, pattern]) => pattern.test(text))?.[0];

const gameKeys = Object.keys(gameLabels) as GameKey[];

export const detectGame = (
    server: Pick<Server, 'eggName' | 'dockerImage' | 'invocation' | 'variables'> & { game?: string }
): GameKey => {
    // The panel works the game out with the same rules and sends it along;
    // use that so pages shown here always match what the API allows.
    if (server.game && gameKeys.includes(server.game as GameKey)) return server.game as GameKey;

    // The egg name is the most reliable signal, so it is checked on its own
    // first. Docker image, startup command and variable names are a fallback
    // for panels where the egg name is not descriptive.
    const fromEgg = match((server.eggName || '').toLowerCase());
    if (fromEgg) return fromEgg;

    const rest = [
        server.dockerImage || '',
        server.invocation || '',
        ...(server.variables || []).map((variable) => variable.envVariable),
    ]
        .join(' ')
        .toLowerCase();

    return match(rest) ?? 'generic';
};
