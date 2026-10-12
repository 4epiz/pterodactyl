import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import { ServerContext } from '@/state/server';
import { ip } from '@/lib/formatters';
import StatusDot, { StatusTone, toneForPowerState } from '@/components/theme/StatusDot';
import { capitalize } from '@/lib/strings';
import classNames from 'classnames';

const toneText: Record<StatusTone, string> = {
    running: 'text-emerald-600 dark:text-emerald-400',
    starting: 'text-amber-600 dark:text-amber-400',
    offline: 'text-fg-subtle',
    error: 'text-red-600 dark:text-red-400',
    unknown: 'text-fg-subtle',
};

export default () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const address = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);

        return !match ? null : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    return (
        <div>
            <Link
                to={'/'}
                className={
                    'mb-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-fg-subtle no-underline hover:text-fg'
                }
            >
                <ArrowLeftIcon className={'h-3.5 w-3.5'} strokeWidth={2} />
                All servers
            </Link>
            <div
                className={'rounded-xl bg-surface p-3 shadow-card'}
                style={{
                    backgroundImage: 'linear-gradient(135deg, rgb(var(--accent) / 0.14), transparent 65%)',
                }}
            >
                <div className={'flex items-center gap-2'}>
                    <StatusDot tone={toneForPowerState(status)} />
                    <p className={'truncate text-sm font-semibold text-fg'} title={name}>
                        {name}
                    </p>
                </div>
                <div className={'mt-1.5 flex items-center justify-between gap-2 text-xs'}>
                    <span className={classNames('font-medium', toneText[toneForPowerState(status)])}>
                        {status ? capitalize(status) : 'Connecting…'}
                    </span>
                    {address && <span className={'truncate font-mono text-fg-subtle'}>{address}</span>}
                </div>
            </div>
        </div>
    );
};
