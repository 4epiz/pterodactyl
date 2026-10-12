import React, { useEffect, useMemo, useState } from 'react';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import UptimeDuration from '@/components/server/UptimeDuration';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import classNames from 'classnames';
import { capitalize } from '@/lib/strings';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Meter from '@/components/theme/Meter';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ChipIcon,
    ClipboardCopyIcon,
    ClockIcon,
    DatabaseIcon,
    GlobeAltIcon,
    ServerIcon,
    TemplateIcon,
} from '@heroicons/react/outline';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

type IconComponent = (props: React.ComponentProps<'svg'>) => JSX.Element;

interface RowProps {
    label: string;
    icon: IconComponent;
    meter?: number | null;
    children: React.ReactNode;
}

const Row = ({ label, icon: Icon, meter, children }: RowProps) => (
    <div className={'flex flex-1 flex-col justify-center px-4 py-3'}>
        <div className={'flex items-center gap-3'}>
            <span
                className={'flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface-3 text-fg-muted'}
            >
                <Icon className={'h-4 w-4'} strokeWidth={1.8} />
            </span>
            <span className={'flex-none text-xs text-fg-subtle'}>{label}</span>
            <span className={'ml-auto min-w-0 truncate text-right text-sm font-medium tabular-nums text-fg'}>
                {children}
            </span>
        </div>
        {meter !== undefined && <Meter value={meter} className={'mt-2.5'} />}
    </div>
);

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'ml-1 text-xs font-normal text-fg-subtle'}>/ {limit || <>&infin;</>}</span>
    </>
);

const ServerDetailsBlock = ({ className }: { className?: string }) => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });

    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);

    const textLimits = useMemo(
        () => ({
            cpu: limits?.cpu ? `${limits.cpu}%` : null,
            memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
            disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
        }),
        [limits]
    );

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);

        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let stats: any = {};
        try {
            stats = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: stats.memory_bytes,
            cpu: stats.cpu_absolute,
            disk: stats.disk_bytes,
            tx: stats.network.tx_bytes,
            rx: stats.network.rx_bytes,
            uptime: stats.uptime || 0,
        });
    });

    const offline = status === 'offline' || status === null;
    const ratio = (value: number, limit: number) => (offline || !limit ? null : value / limit);

    return (
        <div className={classNames('flex flex-col divide-y divide-line rounded-xl bg-surface shadow-card', className)}>
            <CopyOnClick text={allocation}>
                <div className={'group flex flex-1 items-center gap-3 px-4 py-3'}>
                    <span
                        className={
                            'flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface-3 text-fg-muted'
                        }
                    >
                        <GlobeAltIcon className={'h-4 w-4'} strokeWidth={1.8} />
                    </span>
                    <span className={'min-w-0 flex-1'}>
                        <span className={'block text-xs text-fg-subtle'}>Address</span>
                        <span className={'block font-mono text-[13px] leading-snug text-fg [overflow-wrap:anywhere]'}>
                            {/* Allow wrapping before the port rather than mid-number. */}
                            {allocation.includes(':') ? (
                                <>
                                    {allocation.slice(0, allocation.lastIndexOf(':'))}
                                    <wbr />
                                    {allocation.slice(allocation.lastIndexOf(':'))}
                                </>
                            ) : (
                                allocation
                            )}
                        </span>
                    </span>
                    <ClipboardCopyIcon
                        className={
                            'h-4 w-4 flex-none text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100'
                        }
                        strokeWidth={1.8}
                    />
                </div>
            </CopyOnClick>
            <Row label={'Uptime'} icon={ClockIcon}>
                {status === null ? (
                    'Offline'
                ) : stats.uptime > 0 ? (
                    <UptimeDuration uptime={stats.uptime / 1000} />
                ) : (
                    capitalize(status)
                )}
            </Row>
            <Row label={'CPU'} icon={ChipIcon} meter={ratio(stats.cpu, limits.cpu)}>
                {offline ? (
                    <span className={'text-fg-subtle'}>Offline</span>
                ) : (
                    <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                )}
            </Row>
            <Row label={'Memory'} icon={TemplateIcon} meter={ratio(stats.memory, mbToBytes(limits.memory))}>
                {offline ? (
                    <span className={'text-fg-subtle'}>Offline</span>
                ) : (
                    <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                )}
            </Row>
            <Row label={'Disk'} icon={DatabaseIcon} meter={limits.disk ? stats.disk / mbToBytes(limits.disk) : null}>
                <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
            </Row>
            <Row label={'Inbound'} icon={ArrowDownIcon}>
                {offline ? <span className={'text-fg-subtle'}>—</span> : bytesToString(stats.rx)}
            </Row>
            <Row label={'Outbound'} icon={ArrowUpIcon}>
                {offline ? <span className={'text-fg-subtle'}>—</span> : bytesToString(stats.tx)}
            </Row>
            <Row label={'Node'} icon={ServerIcon}>
                <span className={'font-mono text-[13px] font-normal'}>{node}</span>
            </Row>
        </div>
    );
};

export default ServerDetailsBlock;
