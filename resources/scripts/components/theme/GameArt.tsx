import React, { memo, useMemo } from 'react';
import classNames from 'classnames';
import { customGameImages, GameKey } from '@/components/theme/games';

/*
 * Original, hand-built illustrations for each kind of game server. They only
 * evoke a genre (voxels, a neon city, a desert sunset...) and contain no
 * trademarked artwork, so the theme can be redistributed. See games.ts to use
 * your own licensed images instead.
 */

const W = 400;
const H = 200;

// Deterministic PRNG so each server keeps the same landscape between renders.
const random = (seed: string) => {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    };
};

type Rand = () => number;

const Sky = ({ id, stops }: { id: string; stops: [number, string][] }) => (
    <>
        <defs>
            <linearGradient id={id} x1={'0'} y1={'0'} x2={'0'} y2={'1'}>
                {stops.map(([offset, color]) => (
                    <stop key={offset} offset={offset} stopColor={color} />
                ))}
            </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id})`} />
    </>
);

// Smooth-ish random heights for terrain and skylines.
const heights = (rand: Rand, count: number, min: number, max: number, step = 1) => {
    const out: number[] = [];
    let current = min + rand() * (max - min);
    for (let i = 0; i < count; i++) {
        current += (rand() - 0.5) * (max - min) * 0.45;
        current = Math.max(min, Math.min(max, current));
        out.push(Math.round(current / step) * step);
    }
    return out;
};

const ridge = (rand: Rand, base: number, amplitude: number, points = 9) => {
    const ys = heights(rand, points, base - amplitude, base);
    const step = W / (points - 1);
    return `M0 ${H} ` + ys.map((y, i) => `L${(i * step).toFixed(1)} ${y}`).join(' ') + ` L${W} ${H} Z`;
};

/* ------------------------------------------------------------------ voxel */

interface VoxelPalette {
    sky: [number, string][];
    grass: string;
    grassLight: string;
    dirt: string;
    dirtDark: string;
    stone: string;
    leaves: string;
    trunk: string;
    far: string;
}

const Voxel = ({ id, rand, palette, px }: { id: string; rand: Rand; palette: VoxelPalette; px: number }) => {
    const cols = Math.ceil(W / px);
    const tops = heights(rand, cols, H - px * 9, H - px * 4, px);
    const far = heights(rand, cols, H - px * 13, H - px * 7, px);
    const tree = 3 + Math.floor(rand() * (cols - 6));
    const clouds = [0, 1, 2].map(() => ({ x: Math.floor(rand() * cols) * px, y: px * (1 + Math.floor(rand() * 4)) }));

    return (
        <>
            <Sky id={id} stops={palette.sky} />
            <rect x={W - px * 8} y={px * 2} width={px * 3} height={px * 3} fill={'#fff8d6'} opacity={0.95} />
            {clouds.map((c, i) => (
                <g key={i} fill={'#ffffff'} opacity={0.85}>
                    <rect x={c.x} y={c.y} width={px * 5} height={px} />
                    <rect x={c.x + px} y={c.y - px} width={px * 2} height={px} />
                </g>
            ))}
            {far.map((y, i) => (
                <rect key={`f${i}`} x={i * px} y={y} width={px} height={H - y} fill={palette.far} />
            ))}
            {tops.map((y, i) => (
                <g key={i}>
                    <rect x={i * px} y={y} width={px} height={H - y} fill={palette.dirt} />
                    <rect x={i * px} y={y} width={px} height={px} fill={palette.grass} />
                    <rect x={i * px} y={y} width={px} height={px / 3} fill={palette.grassLight} />
                    {rand() > 0.55 && (
                        <rect x={i * px} y={y + px * 2} width={px / 2} height={px / 2} fill={palette.dirtDark} />
                    )}
                    {y + px * 4 < H && <rect x={i * px} y={y + px * 4} width={px} height={H} fill={palette.stone} />}
                </g>
            ))}
            <g>
                <rect x={tree * px} y={tops[tree] - px * 3} width={px} height={px * 3} fill={palette.trunk} />
                <rect
                    x={(tree - 1) * px}
                    y={tops[tree] - px * 5}
                    width={px * 3}
                    height={px * 2}
                    fill={palette.leaves}
                />
                <rect x={tree * px} y={tops[tree] - px * 6} width={px} height={px} fill={palette.leaves} />
            </g>
        </>
    );
};

/* ------------------------------------------------------------ silhouettes */

const Palm = ({ x, y, s = 1, color }: { x: number; y: number; s?: number; color: string }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={'none'} stroke={color} strokeLinecap={'round'}>
        <path d={'M0 0 C 2 -20, 6 -40, 12 -58'} strokeWidth={3.5} />
        <g strokeWidth={2.4}>
            <path d={'M12 -58 C 0 -62, -14 -58, -22 -48'} />
            <path d={'M12 -58 C 4 -70, -6 -74, -16 -72'} />
            <path d={'M12 -58 C 22 -70, 34 -70, 42 -62'} />
            <path d={'M12 -58 C 26 -60, 36 -52, 40 -42'} />
            <path d={'M12 -58 C 14 -70, 20 -78, 28 -80'} />
        </g>
    </g>
);

const Pines = ({
    rand,
    y,
    color,
    count,
    size,
}: {
    rand: Rand;
    y: number;
    color: string;
    count: number;
    size: number;
}) => (
    <g fill={color}>
        {Array.from({ length: count }, (_, i) => {
            const x = (i / count) * W + rand() * (W / count);
            const h = size * (0.7 + rand() * 0.6);
            return <path key={i} d={`M${x} ${y - h} L${x + h * 0.32} ${y} L${x - h * 0.32} ${y} Z`} />;
        })}
        <rect y={y - 1} width={W} height={H - y + 1} />
    </g>
);

/* -------------------------------------------------------------- the scenes */

const scenes: Record<GameKey, (id: string, rand: Rand) => React.ReactNode> = {
    minecraft: (id, rand) => (
        <Voxel
            id={id}
            rand={rand}
            px={16}
            palette={{
                sky: [
                    [0, '#6fb9f0'],
                    [1, '#c4e6fb'],
                ],
                grass: '#5aa83a',
                grassLight: '#7ccc4e',
                dirt: '#86592d',
                dirtDark: '#6b4522',
                stone: '#7b7d80',
                leaves: '#3d8a2c',
                trunk: '#6a4a2a',
                far: '#9cc7c9',
            }}
        />
    ),
    terraria: (id, rand) => (
        <Voxel
            id={id}
            rand={rand}
            px={10}
            palette={{
                sky: [
                    [0, '#4f9cf0'],
                    [1, '#bfe3ff'],
                ],
                grass: '#38a84f',
                grassLight: '#59cf6a',
                dirt: '#975f37',
                dirtDark: '#77461f',
                stone: '#6d6a74',
                leaves: '#2f8f3f',
                trunk: '#7a4b26',
                far: '#7fb7d9',
            }}
        />
    ),
    gta: (id, rand) => {
        const buildings = heights(rand, 18, 112, 168);
        return (
            <>
                <Sky
                    id={id}
                    stops={[
                        [0, '#170b33'],
                        [0.45, '#5a2470'],
                        [0.75, '#e2577a'],
                        [1, '#ffb36b'],
                    ]}
                />
                <defs>
                    <linearGradient id={`${id}-sun`} x1={'0'} y1={'0'} x2={'0'} y2={'1'}>
                        <stop offset={0} stopColor={'#ffe08a'} />
                        <stop offset={1} stopColor={'#ff6f91'} />
                    </linearGradient>
                </defs>
                <circle cx={262} cy={128} r={52} fill={`url(#${id}-sun)`} />
                {[0, 1, 2, 3, 4].map((i) => (
                    <rect key={i} x={200} y={130 + i * 9} width={130} height={2 + i} fill={'#c84a7a'} />
                ))}
                <g fill={'#12082a'}>
                    {buildings.map((y, i) => (
                        <rect key={i} x={i * 23 - 4} y={y} width={21} height={H - y} />
                    ))}
                </g>
                <g fill={'#ffc970'}>
                    {buildings.map((y, i) =>
                        Array.from({ length: 6 }, (_, j) =>
                            rand() > 0.62 ? (
                                <rect
                                    key={`${i}-${j}`}
                                    x={i * 23 + (j % 2) * 8}
                                    y={y + 6 + Math.floor(j / 2) * 9}
                                    width={3}
                                    height={4}
                                    opacity={0.7}
                                />
                            ) : null
                        )
                    )}
                </g>
                <rect y={182} width={W} height={18} fill={'#0b0519'} />
                <Palm x={58} y={186} s={1.05} color={'#0b0519'} />
                <Palm x={330} y={188} s={0.9} color={'#0b0519'} />
                <Palm x={366} y={190} s={0.7} color={'#0b0519'} />
            </>
        );
    },
    western: (id, rand) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#f6c177'],
                    [0.6, '#ef8a5b'],
                    [1, '#b64f4f'],
                ]}
            />
            <circle cx={110} cy={120} r={30} fill={'#fff1c9'} opacity={0.85} />
            <path
                d={
                    'M0 200 L0 132 L40 132 L52 104 L120 104 L132 132 L200 140 L232 112 L300 112 L316 140 L400 146 L400 200 Z'
                }
                fill={'#8c3f3a'}
            />
            <path d={ridge(rand, 176, 18)} fill={'#5c2622'} />
            <g fill={'#2f1311'}>
                <path
                    d={
                        'M320 196 v-34 a6 6 0 0 1 12 0 v34 Z M314 176 v-10 a4 4 0 0 1 8 0 v10 Z M330 170 v-8 a4 4 0 0 1 8 0 v12 h-8 Z'
                    }
                />
            </g>
            <rect y={194} width={W} height={6} fill={'#2f1311'} />
        </>
    ),
    rust: (id, rand) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#d9a066'],
                    [1, '#7d4029'],
                ]}
            />
            <circle cx={300} cy={70} r={20} fill={'#f6dcae'} opacity={0.6} />
            <path d={ridge(rand, 150, 30)} fill={'#5b3220'} opacity={0.75} />
            <g stroke={'#2a1710'} strokeWidth={2} fill={'none'}>
                <path
                    d={
                        'M300 200 L316 70 L332 200 M305 160 L327 160 M308 130 L324 130 M311 100 L321 100 M305 160 L324 130 M308 130 L321 100'
                    }
                />
            </g>
            <g>
                {Array.from({ length: 14 }, (_, i) => (
                    <rect
                        key={i}
                        x={i * 12}
                        y={140 + (i % 3) * 2}
                        width={12}
                        height={60}
                        fill={i % 2 ? '#7a3e22' : '#8f4a28'}
                    />
                ))}
                <rect x={0} y={138} width={168} height={4} fill={'#3d2014'} />
            </g>
            <rect y={188} width={W} height={12} fill={'#2a1710'} />
        </>
    ),
    ark: (id, rand) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#a7d8cc'],
                    [1, '#eef3dc'],
                ]}
            />
            <path d={ridge(rand, 120, 50, 7)} fill={'#7fa99b'} opacity={0.7} />
            <path d={ridge(rand, 156, 26)} fill={'#3f6e5f'} />
            <path
                d={
                    'M150 176 C 160 150, 200 146, 228 150 C 240 120, 244 92, 262 78 C 270 72, 280 74, 278 82 C 266 88, 256 110, 250 152 C 262 156, 270 166, 268 178 L258 178 L254 166 L236 170 L232 180 L220 180 L222 166 C 200 168, 180 172, 170 180 Z'
                }
                fill={'#1e3d33'}
            />
            <g fill={'#1e3d33'}>
                <path d={'M70 60 l14 -6 l-6 6 l12 4 l-14 2 Z'} />
                <path d={'M110 44 l10 -4 l-4 4 l8 3 l-10 1 Z'} />
            </g>
            <Pines rand={rand} y={186} color={'#173029'} count={14} size={26} />
        </>
    ),
    valheim: (id, rand) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#08141f'],
                    [1, '#1f3d52'],
                ]}
            />
            <defs>
                <filter id={`${id}-blur`}>
                    <feGaussianBlur stdDeviation={8} />
                </filter>
            </defs>
            <g filter={`url(#${id}-blur)`} opacity={0.65}>
                <path
                    d={'M-20 70 C 80 20, 160 90, 240 40 S 380 50, 420 20'}
                    stroke={'#5ef2c4'}
                    strokeWidth={14}
                    fill={'none'}
                />
                <path
                    d={'M-20 90 C 100 60, 200 110, 300 70 S 400 80, 420 60'}
                    stroke={'#4aa8ff'}
                    strokeWidth={8}
                    fill={'none'}
                />
            </g>
            {Array.from({ length: 24 }, (_, i) => (
                <circle
                    key={i}
                    cx={rand() * W}
                    cy={rand() * 80}
                    r={rand() * 0.9 + 0.3}
                    fill={'#ffffff'}
                    opacity={0.7}
                />
            ))}
            <path d={'M0 200 L0 150 L70 96 L120 140 L190 84 L260 146 L320 104 L400 150 L400 200 Z'} fill={'#2c4a5e'} />
            <path
                d={'M60 104 L70 96 L80 104 L74 102 Z M180 92 L190 84 L200 92 L192 90 Z M312 110 L320 104 L328 110 Z'}
                fill={'#dbe7f0'}
            />
            <Pines rand={rand} y={188} color={'#07111a'} count={18} size={30} />
        </>
    ),
    fps: (id) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#efe1bf'],
                    [1, '#f8eed6'],
                ]}
            />
            <g>
                <rect x={0} y={70} width={150} height={130} fill={'#c9a46a'} />
                <rect x={150} y={96} width={110} height={104} fill={'#b28d55'} />
                <rect x={260} y={58} width={140} height={142} fill={'#caa66c'} />
                <path d={'M182 200 L182 150 A24 24 0 0 1 230 150 L230 200 Z'} fill={'#7d5e33'} />
                <rect x={30} y={100} width={22} height={30} fill={'#8a6a3d'} />
                <rect x={300} y={90} width={26} height={34} fill={'#8a6a3d'} />
                <rect x={340} y={90} width={26} height={34} fill={'#8a6a3d'} />
                <rect y={186} width={W} height={14} fill={'#a5814b'} />
            </g>
            <g stroke={'#1f1a12'} strokeWidth={1.5} opacity={0.45}>
                <path d={'M200 88 v10 M200 110 v10 M184 104 h10 M206 104 h10'} />
            </g>
        </>
    ),
    survival: (id, rand) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#a9b3a7'],
                    [1, '#dfe2d9'],
                ]}
            />
            <Pines rand={rand} y={150} color={'#8b978b'} count={22} size={34} />
            <Pines rand={rand} y={172} color={'#56645a'} count={16} size={42} />
            <Pines rand={rand} y={196} color={'#27322b'} count={11} size={56} />
        </>
    ),
    voice: (id, rand) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#1e2433'],
                    [1, '#323a4f'],
                ]}
            />
            {Array.from({ length: 40 }, (_, i) => {
                const h = 8 + Math.abs(Math.sin(i * 0.45)) * 60 * (0.5 + rand() * 0.5);
                return (
                    <rect
                        key={i}
                        x={20 + i * 9}
                        y={100 - h / 2}
                        width={4}
                        height={h}
                        rx={2}
                        fill={'#ffffff'}
                        opacity={0.75}
                    />
                );
            })}
        </>
    ),
    code: (id, rand) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#121722'],
                    [1, '#1a2130'],
                ]}
            />
            {Array.from({ length: 12 }, (_, line) => {
                let x = 28 + (line % 4 === 0 ? 0 : 14 * (1 + (line % 3)));
                return (
                    <g key={line}>
                        <rect x={8} y={18 + line * 15} width={10} height={5} rx={2} fill={'#3b4559'} />
                        {Array.from({ length: 2 + Math.floor(rand() * 4) }, (_, t) => {
                            const w = 12 + rand() * 46;
                            const colors = ['#7d8aa3', '#8fb8de', '#b9a5d8', '#d7b98e'];
                            const rect = (
                                <rect
                                    key={t}
                                    x={x}
                                    y={18 + line * 15}
                                    width={w}
                                    height={5}
                                    rx={2}
                                    fill={colors[(line + t) % colors.length]}
                                    opacity={0.75}
                                />
                            );
                            x += w + 6;
                            return rect;
                        })}
                    </g>
                );
            })}
        </>
    ),
    database: (id, rand) => {
        const nodes = Array.from({ length: 14 }, () => ({ x: 20 + rand() * 360, y: 20 + rand() * 160 }));
        return (
            <>
                <Sky
                    id={id}
                    stops={[
                        [0, '#10201d'],
                        [1, '#173630'],
                    ]}
                />
                <g stroke={'#5fbfa8'} strokeWidth={1} opacity={0.4}>
                    {nodes.slice(1).map((n, i) => (
                        <line key={i} x1={nodes[i].x} y1={nodes[i].y} x2={n.x} y2={n.y} />
                    ))}
                </g>
                {nodes.map((n, i) => (
                    <circle key={i} cx={n.x} cy={n.y} r={3} fill={'#8fe0cc'} />
                ))}
            </>
        );
    },
    generic: (id, rand) => (
        <>
            <Sky
                id={id}
                stops={[
                    [0, '#26272b'],
                    [1, '#3a3b41'],
                ]}
            />
            <path d={ridge(rand, 120, 40, 6)} fill={'#4a4b52'} opacity={0.6} />
            <path d={ridge(rand, 160, 30, 6)} fill={'#1c1d21'} opacity={0.8} />
        </>
    ),
};

interface Props {
    game: GameKey;
    seed: string;
    // How the illustration is cropped when the box is not 2:1. "horizon"
    // (default for landscapes) keeps the ground and silhouettes in view.
    align?: 'center' | 'horizon';
    className?: string;
}

const GameArt = ({ game, seed, align, className }: Props) => {
    const custom = customGameImages[game];
    const id = useMemo(() => `art-${game}-${seed.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`, [game, seed]);
    const content = useMemo(() => (custom ? null : scenes[game](id, random(seed))), [custom, game, id, seed]);

    if (custom) {
        return (
            <div
                aria-hidden
                className={classNames('bg-cover bg-center', className)}
                style={{ backgroundImage: `url(${custom})` }}
            />
        );
    }

    return (
        <svg
            aria-hidden
            className={className}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio={
                (align ?? (['voice', 'code', 'database'].includes(game) ? 'center' : 'horizon')) === 'center'
                    ? 'xMidYMid slice'
                    : 'xMidYMax slice'
            }
            xmlns={'http://www.w3.org/2000/svg'}
        >
            {content}
        </svg>
    );
};

export default memo(GameArt);
