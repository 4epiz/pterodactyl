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
export const customGameImages: Partial<Record<GameKey, string>> = {};

// Checked in order, first match wins. Matched against the egg name, docker
// image, startup command and variable names of the server.
const rules: [GameKey, RegExp][] = [
    ['western', /\bredm\b/],
    ['gta', /fivem|fxserver|txadmin|\bgta\b|rage ?mp|alt:?v\b/],
    [
        'minecraft',
        /minecraft|paper|purpur|spigot|bukkit|forge|fabric|quilt|vanilla|bungee|velocity|waterfall|sponge|bedrock|nukkit|pocketmine|mohist|folia|server_jarfile/,
    ],
    ['terraria', /terraria|tmodloader|tshock/],
    ['rust', /\brust\b|rustdedicated|oxide/],
    ['ark', /\bark\b|shootergame|\basa\b/],
    ['valheim', /valheim/],
    [
        'fps',
        /counter-?strike|\bcs2\b|csgo|srcds|garry|gmod|team ?fortress|\btf2\b|insurgency|left ?4 ?dead|l4d|squad|arma/,
    ],
    [
        'survival',
        /7 ?days|project ?zomboid|zomboid|dayz|unturned|the ?forest|sons ?of ?the ?forest|conan|palworld|v ?rising/,
    ],
    ['voice', /teamspeak|\bts3\b|mumble|murmur/],
    ['database', /mariadb|mysql|postgres|redis|mongo/],
    ['code', /discord|node|nodejs|python|bun\b|deno|golang|\bjava\b|dotnet|\bbot\b/],
];

const match = (text: string): GameKey | undefined => rules.find(([, pattern]) => pattern.test(text))?.[0];

export const detectGame = (server: Pick<Server, 'eggName' | 'dockerImage' | 'invocation' | 'variables'>): GameKey => {
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
