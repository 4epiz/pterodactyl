import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRightIcon, MenuAlt2Icon, XIcon } from '@heroicons/react/outline';
import SearchContainer from '@/components/dashboard/search/SearchContainer';

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
    <nav aria-label={'Breadcrumb'} className={'flex min-w-0 items-center gap-1.5 text-sm'}>
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
        <div className={'min-h-screen bg-app'}>
            <aside className={'fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-app lg:block'}>
                {sidebar('desktop')}
            </aside>

            <AnimatePresence>
                {open && (
                    <div className={'fixed inset-0 z-40 lg:hidden'}>
                        <motion.div
                            className={'absolute inset-0 backdrop-blur-[2px]'}
                            style={{ backgroundColor: 'rgb(0 0 0 / 0.45)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setOpen(false)}
                        />
                        <motion.aside
                            className={'absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] border-r border-line bg-app'}
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.32, ease }}
                        >
                            <button
                                type={'button'}
                                onClick={() => setOpen(false)}
                                aria-label={'Close menu'}
                                className={
                                    'absolute right-3 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-3 hover:text-fg'
                                }
                            >
                                <XIcon className={'h-4 w-4'} strokeWidth={1.8} />
                            </button>
                            {sidebar('mobile')}
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            <div className={'lg:pl-64'}>
                <header
                    className={
                        'sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-app/80 px-4 backdrop-blur-md sm:px-6'
                    }
                >
                    <button
                        type={'button'}
                        onClick={() => setOpen(true)}
                        aria-label={'Open menu'}
                        className={
                            '-ml-1.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg lg:hidden'
                        }
                    >
                        <MenuAlt2Icon className={'h-5 w-5'} strokeWidth={1.6} />
                    </button>
                    <div className={'min-w-0 flex-1'}>
                        <Breadcrumbs crumbs={crumbs} />
                    </div>
                    <SearchContainer />
                </header>
                <main className={'relative'}>
                    {/* Soft accent glow behind the top of each page. */}
                    <div
                        aria-hidden
                        className={'pointer-events-none absolute inset-x-0 top-0 h-72'}
                        style={{
                            background:
                                'radial-gradient(60% 100% at 50% 0%, rgb(var(--accent) / 0.09), transparent 70%)',
                        }}
                    />
                    <div className={'relative'}>{children}</div>
                </main>
            </div>
        </div>
    );
};
