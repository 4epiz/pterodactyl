import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, TerminalIcon } from '@heroicons/react/outline';
import { Server } from '@/api/server/getServer';
import { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip } from '@/lib/formatters';
import GameArt from '@/components/theme/GameArt';
import { detectGame, gameLabels } from '@/components/theme/games';
import { formatUptime } from '@/components/dashboard/ServerRow';

const Chip = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div
        className={'rounded-xl border border-white/10 px-3.5 py-2 text-xs text-white/70 backdrop-blur-md'}
        style={{ background: 'rgb(255 255 255 / 0.07)' }}
    >
        {label}
        <span className={'mt-0.5 block text-[15px] font-semibold tabular-nums text-white'}>{value}</span>
    </div>
);

/** The busiest running server, shown as a banner above the server list. */
export default ({ server, stats }: { server: Server; stats: ServerStats }) => {
    const game = detectGame(server);
    const allocation = server.allocations.find((alloc) => alloc.isDefault);
    const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : null;

    return (
        <div
            data-theme-scope={'dark'}
            className={'relative mt-3.5 overflow-hidden rounded-3xl border border-white/[0.06] bg-app'}
        >
            <div className={'absolute inset-y-0 right-0 w-full md:w-[70%]'}>
                <GameArt game={game} seed={server.uuid} align={'center'} className={'h-full w-full'} />
            </div>
            <div
                className={'absolute inset-0'}
                style={{
                    background:
                        'linear-gradient(90deg, rgb(7 7 8) 0%, rgb(7 7 8 / 0.92) 30%, rgb(7 7 8 / 0.55) 60%, rgb(7 7 8 / 0.1) 100%)',
                }}
            />
            <div className={'relative flex min-h-[15rem] flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end'}>
                <div className={'flex min-w-0 flex-1 flex-col'}>
                    <p className={'text-xs font-semibold uppercase tracking-[0.08em] text-accent-text'}>
                        Most active · {gameLabels[game]}
                    </p>
                    <h2 className={'mt-2 truncate text-3xl font-semibold tracking-[-0.03em] text-white'}>
                        {server.name}
                    </h2>
                    <p className={'mt-1.5 truncate text-sm text-white/65'}>
                        {server.eggName || gameLabels[game]}
                        {address && <span className={'font-mono'}> · {address}</span>}
                    </p>
                    <div className={'mt-6 flex flex-wrap gap-2.5'}>
                        <Chip label={'CPU'} value={`${stats.cpuUsagePercent.toFixed(0)}%`} />
                        <Chip label={'Memory'} value={bytesToString(stats.memoryUsageInBytes)} />
                        <Chip label={'Uptime'} value={stats.uptime > 0 ? formatUptime(stats.uptime) : '—'} />
                    </div>
                </div>
                <div className={'flex flex-none gap-2'}>
                    <Link
                        to={`/server/${server.id}/files`}
                        className={
                            'flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-[13px] font-semibold text-white no-underline backdrop-blur-md transition-colors hover:bg-white/10'
                        }
                        style={{ background: 'rgb(255 255 255 / 0.06)' }}
                    >
                        <FolderIcon className={'h-4 w-4'} strokeWidth={1.8} />
                        Files
                    </Link>
                    <Link
                        to={`/server/${server.id}`}
                        className={
                            'flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-[13px] font-semibold text-accent-fg no-underline transition-opacity hover:opacity-90'
                        }
                    >
                        <TerminalIcon className={'h-4 w-4'} strokeWidth={1.8} />
                        Open console
                    </Link>
                </div>
            </div>
        </div>
    );
};
