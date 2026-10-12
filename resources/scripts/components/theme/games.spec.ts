import { detectGame } from '@/components/theme/games';

const server = (eggName: string, dockerImage = '', invocation = '', vars: string[] = []) => ({
    eggName,
    dockerImage,
    invocation,
    variables: vars.map((envVariable) => ({ envVariable } as any)),
});

describe('detectGame', () => {
    it.each([
        ['Paper', 'minecraft'],
        ['Forge Enhanced', 'minecraft'],
        ['Bungeecord', 'minecraft'],
        ['FiveM', 'gta'],
        ['RedM', 'western'],
        ['Rust', 'rust'],
        ['Ark: Survival Evolved', 'ark'],
        ['Valheim', 'valheim'],
        ['tModloader', 'terraria'],
        ['Counter-Strike 2', 'fps'],
        ["Garry's Mod", 'fps'],
        ['Project Zomboid', 'survival'],
        ['Teamspeak3 Server', 'voice'],
        ['MariaDB', 'database'],
        ['node.js generic', 'code'],
        ['Discord.js bot', 'code'],
    ])('detects %s as %s', (egg, expected) => {
        expect(detectGame(server(egg))).toBe(expected);
    });

    it('prefers the egg name over variables from other games', () => {
        expect(detectGame(server('Rust', 'ghcr.io/parkervcp/games:rust', './RustDedicated', ['SERVER_JARFILE']))).toBe(
            'rust'
        );
    });

    it('falls back to the docker image, startup command and variables', () => {
        expect(detectGame(server('My custom egg', 'ghcr.io/pterodactyl/yolks:java_21', '', ['SERVER_JARFILE']))).toBe(
            'minecraft'
        );
        expect(detectGame(server('Custom', '', '$(pwd)/FXServer +exec server.cfg'))).toBe('gta');
    });

    it('returns generic when nothing matches', () => {
        expect(detectGame(server('Something else', 'debian:12', './run'))).toBe('generic');
    });
});
