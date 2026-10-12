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

// Text colour for a status, used on its own (no dots or badges needed).
export const toneText: Record<StatusTone, string> = {
    running: 'text-emerald-600 dark:text-emerald-400',
    starting: 'text-amber-600 dark:text-amber-400',
    offline: 'text-fg-subtle',
    error: 'text-red-600 dark:text-red-400',
    unknown: 'text-fg-subtle',
};
