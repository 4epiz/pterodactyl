import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { StatusTone, toneForPowerState } from '@/components/theme/status';
import StatusBadge from '@/components/theme/StatusBadge';
import Meter from '@/components/theme/Meter';
import GameArt from '@/components/theme/GameArt';
import { detectGame, gameLabels } from '@/components/theme/games';

type Timer = ReturnType<typeof setInterval>;

const Metric = ({
    label,
    value,
    limit,
    ratio,
}: {
    label: string;
    value: string;
    limit: string;
    ratio: number | null;
}) => (
    <div className={'min-w-0'}>
        <p className={'text-xs text-fg-subtle'}>{label}</p>
        <p className={'mt-0.5 truncate text-sm font-medium tabular-nums text-fg'} title={`${value} of ${limit}`}>
            {value}
            <span className={'ml-1 text-xs font-normal text-fg-subtle'}>/ {limit}</span>
        </p>
        <Meter value={ratio} className={'mt-2'} />
    </div>
);

export default ({ server, className }: { server: Server; className?: string }) => {
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

    const limits = {
        cpu: server.limits.cpu !== 0 ? `${server.limits.cpu}%` : '∞',
        memory: server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : '∞',
        disk: server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : '∞',
    };
    const ratio = (current: number, limit: number) => (limit > 0 ? current / limit : null);
    const showStats = !!stats && !isSuspended && !server.isNodeUnderMaintenance;

    const game = detectGame(server);

    return (
        <Link
            to={`/server/${server.id}`}
            className={classNames(
                'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface no-underline shadow-card transition-all duration-300',
                'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop',
                className
            )}
        >
            <div className={'relative h-28 overflow-hidden'}>
                <GameArt
                    game={game}
                    seed={server.uuid}
                    className={
                        'absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]'
                    }
                />
                <div
                    className={'absolute inset-0'}
                    style={{ background: 'linear-gradient(to top, rgb(0 0 0 / 0.45), transparent 60%)' }}
                />
                <StatusBadge tone={tone} label={label} variant={'overlay'} className={'absolute right-3 top-3'} />
                <span className={'absolute bottom-3 left-4 text-xs font-medium text-white/90'}>
                    {server.eggName || gameLabels[game]}
                </span>
            </div>
            <div className={'flex flex-1 flex-col p-4'}>
                <p className={'truncate text-[15px] font-semibold tracking-tight text-fg'}>{server.name}</p>
                <p className={'mt-0.5 truncate font-mono text-xs text-fg-subtle'}>{address || 'No allocation'}</p>
                {server.description && (
                    <p className={'mt-2 text-sm text-fg-muted line-clamp-1'}>{server.description}</p>
                )}
                <div className={'mt-auto grid grid-cols-3 gap-4 pt-4'}>
                    <Metric
                        label={'CPU'}
                        value={showStats ? `${stats!.cpuUsagePercent.toFixed(1)}%` : '—'}
                        limit={limits.cpu}
                        ratio={showStats ? ratio(stats!.cpuUsagePercent, server.limits.cpu) : null}
                    />
                    <Metric
                        label={'Memory'}
                        value={showStats ? bytesToString(stats!.memoryUsageInBytes) : '—'}
                        limit={limits.memory}
                        ratio={showStats ? ratio(stats!.memoryUsageInBytes, mbToBytes(server.limits.memory)) : null}
                    />
                    <Metric
                        label={'Disk'}
                        value={showStats ? bytesToString(stats!.diskUsageInBytes) : '—'}
                        limit={limits.disk}
                        ratio={showStats ? ratio(stats!.diskUsageInBytes, mbToBytes(server.limits.disk)) : null}
                    />
                </div>
            </div>
        </Link>
    );
};
