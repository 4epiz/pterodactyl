import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import { ServerContext } from '@/state/server';
import { ip } from '@/lib/formatters';
import StatusDot, { toneForPowerState } from '@/components/theme/StatusDot';
import { capitalize } from '@/lib/strings';

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
            <div className={'rounded-xl bg-surface p-3 shadow-card'}>
                <div className={'flex items-center gap-2'}>
                    <StatusDot tone={toneForPowerState(status)} />
                    <p className={'truncate text-sm font-semibold text-fg'} title={name}>
                        {name}
                    </p>
                </div>
                <div className={'mt-1.5 flex items-center justify-between gap-2 text-xs'}>
                    <span className={'text-fg-subtle'}>{status ? capitalize(status) : 'Connecting…'}</span>
                    {address && <span className={'truncate font-mono text-fg-subtle'}>{address}</span>}
                </div>
            </div>
        </div>
    );
};
