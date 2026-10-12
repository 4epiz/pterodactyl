import React from 'react';
import classNames from 'classnames';

export type StatusTone = 'running' | 'starting' | 'offline' | 'error' | 'unknown';

export const toneForPowerState = (state: string | null | undefined): StatusTone => {
    switch (state) {
        case 'running':
            return 'running';
        case 'starting':
        case 'stopping':
            return 'starting';
        case 'offline':
            return 'offline';
        default:
            return 'unknown';
    }
};

const colors: Record<StatusTone, string> = {
    running: 'bg-emerald-500',
    starting: 'bg-amber-500',
    offline: 'bg-fg-subtle/60',
    error: 'bg-red-500',
    unknown: 'bg-fg-subtle/30',
};

export default ({ tone, className }: { tone: StatusTone; className?: string }) => (
    <span className={classNames('relative inline-flex h-2 w-2 flex-none', className)} aria-hidden>
        {(tone === 'running' || tone === 'starting') && (
            <span
                className={classNames('absolute inset-0 rounded-full opacity-60 animate-ping', colors[tone])}
                style={{ animationDuration: tone === 'running' ? '2.4s' : '1.2s' }}
            />
        )}
        <span className={classNames('relative inline-flex h-2 w-2 rounded-full', colors[tone])} />
    </span>
);
