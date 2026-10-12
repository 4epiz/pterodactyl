import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { ServerIcon } from '@heroicons/react/outline';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { StatusTone, toneForPowerState } from '@/components/theme/StatusDot';
import StatusBadge from '@/components/theme/StatusBadge';
import Meter from '@/components/theme/Meter';
import { Metric as MetricName, metricBar } from '@/components/theme/metrics';

type Timer = ReturnType<typeof setInterval>;

const Metric = ({
    label,
    value,
    limit,
    ratio,
    metric,
}: {
    label: string;
    value: string;
    limit: string;
    ratio: number | null;
    metric: MetricName;
}) => (
    <div className={'min-w-0'}>
        <p className={'flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle'}>
            <span className={classNames('h-1.5 w-1.5 rounded-full', metricBar[metric])} />
            {label}
        </p>
        <p className={'mt-1 truncate text-sm font-medium tabular-nums text-fg'} title={`${value} of ${limit}`}>
            {value}
            <span className={'ml-1 text-xs font-normal text-fg-subtle'}>/ {limit}</span>
        </p>
        <Meter value={ratio} color={metricBar[metric]} className={'mt-2'} />
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

    return (
        <Link
            to={`/server/${server.id}`}
            className={classNames(
                'group relative flex h-full flex-col rounded-xl bg-surface p-4 no-underline shadow-card transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-pop hover:ring-1 hover:ring-accent/30',
                className
            )}
        >
            <div className={'flex items-start gap-3'}>
                <span
                    className={
                        'flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent/10 text-accent-text transition-colors duration-200 group-hover:bg-accent group-hover:text-accent-fg'
                    }
                >
                    <ServerIcon className={'h-5 w-5'} strokeWidth={1.5} />
                </span>
                <div className={'min-w-0 flex-1'}>
                    <p className={'truncate text-[15px] font-semibold tracking-tight text-fg'}>{server.name}</p>
                    <p className={'mt-0.5 truncate font-mono text-xs text-fg-subtle'}>{address || 'No allocation'}</p>
                </div>
                <StatusBadge tone={tone} label={label} />
            </div>
            <p className={'mt-3 min-h-[1.25rem] text-sm text-fg-muted line-clamp-1'}>
                {server.description || <span className={'text-fg-subtle'}>No description</span>}
            </p>
            <div className={'mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4'}>
                <Metric
                    metric={'cpu'}
                    label={'CPU'}
                    value={showStats ? `${stats!.cpuUsagePercent.toFixed(1)}%` : '—'}
                    limit={limits.cpu}
                    ratio={showStats ? ratio(stats!.cpuUsagePercent, server.limits.cpu) : null}
                />
                <Metric
                    metric={'memory'}
                    label={'Memory'}
                    value={showStats ? bytesToString(stats!.memoryUsageInBytes) : '—'}
                    limit={limits.memory}
                    ratio={showStats ? ratio(stats!.memoryUsageInBytes, mbToBytes(server.limits.memory)) : null}
                />
                <Metric
                    metric={'disk'}
                    label={'Disk'}
                    value={showStats ? bytesToString(stats!.diskUsageInBytes) : '—'}
                    limit={limits.disk}
                    ratio={showStats ? ratio(stats!.diskUsageInBytes, mbToBytes(server.limits.disk)) : null}
                />
            </div>
        </Link>
    );
};
