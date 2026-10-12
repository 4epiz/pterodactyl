import React from 'react';
import classNames from 'classnames';
import styles from '@/components/server/console/style.module.css';
import { Metric, metricBar } from '@/components/theme/metrics';

interface ChartBlockProps {
    title: string;
    // Colours the small marker next to the title.
    metric?: Metric;
    // Current reading, shown large next to the title.
    value?: React.ReactNode;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ title, metric, value, legend, children }: ChartBlockProps) => (
    <div className={classNames(styles.chart_container, 'group')}>
        <div className={'flex items-start justify-between gap-3 px-4 pt-4 pb-1'}>
            <div className={'min-w-0'}>
                <h3 className={'flex items-center gap-2 text-xs font-medium text-fg-subtle'}>
                    {metric && <span className={classNames('h-2 w-2 rounded-full', metricBar[metric])} />}
                    {title}
                </h3>
                {value !== undefined && (
                    <p className={'mt-1 truncate text-xl font-semibold tabular-nums tracking-tight text-fg'}>{value}</p>
                )}
            </div>
            {legend && <div className={'flex items-center gap-3 pt-0.5 text-xs text-fg-subtle'}>{legend}</div>}
        </div>
        <div className={'z-10 px-1 pb-2'}>{children}</div>
    </div>
);
