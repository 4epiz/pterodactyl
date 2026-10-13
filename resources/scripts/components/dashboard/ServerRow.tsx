import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { ClockIcon, ServerIcon } from '@heroicons/react/outline';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { ip } from '@/lib/formatters';
import { StatusTone, toneForPowerState } from '@/components/theme/status';
import StatusBadge from '@/components/theme/StatusBadge';
import Meter from '@/components/theme/Meter';
import GameArt from '@/components/theme/GameArt';
import { detectGame, gameLabels } from '@/components/theme/games';

type Timer = ReturnType<typeof setInterval>;

export const formatUptime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes % 60}m`;
};

const Metric = ({ label, ratio }: { label: string; ratio: number | null }) => (
    <div className={'min-w-0'}>
        <div className={'flex items-baseline justify-between gap-2 text-[11px]'}>
            <span className={'text-fg-subtle'}>{label}</span>
            <span className={'font-medium tabular-nums text-fg'}>
                {ratio === null ? '—' : `${Math.round(Math.min(ratio, 9.99) * 100)}%`}
            </span>
        </div>
        <Meter value={ratio} className={'mt-2'} />
    </div>
);

interface Props {
    server: Server;
    className?: string;
    // Lets the dashboard aggregate usage across the visible servers.
    onStats?: (uuid: string, stats: ServerStats | null) => void;
}

export default ({ server, className, onStats }: Props) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        onStats?.(server.uuid, stats);
    }, [stats]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended || server.isNodeUnderMaintenance) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended, server.isNodeUnderMaintenance]);

    const allocation = server.allocations.find((alloc) => alloc.isDefault);
    const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : null;

    let tone: StatusTone = toneForPowerState(stats?.status);
    let label: string = stats?.status ? stats.status : 'Connecting';
    if (isSuspended) {
        tone = 'error';
        label = server.status === 'suspended' ? 'Suspended' : 'Connection error';
    } else if (server.isNodeUnderMaintenance) {
        tone = 'starting';
        label = 'Maintenance';
    } else if (server.isTransferring || server.status) {
        tone = 'unknown';
        label = server.isTransferring
            ? 'Transferring'
            : server.status === 'installing'
            ? 'Installing'
            : server.status === 'restoring_backup'
            ? 'Restoring backup'
            : 'Unavailable';
    }

    const showStats = !!stats && !isSuspended && !server.isNodeUnderMaintenance;
    const ratio = (current: number, limitMb: number, factor = 1024 * 1024) =>
        showStats && limitMb > 0 ? current / (limitMb * factor) : null;
    const running = showStats && stats!.status !== 'offline' && stats!.uptime > 0;

    const game = detectGame(server);

    return (
        <Link
            to={`/server/${server.id}`}
            className={classNames(
                'panel group relative flex h-full flex-col rounded-[1.375rem] p-2 no-underline transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-pop',
                className
            )}
        >
            <div className={'relative h-[9.5rem] overflow-hidden rounded-2xl'}>
                <GameArt
                    game={game}
                    seed={server.uuid}
                    className={
                        'absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]'
                    }
                />
                <div
                    className={'absolute inset-0'}
                    style={{ background: 'linear-gradient(to bottom, transparent 40%, rgb(0 0 0 / 0.55))' }}
                />
                <StatusBadge tone={tone} label={label} variant={'overlay'} className={'absolute left-2.5 top-2.5'} />
                <span className={'absolute bottom-2.5 left-3 text-xs font-semibold text-white'}>
                    {server.eggName || gameLabels[game]}
                </span>
            </div>
            <div className={'flex flex-1 flex-col px-2.5 pb-2 pt-3.5'}>
                <div className={'flex items-start justify-between gap-3'}>
                    <div className={'min-w-0'}>
                        <p className={'truncate text-[15px] font-semibold tracking-tight text-fg'}>{server.name}</p>
                        <p className={'mt-0.5 truncate font-mono text-xs text-fg-subtle'}>
                            {address || 'No allocation'}
                        </p>
                    </div>
                    <span
                        className={
                            'flex h-7 flex-none items-center gap-1.5 rounded-lg bg-surface-3 px-2.5 text-xs tabular-nums text-fg-muted'
                        }
                        title={running ? 'Uptime' : 'Node'}
                    >
                        {running ? (
                            <>
                                <ClockIcon className={'h-3.5 w-3.5'} strokeWidth={1.8} />
                                {formatUptime(stats!.uptime)}
                            </>
                        ) : (
                            <>
                                <ServerIcon className={'h-3.5 w-3.5'} strokeWidth={1.8} />
                                {server.node}
                            </>
                        )}
                    </span>
                </div>
                <div className={'mt-auto grid grid-cols-3 gap-3 pt-4'}>
                    <Metric
                        label={'CPU'}
                        ratio={showStats && server.limits.cpu > 0 ? stats!.cpuUsagePercent / server.limits.cpu : null}
                    />
                    <Metric label={'RAM'} ratio={ratio(stats?.memoryUsageInBytes ?? 0, server.limits.memory)} />
                    <Metric label={'Disk'} ratio={ratio(stats?.diskUsageInBytes ?? 0, server.limits.disk)} />
                </div>
            </div>
        </Link>
    );
};
