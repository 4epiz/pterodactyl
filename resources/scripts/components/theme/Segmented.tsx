import React from 'react';
import classNames from 'classnames';
import { motion } from 'framer-motion';

interface Option<T extends string> {
    value: T;
    label: React.ReactNode;
}

interface Props<T extends string> {
    id: string;
    value: T;
    options: Option<T>[];
    onChange: (value: T) => void;
    className?: string;
}

function Segmented<T extends string>({ id, value, options, onChange, className }: Props<T>) {
    return (
        <div
            role={'radiogroup'}
            className={classNames(
                'inline-flex rounded-lg bg-surface-3/70 p-0.5 ring-1 ring-inset ring-line',
                className
            )}
        >
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <button
                        key={option.value}
                        type={'button'}
                        role={'radio'}
                        aria-checked={active}
                        onClick={() => onChange(option.value)}
                        className={classNames(
                            'relative h-7 rounded-md px-3 text-xs font-medium transition-colors duration-150',
                            active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted'
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId={`${id}-segment`}
                                className={'absolute inset-0 rounded-md bg-surface shadow-card'}
                                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                            />
                        )}
                        <span className={'relative'}>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default Segmented;
