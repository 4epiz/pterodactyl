import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoonIcon, SunIcon } from '@heroicons/react/outline';
import { useTheme } from '@/components/theme/ThemeProvider';

// Compact light/dark toggle for places without room for the full switcher.
export default () => {
    const { resolved, setMode } = useTheme();
    const next = resolved === 'dark' ? 'light' : 'dark';

    return (
        <button
            type={'button'}
            onClick={(e) => setMode(next, { x: e.clientX, y: e.clientY })}
            aria-label={`Switch to ${next} theme`}
            title={`Switch to ${next} theme`}
            className={
                'relative flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-0 text-fg-muted transition-colors hover:border-line-strong hover:text-fg'
            }
        >
            <AnimatePresence initial={false} exitBeforeEnter>
                <motion.span
                    key={resolved}
                    initial={{ y: 12, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -12, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2 }}
                >
                    {resolved === 'dark' ? (
                        <MoonIcon className={'h-[18px] w-[18px]'} strokeWidth={1.6} />
                    ) : (
                        <SunIcon className={'h-[18px] w-[18px]'} strokeWidth={1.6} />
                    )}
                </motion.span>
            </AnimatePresence>
        </button>
    );
};
