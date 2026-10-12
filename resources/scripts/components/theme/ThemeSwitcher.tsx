import React from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { DesktopComputerIcon, MoonIcon, SunIcon } from '@heroicons/react/outline';
import { ThemeMode, useTheme } from '@/components/theme/ThemeProvider';

const options: { mode: ThemeMode; label: string; icon: typeof SunIcon }[] = [
    { mode: 'light', label: 'Light', icon: SunIcon },
    { mode: 'dark', label: 'Dark', icon: MoonIcon },
    { mode: 'system', label: 'System', icon: DesktopComputerIcon },
];

interface Props {
    className?: string;
    // Used to keep the shared layout animation separate when the switcher is
    // rendered more than once (desktop sidebar and mobile drawer).
    id?: string;
}

export default ({ className, id = 'theme-switcher' }: Props) => {
    const { mode, setMode } = useTheme();

    return (
        <div
            role={'radiogroup'}
            aria-label={'Colour theme'}
            className={classNames('relative grid grid-cols-3 rounded-lg bg-surface-3/60 p-0.5', className)}
        >
            {options.map(({ mode: value, label, icon: Icon }) => {
                const active = value === mode;

                return (
                    <button
                        key={value}
                        type={'button'}
                        role={'radio'}
                        aria-checked={active}
                        title={label}
                        onClick={(e) => setMode(value, { x: e.clientX, y: e.clientY })}
                        className={classNames(
                            'relative flex h-7 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors duration-150',
                            active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted'
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId={`${id}-pill`}
                                className={'absolute inset-0 rounded-md bg-surface shadow-card'}
                                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                            />
                        )}
                        <Icon className={'relative h-3.5 w-3.5'} strokeWidth={1.8} />
                        <span className={'relative'}>{label}</span>
                    </button>
                );
            })}
        </div>
    );
};
