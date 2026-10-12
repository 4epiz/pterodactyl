import React from 'react';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import { Accent, ACCENTS, useTheme } from '@/components/theme/ThemeProvider';

// Swatch colours match the light theme values in assets/tailwind.css.
const swatch: Record<Accent, string> = {
    mono: 'linear-gradient(135deg, #18181b 50%, #e4e4e7 50%)',
    blue: '#2563eb',
    violet: '#7c3aed',
    emerald: '#059669',
    amber: '#f59e0b',
    rose: '#e11d48',
};

export default ({ id = 'accent' }: { id?: string }) => {
    const { accent, setAccent } = useTheme();

    return (
        <div className={'flex items-center justify-between'}>
            <span className={'text-xs text-fg-subtle'}>Accent</span>
            <div role={'radiogroup'} aria-label={'Accent colour'} className={'flex items-center gap-1.5'}>
                {ACCENTS.map((value) => (
                    <button
                        key={value}
                        type={'button'}
                        role={'radio'}
                        aria-checked={accent === value}
                        aria-label={value}
                        title={value.charAt(0).toUpperCase() + value.slice(1)}
                        onClick={() => setAccent(value)}
                        className={'relative flex h-5 w-5 items-center justify-center rounded-full'}
                    >
                        {accent === value && (
                            <motion.span
                                layoutId={`${id}-ring`}
                                className={'absolute inset-0 rounded-full ring-2 ring-fg/70'}
                                transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                            />
                        )}
                        <span
                            className={classNames(
                                'h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-line-strong transition-transform duration-150',
                                accent === value ? 'scale-100' : 'scale-90 hover:scale-100'
                            )}
                            style={{ background: swatch[value] }}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};
