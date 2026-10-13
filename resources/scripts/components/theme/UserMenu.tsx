import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStoreState } from 'easy-peasy';
import { CogIcon, LogoutIcon, SelectorIcon, ShieldCheckIcon } from '@heroicons/react/outline';
import { ApplicationStore } from '@/state';
import http from '@/api/http';
import Avatar from '@/components/Avatar';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';
import AccentPicker from '@/components/theme/AccentPicker';

const MenuLink = ({ icon: Icon, children, ...props }: { icon: typeof CogIcon } & React.ComponentProps<'a'>) => (
    <a
        {...props}
        className={
            'flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm text-fg-muted no-underline transition-colors hover:bg-surface-3 hover:text-fg'
        }
    >
        <Icon className={'h-4 w-4'} strokeWidth={1.7} />
        {children}
    </a>
);

/**
 * The account button at the bottom of the sidebar. Opens a menu with
 * appearance settings, account links and sign out.
 */
export default ({ instance }: { instance: string }) => {
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const [open, setOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const location = useLocation();

    useEffect(() => setOpen(false), [location.pathname]);

    useEffect(() => {
        if (!open) return;

        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);

        document.addEventListener('mousedown', onClick);
        window.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const onTriggerLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <div ref={ref} className={'relative'}>
            <SpinnerOverlay visible={isLoggingOut} fixed />
            <AnimatePresence>
                {open && (
                    <motion.div
                        role={'menu'}
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className={
                            'absolute inset-x-0 bottom-full z-30 mb-2 origin-bottom rounded-xl border border-line bg-surface p-2 shadow-pop'
                        }
                    >
                        <p className={'px-2.5 pt-1 pb-2 text-xs font-medium text-fg-subtle'}>Appearance</p>
                        <ThemeSwitcher id={`${instance}-theme`} />
                        <div className={'mt-3 px-1.5'}>
                            <AccentPicker id={`${instance}-accent`} />
                        </div>
                        <div className={'my-2 border-t border-line'} />
                        <Link
                            to={'/account'}
                            className={
                                'flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm text-fg-muted no-underline transition-colors hover:bg-surface-3 hover:text-fg'
                            }
                        >
                            <CogIcon className={'h-4 w-4'} strokeWidth={1.7} />
                            Account settings
                        </Link>
                        {user.rootAdmin && (
                            <MenuLink icon={ShieldCheckIcon} href={'/admin'}>
                                Admin area
                            </MenuLink>
                        )}
                        <MenuLink icon={LogoutIcon} href={'#'} onClick={onTriggerLogout}>
                            Sign out
                        </MenuLink>
                    </motion.div>
                )}
            </AnimatePresence>
            <button
                type={'button'}
                aria-haspopup={'menu'}
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className={
                    'flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-0 p-2.5 text-left transition-colors hover:border-line-strong'
                }
            >
                <span className={'h-8 w-8 flex-none overflow-hidden rounded-full ring-1 ring-line'}>
                    <Avatar.User size={32} />
                </span>
                <span className={'min-w-0 flex-1'}>
                    <span className={'block truncate text-sm font-medium text-fg'}>{user.username}</span>
                    <span className={'block truncate text-xs text-fg-subtle'}>{user.email}</span>
                </span>
                <SelectorIcon className={'h-4 w-4 flex-none text-fg-subtle'} strokeWidth={1.7} />
            </button>
        </div>
    );
};
