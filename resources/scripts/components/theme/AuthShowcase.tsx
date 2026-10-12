import React from 'react';
import { motion } from 'framer-motion';
import GameArt from '@/components/theme/GameArt';
import { GameKey } from '@/components/theme/games';

const ease = [0.22, 1, 0.36, 1];

const cards: { game: GameKey; name: string; egg: string; status: string; cpu: number; className: string }[] = [
    { game: 'minecraft', name: 'Survival SMP', egg: 'Paper', status: 'Running', cpu: 38, className: 'mr-16' },
    { game: 'gta', name: 'Los Santos RP', egg: 'FiveM', status: 'Running', cpu: 61, className: 'mt-3 ml-16' },
    { game: 'rust', name: 'Weekly Wipe', egg: 'Rust', status: 'Starting', cpu: 12, className: 'mt-3 ml-6 mr-10' },
];

/**
 * Decorative product preview shown beside the authentication forms on large
 * screens. Purely presentational.
 */
export default () => (
    <div
        className={
            'relative flex h-full min-h-[calc(100vh-1.5rem)] flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface-2 p-10'
        }
    >
        <div className={'relative flex flex-1 items-center justify-center'}>
            <div className={'w-full max-w-sm'}>
                {cards.map((card, index) => (
                    <motion.div
                        key={card.name}
                        className={`relative ${card.className}`}
                        style={{ zIndex: index }}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 + index * 0.15, ease }}
                    >
                        <div className={'overflow-hidden rounded-2xl border border-line bg-surface shadow-pop'}>
                            <div className={'relative h-20'}>
                                <GameArt
                                    game={card.game}
                                    seed={card.name}
                                    className={'absolute inset-0 h-full w-full'}
                                />
                                <span
                                    className={
                                        'absolute right-3 top-3 rounded-md bg-[rgba(0,0,0,0.45)] px-2 py-0.5 text-xs font-medium text-white backdrop-blur-md'
                                    }
                                >
                                    {card.status}
                                </span>
                            </div>
                            <div className={'flex items-center justify-between gap-4 p-4'}>
                                <div className={'min-w-0'}>
                                    <p className={'truncate text-sm font-semibold text-fg'}>{card.name}</p>
                                    <p className={'text-xs text-fg-subtle'}>{card.egg}</p>
                                </div>
                                <div className={'w-24 flex-none'}>
                                    <div className={'flex justify-between text-[11px] text-fg-subtle'}>
                                        <span>CPU</span>
                                        <span className={'tabular-nums'}>{card.cpu}%</span>
                                    </div>
                                    <div className={'mt-1.5 h-1 rounded-full bg-surface-3'}>
                                        <motion.div
                                            className={'h-full rounded-full bg-accent'}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${card.cpu}%` }}
                                            transition={{ duration: 1.1, delay: 0.6 + index * 0.15, ease }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        <div className={'relative max-w-sm'}>
            <p className={'text-lg font-semibold tracking-tight text-fg'}>Every server, at a glance.</p>
            <p className={'mt-2 text-sm text-fg-muted'}>
                Start, monitor and manage everything you run from a single dashboard.
            </p>
        </div>
    </div>
);
