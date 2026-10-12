import React, { useEffect, useRef } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { Line } from 'react-chartjs-2';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { bytesToString } from '@/lib/formatters';
import ChartBlock from '@/components/server/console/ChartBlock';

export default () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const cpu = useChartTickLabel('CPU', limits.cpu, '%', 2);
    const memory = useChartTickLabel('Memory', limits.memory, 'MiB');
    const network = useChart('Network', {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
        },
        callback(opts, index) {
            return {
                ...opts,
                label: !index ? 'Network In' : 'Network Out',
            };
        },
    });

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
        }
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: any = {};
        try {
            values = JSON.parse(data);
        } catch (e) {
            return;
        }
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));
        network.push([
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
        ]);

        previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes };
    });

    const latest = (chart: typeof cpu): number | null => {
        const value = chart.props.data.datasets[0]?.data.slice(-1)[0];
        return typeof value === 'number' && value >= 0 ? value : null;
    };
    const cpuNow = latest(cpu);
    const memoryNow = latest(memory);
    const offline = status === 'offline';

    return (
        <>
            <ChartBlock title={'CPU load'} value={offline || cpuNow === null ? '—' : `${cpuNow.toFixed(1)}%`}>
                <Line {...cpu.props} />
            </ChartBlock>
            <ChartBlock
                title={'Memory'}
                value={offline || memoryNow === null ? '—' : bytesToString(memoryNow * 1024 * 1024)}
            >
                <Line {...memory.props} />
            </ChartBlock>
            <ChartBlock
                title={'Network'}
                value={offline ? '—' : undefined}
                legend={
                    <>
                        {/* Dataset 0 carries transmitted (outbound) bytes, dataset 1 received. */}
                        <span className={'flex items-center gap-1.5'}>
                            <span className={'h-0.5 w-3 rounded-full bg-fg-subtle'} />
                            In
                        </span>
                        <span className={'flex items-center gap-1.5'}>
                            <span className={'h-0.5 w-3 rounded-full bg-ink'} />
                            Out
                        </span>
                    </>
                }
            >
                <Line {...network.props} />
            </ChartBlock>
        </>
    );
};
