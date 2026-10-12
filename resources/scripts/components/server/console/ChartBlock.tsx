import React from 'react';
import classNames from 'classnames';
import styles from '@/components/server/console/style.module.css';

interface ChartBlockProps {
    title: string;
    // Current reading, shown large next to the title.
    value?: React.ReactNode;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ title, value, legend, children }: ChartBlockProps) => (
    <div className={classNames(styles.chart_container, 'group')}>
        <div className={'flex items-start justify-between gap-3 px-4 pt-4 pb-1'}>
            <div className={'min-w-0'}>
                <h3 className={'text-xs font-medium text-fg-subtle'}>{title}</h3>
                {value !== undefined && (
                    <p className={'mt-1 truncate text-xl font-semibold tabular-nums tracking-tight text-fg'}>{value}</p>
                )}
            </div>
            {legend && <div className={'flex items-center gap-3 pt-0.5 text-xs text-fg-subtle'}>{legend}</div>}
        </div>
        <div className={'z-10 px-1 pb-2'}>{children}</div>
    </div>
);
