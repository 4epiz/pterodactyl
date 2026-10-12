import React from 'react';
import { Link, NavLink, useRouteMatch } from 'react-router-dom';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import UserMenu from '@/components/theme/UserMenu';

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
                'group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm no-underline transition-colors duration-150',
                active ? 'text-fg' : 'text-fg-muted hover:text-fg'
            )}
        >
            {active && (
                <motion.span
                    layoutId={`${layoutGroup}-active`}
                    className={'absolute inset-0 rounded-lg bg-surface-3'}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
            )}
            <Icon
                className={classNames(
                    'relative h-[18px] w-[18px] flex-none transition-colors duration-150',
                    active ? 'text-fg' : 'text-fg-subtle group-hover:text-fg-muted'
                )}
                strokeWidth={1.6}
            />
            <span className={'relative truncate font-medium'}>{label}</span>
        </NavLink>
    );
};

export const NavSection = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className={'mt-5 first:mt-0'}>
        {title && <p className={'mb-1 px-2.5 text-xs font-medium text-fg-subtle'}>{title}</p>}
        <nav className={'flex flex-col gap-0.5'}>{children}</nav>
    </div>
);

export const Brand = ({ className }: { className?: string }) => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data?.name || 'Pterodactyl');

    return (
        <Link to={'/'} className={classNames('flex min-w-0 items-center gap-2.5 no-underline', className)}>
            <img src={'/assets/svgs/pterodactyl.svg'} alt={''} className={'h-8 w-8 flex-none'} />
            <span className={'truncate text-[15px] font-semibold tracking-tight text-fg'}>{name}</span>
        </Link>
    );
};

interface SidebarProps {
    // Rendered between the brand and the navigation, e.g. the current server.
    header?: React.ReactNode;
    children: React.ReactNode;
    // Distinguishes the desktop and mobile instances for shared layout animations.
    instance: string;
}

const Sidebar = ({ header, children, instance }: SidebarProps) => (
    <div className={'flex h-full flex-col'}>
        <div className={'flex h-16 flex-none items-center px-4'}>
            <Brand />
        </div>
        {header && <div className={'px-3 pb-3'}>{header}</div>}
        <div className={'flex-1 overflow-y-auto px-3 pb-3'}>{children}</div>
        <div className={'flex-none border-t border-line p-2'}>
            <UserMenu instance={instance} />
        </div>
    </div>
);

export default Sidebar;
