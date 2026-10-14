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
};

// Checked in order, first match wins. Matched against the egg name, docker
// image, startup command and variable names of the server. The same rules are
// used by the panel backend (app/Services/Servers/GameDetector.php).
const rules: [GameKey, RegExp][] = gameRules.rules.map(({ game, pattern }) => [game as GameKey, new RegExp(pattern)]);

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
