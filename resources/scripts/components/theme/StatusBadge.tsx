import React from 'react';
import classNames from 'classnames';
import { StatusTone } from '@/components/theme/status';

const tones: Record<StatusTone, string> = {
    running: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-300',
    starting: 'text-amber-700 bg-amber-500/10 dark:text-amber-300',
    offline: 'text-fg-muted bg-surface-3',
    error: 'text-red-700 bg-red-500/10 dark:text-red-300',
    unknown: 'text-fg-muted bg-surface-3',
};

interface Props {
    tone: StatusTone;
    label: string;
    // "overlay" is for use on top of artwork.
    variant?: 'default' | 'overlay';
    className?: string;
}

export default ({ tone, label, variant = 'default', className }: Props) => (
    <span
        className={classNames(
            'inline-flex flex-none items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize',
            variant === 'overlay' ? 'bg-[rgba(0,0,0,0.45)] text-white backdrop-blur-md' : tones[tone],
            className
        )}
    >
        {label}
    </span>
);
