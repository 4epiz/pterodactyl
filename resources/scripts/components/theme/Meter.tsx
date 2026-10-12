import React from 'react';
import classNames from 'classnames';
import { motion } from 'framer-motion';

interface Props {
    // 0 - 1, values outside of this range are clamped. Null renders an empty track.
    value: number | null;
    className?: string;
}

export const meterTone = (value: number | null) =>
    value === null ? 'bg-fg-subtle/40' : value >= 0.9 ? 'bg-red-500' : value >= 0.8 ? 'bg-amber-500' : 'bg-ink';

export default ({ value, className }: Props) => {
    const width = value === null ? 0 : Math.min(1, Math.max(0, value));

    return (
        <div className={classNames('h-1 w-full overflow-hidden rounded-full bg-surface-3', className)}>
            <motion.div
                className={classNames('h-full rounded-full', meterTone(value))}
                initial={false}
                animate={{ width: `${Math.max(width * 100, value ? 2 : 0)}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
        </div>
    );
};
