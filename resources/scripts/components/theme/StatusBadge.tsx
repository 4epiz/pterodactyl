import React from 'react';
import classNames from 'classnames';
import StatusDot, { StatusTone } from '@/components/theme/StatusDot';

const tones: Record<StatusTone, string> = {
    running: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400',
    starting: 'bg-amber-500/10 text-amber-600 ring-amber-500/25 dark:text-amber-400',
    offline: 'bg-surface-3/70 text-fg-muted ring-line',
    error: 'bg-red-500/10 text-red-600 ring-red-500/25 dark:text-red-400',
    unknown: 'bg-surface-3/70 text-fg-muted ring-line',
};

export default ({ tone, label, className }: { tone: StatusTone; label: string; className?: string }) => (
    <span
        className={classNames(
            'inline-flex flex-none items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-xs font-medium capitalize ring-1 ring-inset',
            tones[tone],
            className
        )}
    >
        <StatusDot tone={tone} />
        {label}
    </span>
);
