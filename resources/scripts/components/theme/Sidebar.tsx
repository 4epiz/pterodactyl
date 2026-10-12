import React, { useState } from 'react';
import { Link, NavLink, useRouteMatch } from 'react-router-dom';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { ExternalLinkIcon, LogoutIcon, ServerIcon, ShieldCheckIcon } from '@heroicons/react/outline';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import http from '@/api/http';
import Avatar from '@/components/Avatar';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';
import AccentPicker from '@/components/theme/AccentPicker';

type IconComponent = (props: React.ComponentProps<'svg'>) => JSX.Element;

interface NavItemProps {
    to: string;
    // Route pattern used to decide whether this item is active, defaults to "to".
    match?: string;
    exact?: boolean;
    icon: IconComponent;
    label: React.ReactNode;
    layoutGroup: string;
}

export const NavItem = ({ to, match, exact, icon: Icon, label, layoutGroup }: NavItemProps) => {
    const active = !!useRouteMatch({ path: match || to, exact });

    return (
        <NavLink
            to={to}
            exact={exact}
            className={classNames(
                'group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm no-underline transition-colors duration-150',
                active ? 'text-fg' : 'text-fg-muted hover:text-fg'
            )}
        >
            {active && (
                <motion.span
                    layoutId={`${layoutGroup}-active`}
                    className={'absolute inset-0 rounded-lg bg-surface shadow-card'}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                >
                    <span className={'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent'} />
                </motion.span>
            )}
            <Icon
                className={classNames(
                    'relative h-[18px] w-[18px] flex-none transition-colors duration-150',
                    active ? 'text-accent-text' : 'text-fg-subtle group-hover:text-fg-muted'
                )}
                strokeWidth={1.6}
            />
            <span className={'relative truncate font-medium'}>{label}</span>
        </NavLink>
    );
};

export const NavSection = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className={'mt-6 first:mt-0'}>
        {title && (
            <p className={'mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle'}>{title}</p>
        )}
        <nav className={'flex flex-col gap-0.5'}>{children}</nav>
    </div>
);

const Brand = () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);

    return (
        <Link to={'/'} className={'flex items-center gap-2.5 rounded-lg px-3 py-1 no-underline'}>
            <span
                className={
                    'flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-accent text-accent-fg shadow-card'
                }
            >
                <ServerIcon className={'h-4 w-4'} strokeWidth={1.8} />
            </span>
            <span className={'truncate text-[15px] font-semibold tracking-tight text-fg'}>{name}</span>
        </Link>
    );
};

const UserCard = () => {
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <div className={'flex items-center gap-3 rounded-xl px-2 py-2'}>
            <SpinnerOverlay visible={isLoggingOut} fixed />
            <Link
                to={'/account'}
                className={'flex min-w-0 flex-1 items-center gap-3 rounded-lg no-underline'}
                title={'Account settings'}
            >
                <span className={'h-8 w-8 flex-none overflow-hidden rounded-full ring-1 ring-line'}>
                    <Avatar.User size={32} />
                </span>
                <span className={'min-w-0'}>
                    <span className={'block truncate text-sm font-medium text-fg'}>{user.username}</span>
                    <span className={'block truncate text-xs text-fg-subtle'}>{user.email}</span>
                </span>
            </Link>
            <button
                type={'button'}
                onClick={onTriggerLogout}
                title={'Sign out'}
                aria-label={'Sign out'}
                className={
                    'flex h-8 w-8 flex-none items-center justify-center rounded-lg text-fg-subtle transition-colors duration-150 hover:bg-surface-3 hover:text-fg'
                }
            >
                <LogoutIcon className={'h-[18px] w-[18px]'} strokeWidth={1.6} />
            </button>
        </div>
    );
};

interface SidebarProps {
    // Rendered between the brand and the navigation, e.g. the current server.
    header?: React.ReactNode;
    children: React.ReactNode;
    // Distinguishes the desktop and mobile instances for shared layout animations.
    instance: string;
}

const Sidebar = ({ header, children, instance }: SidebarProps) => {
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);

    return (
        <div className={'flex h-full flex-col'}>
            <div className={'flex h-14 flex-none items-center px-3'}>
                <Brand />
            </div>
            {header && <div className={'px-3 pb-2'}>{header}</div>}
            <div className={'flex-1 overflow-y-auto px-3 py-3'}>
                {children}
                {rootAdmin && (
                    <NavSection title={'Administration'}>
                        <a
                            href={'/admin'}
                            className={
                                'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-fg-muted no-underline hover:text-fg'
                            }
                        >
                            <ShieldCheckIcon className={'h-[18px] w-[18px] text-fg-subtle'} strokeWidth={1.6} />
                            <span className={'flex-1'}>Admin area</span>
                            <ExternalLinkIcon className={'h-3.5 w-3.5 text-fg-subtle'} strokeWidth={1.8} />
                        </a>
                    </NavSection>
                )}
            </div>
            <div className={'flex-none space-y-2.5 border-t border-line px-3 pt-3 pb-2'}>
                <ThemeSwitcher id={`${instance}-theme`} />
                <AccentPicker id={`${instance}-accent`} />
                <UserCard />
            </div>
        </div>
    );
};

export default Sidebar;
