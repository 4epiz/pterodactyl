import React, { useEffect, useRef } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { Line } from 'react-chartjs-2';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { bytesToString } from '@/lib/formatters';
import ChartBlock from '@/components/server/console/ChartBlock';
import { metricToken } from '@/components/theme/metrics';

export default () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const cpu = useChartTickLabel('CPU', limits.cpu, '%', 2, metricToken.cpu);
    const memory = useChartTickLabel('Memory', limits.memory, 'MiB', undefined, metricToken.memory);
    const network = useChart('Network', {
        sets: 2,
        // Dataset 0 carries transmitted (outbound) bytes, dataset 1 received.
        colors: [metricToken['net-out'], metricToken['net-in']],
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
            <ChartBlock
                title={'CPU load'}
                metric={'cpu'}
                value={offline || cpuNow === null ? '—' : `${cpuNow.toFixed(1)}%`}
            >
                <Line {...cpu.props} />
            </ChartBlock>
            <ChartBlock
                title={'Memory'}
                metric={'memory'}
                value={offline || memoryNow === null ? '—' : bytesToString(memoryNow * 1024 * 1024)}
            >
                <Line {...memory.props} />
            </ChartBlock>
            <ChartBlock
                title={'Network'}
                metric={'net-in'}
                value={offline ? '—' : undefined}
                legend={
                    <>
                        {/* Dataset 0 carries transmitted (outbound) bytes, dataset 1 received. */}
                        <span className={'flex items-center gap-1.5'}>
                            <span className={'h-1 w-3 rounded-full bg-metric-net-in'} />
                            In
                        </span>
                        <span className={'flex items-center gap-1.5'}>
                            <span className={'h-1 w-3 rounded-full bg-metric-net-out'} />
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
