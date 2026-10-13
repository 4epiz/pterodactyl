import React from 'react';
import classNames from 'classnames';
import { ChipIcon, DatabaseIcon, ServerIcon, TemplateIcon } from '@heroicons/react/outline';
import { Server } from '@/api/server/getServer';
import { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, mbToBytes } from '@/lib/formatters';
import Meter from '@/components/theme/Meter';

type IconComponent = (props: React.ComponentProps<'svg'>) => JSX.Element;

const Tile = ({
    icon: Icon,
    label,
    value,
    unit,
    children,
}: {
    icon: IconComponent;
    label: string;
    value: React.ReactNode;
    unit?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className={'panel flex flex-col rounded-[1.375rem] p-5'}>
        <div className={'flex items-center gap-2.5 text-[13px] text-fg-muted'}>
            <span className={'flex h-7 w-7 items-center justify-center rounded-[0.6rem] bg-surface-3 text-fg'}>
                <Icon className={'h-4 w-4'} strokeWidth={1.7} />
            </span>
            {label}
        </div>
        <p className={'mt-4 truncate'}>
            <span className={'text-[1.75rem] font-semibold tabular-nums tracking-[-0.03em] text-fg'}>{value}</span>
            {unit && <span className={'ml-1.5 text-sm text-fg-subtle'}>{unit}</span>}
        </p>
        <div className={'mt-4'}>{children}</div>
    </div>
);

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/**
 * Totals across the servers on the current dashboard page, from the usage
 * each server card already polls.
 */
export default ({ servers, stats }: { servers: Server[]; stats: Record<string, ServerStats | null> }) => {
    const live = servers.filter((server) => stats[server.uuid] && stats[server.uuid]!.status !== 'offline');
    const reported = servers.filter((server) => stats[server.uuid]);

    const cpu = sum(live.map((server) => stats[server.uuid]!.cpuUsagePercent));
    const cpuLimit = sum(servers.map((server) => server.limits.cpu));
    const memory = sum(live.map((server) => stats[server.uuid]!.memoryUsageInBytes));
    const memoryLimit = sum(servers.map((server) => mbToBytes(server.limits.memory)));
    const disk = sum(reported.map((server) => stats[server.uuid]!.diskUsageInBytes));
    const diskLimit = sum(servers.map((server) => mbToBytes(server.limits.disk)));

    const ratio = (value: number, limit: number) => (limit > 0 ? value / limit : null);
    const [memValue, memUnit] = bytesToString(memory).split(' ');
    const [diskValue, diskUnit] = bytesToString(disk).split(' ');

    return (
        <div className={'grid grid-cols-2 gap-3.5 lg:grid-cols-4'}>
            <Tile icon={ServerIcon} label={'Servers online'} value={live.length} unit={`/ ${servers.length}`}>
                <div className={'flex h-1 gap-1'}>
                    {servers.slice(0, 24).map((server) => (
                        <span
                            key={server.uuid}
                            className={classNames(
                                'flex-1 rounded-full',
                                live.includes(server) ? 'bg-fg' : 'bg-fg/[0.08]'
                            )}
                        />
                    ))}
                </div>
            </Tile>
            <Tile
                icon={ChipIcon}
                label={'CPU usage'}
                value={cpuLimit > 0 ? Math.round((cpu / cpuLimit) * 100) : Math.round(cpu)}
                unit={cpuLimit > 0 ? '% used' : '%'}
            >
                <Meter value={ratio(cpu, cpuLimit)} />
            </Tile>
            <Tile
                icon={TemplateIcon}
                label={'Memory'}
                value={memValue}
                unit={`${memUnit} / ${memoryLimit ? bytesToString(memoryLimit) : '∞'}`}
            >
                <Meter value={ratio(memory, memoryLimit)} />
            </Tile>
            <Tile
                icon={DatabaseIcon}
                label={'Disk'}
                value={diskValue}
                unit={`${diskUnit} / ${diskLimit ? bytesToString(diskLimit) : '∞'}`}
            >
                <Meter value={ratio(disk, diskLimit)} />
            </Tile>
        </div>
    );
};
