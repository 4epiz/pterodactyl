import React from 'react';
import { motion } from 'framer-motion';
import StatusDot, { StatusTone } from '@/components/theme/StatusDot';

const ease = [0.22, 1, 0.36, 1];

const MiniServer = ({ name, tone, cpu, memory }: { name: string; tone: StatusTone; cpu: number; memory: number }) => (
    <div className={'rounded-xl bg-surface p-4 shadow-pop'}>
        <div className={'flex items-center justify-between'}>
            <span className={'text-sm font-semibold text-fg'}>{name}</span>
            <StatusDot tone={tone} />
        </div>
        <div className={'mt-4 grid grid-cols-2 gap-4'}>
            {[
                ['CPU', cpu],
                ['Memory', memory],
            ].map(([label, value]) => (
                <div key={label}>
                    <div className={'flex justify-between text-[11px] text-fg-subtle'}>
                        <span>{label}</span>
                        <span className={'tabular-nums'}>{value}%</span>
                    </div>
                    <div className={'mt-1.5 h-1 rounded-full bg-surface-3'}>
                        <motion.div
                            className={'h-full rounded-full bg-ink'}
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1.1, delay: 0.5, ease }}
                        />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const lines = [
    ['text-zinc-500', '[09:41:02]'],
    ['text-zinc-300', 'Done (6.1s)! For help, type "help"'],
    ['text-zinc-500', '[09:41:18]'],
    ['text-zinc-300', 'Player joined the game'],
];

/**
 * Decorative product preview shown beside the authentication forms on large
 * screens. Purely presentational.
 */
export default () => (
    <div
        className={
            'relative flex h-full min-h-[calc(100vh-1.5rem)] flex-col justify-between overflow-hidden rounded-2xl bg-surface-2 p-10 ring-1 ring-inset ring-line'
        }
    >
        <div
            aria-hidden
            className={'pointer-events-none absolute inset-0'}
            style={{
                backgroundImage:
                    'linear-gradient(rgb(var(--line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line)) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 75%)',
            }}
        />

        <div className={'relative flex flex-1 items-center justify-center'}>
            <div className={'relative w-full max-w-sm'}>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease }}
                    className={'overflow-hidden rounded-xl shadow-pop'}
                    style={{ background: 'rgb(var(--term-bg))' }}
                >
                    <div
                        className={'flex items-center justify-between px-4 py-2.5 text-[11px]'}
                        style={{ color: 'rgb(var(--term-muted))', borderBottom: '1px solid rgb(var(--term-line))' }}
                    >
                        <span className={'font-medium text-zinc-300'}>Console</span>
                        <span className={'flex items-center gap-1.5'}>
                            <span className={'h-1.5 w-1.5 rounded-full bg-emerald-400'} />
                            Live
                        </span>
                    </div>
                    <div className={'space-y-1 px-4 py-3 font-mono text-[11.5px] leading-relaxed'}>
                        {[0, 2].map((i) => (
                            <motion.p
                                key={i}
                                className={'truncate'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.25 }}
                            >
                                <span className={lines[i][0]}>{lines[i][1]}</span>{' '}
                                <span className={lines[i + 1][0]}>{lines[i + 1][1]}</span>
                            </motion.p>
                        ))}
                        <motion.span
                            className={'inline-block h-3.5 w-1.5 translate-y-0.5 bg-zinc-400'}
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1.1, repeat: Infinity }}
                        />
                    </div>
                </motion.div>

                <motion.div
                    className={'relative z-10 -mt-3 ml-10 -mr-6'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.25, ease }}
                >
                    <MiniServer name={'Survival SMP'} tone={'running'} cpu={38} memory={62} />
                </motion.div>
                <motion.div
                    className={'relative -mt-2 -ml-6 mr-12'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4, ease }}
                >
                    <MiniServer name={'Proxy'} tone={'starting'} cpu={12} memory={24} />
                </motion.div>
            </div>
        </div>

        <div className={'relative max-w-sm'}>
            <p className={'text-lg font-semibold tracking-tight text-fg'}>All of your servers, in one calm place.</p>
            <p className={'mt-2 text-sm text-fg-muted'}>
                Start, monitor and manage everything you run from a single dashboard.
            </p>
        </div>
    </div>
);
