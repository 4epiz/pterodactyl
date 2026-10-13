import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRightIcon, MenuAlt2Icon, XIcon } from '@heroicons/react/outline';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import ThemeToggle from '@/components/theme/ThemeToggle';
import Announcement from '@/components/theme/Announcement';
import { themeConfig } from '@/components/theme/config';

export interface Crumb {
    label: React.ReactNode;
    to?: string;
}

interface Props {
    // Function so the desktop and mobile sidebars get independent instances.
    sidebar: (instance: string) => React.ReactNode;
    crumbs?: Crumb[];
    // Optional strip rendered under the top bar (alerts, listeners, ...).
    children: React.ReactNode;
}

const ease = [0.22, 1, 0.36, 1];

export const Breadcrumbs = ({ crumbs }: { crumbs: Crumb[] }) => (
    <nav aria-label={'Breadcrumb'} className={'flex min-w-0 items-center gap-1.5 text-[15px]'}>
        {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;

            return (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <ChevronRightIcon className={'h-3.5 w-3.5 flex-none text-fg-subtle/70'} strokeWidth={2} />
                    )}
                    {crumb.to && !last ? (
                        <Link to={crumb.to} className={'truncate text-fg-subtle no-underline hover:text-fg'}>
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className={last ? 'truncate font-medium text-fg' : 'truncate text-fg-subtle'}>
                            {crumb.label}
                        </span>
                    )}
                </React.Fragment>
            );
        })}
    </nav>
);

export default ({ sidebar, crumbs = [], children }: Props) => {
    const location = useLocation();
    const [open, setOpen] = useState(false);

    // Close the mobile drawer whenever the user navigates.
    useEffect(() => setOpen(false), [location.pathname]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <div className={'relative min-h-screen bg-app'}>
            {/* Faint accent wash behind the top of the page. */}
            <div
                aria-hidden
                className={'pointer-events-none absolute inset-x-0 top-0 h-[32rem]'}
                style={{
                    background: 'radial-gradient(60rem 28rem at 72% -12%, rgb(var(--accent) / 0.07), transparent 65%)',
                }}
            />
            {/* Floating sidebar (desktop). */}
            <aside
                className={'panel fixed inset-y-4 left-4 z-30 hidden w-[15.5rem] overflow-hidden rounded-3xl lg:block'}
            >
                {sidebar('desktop')}
            </aside>

            <AnimatePresence>
                {open && (
                    <div className={'fixed inset-0 z-40 lg:hidden'}>
                        <motion.div
                            className={'absolute inset-0 backdrop-blur-[2px]'}
                            style={{ backgroundColor: 'rgb(0 0 0 / 0.4)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setOpen(false)}
                        />
                        <motion.aside
                            className={
                                'panel absolute inset-y-3 left-3 w-[17rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl'
                            }
                            initial={{ x: '-110%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-110%' }}
                            transition={{ duration: 0.32, ease }}
                        >
                            <button
                                type={'button'}
                                onClick={() => setOpen(false)}
                                aria-label={'Close menu'}
                                className={
                                    'absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-3 hover:text-fg'
                                }
                            >
                                <XIcon className={'h-4 w-4'} strokeWidth={1.8} />
                            </button>
                            {sidebar('mobile')}
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            <div className={'relative px-3 pt-3 lg:pl-[17.5rem] lg:pr-4 lg:pt-4'}>
                {/* Floating top bar. */}
                <header
                    className={
                        'sticky top-3 z-20 flex h-[3.75rem] items-center gap-2.5 rounded-2xl bg-surface/75 pl-3 pr-2.5 shadow-card backdrop-blur-xl sm:pl-5 lg:top-4'
                    }
                >
                    <button
                        type={'button'}
                        onClick={() => setOpen(true)}
                        aria-label={'Open menu'}
                        className={
                            'flex h-8 w-8 flex-none items-center justify-center rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg lg:hidden'
                        }
                    >
                        <MenuAlt2Icon className={'h-5 w-5'} strokeWidth={1.6} />
                    </button>
                    <div className={'min-w-0 flex-1'}>
                        <Breadcrumbs crumbs={crumbs} />
                    </div>
                    <SearchContainer />
                    {themeConfig().appearance.allow_mode_change && <ThemeToggle />}
                </header>
                <Announcement />
                <main>{children}</main>
            </div>
        </div>
    );
};
