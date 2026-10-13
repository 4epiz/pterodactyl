import React from 'react';
import { Link, NavLink, useRouteMatch } from 'react-router-dom';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import UserMenu from '@/components/theme/UserMenu';
import { DEFAULT_LOGO, themeConfig } from '@/components/theme/config';
import {
    ChatAlt2Icon,
    CreditCardIcon,
    ExternalLinkIcon,
    StatusOnlineIcon,
    SupportIcon,
} from '@heroicons/react/outline';

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
                'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] no-underline transition-colors duration-150',
                active ? 'text-fg' : 'text-fg-muted hover:text-fg'
            )}
        >
            {active && (
                <motion.span
                    layoutId={`${layoutGroup}-active`}
                    className={'absolute inset-0 rounded-xl bg-surface-3 shadow-card'}
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
    <div className={'mt-6 first:mt-1'}>
        {title && <p className={'mb-1.5 px-3 text-[11px] font-medium text-fg-subtle'}>{title}</p>}
        <nav className={'flex flex-col gap-1'}>{children}</nav>
    </div>
);

export const Brand = ({ className }: { className?: string }) => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data?.name || 'Pterodactyl');
    const { logo_url: logo, subtitle } = themeConfig().branding;

    return (
        <Link to={'/'} className={classNames('flex min-w-0 items-center gap-2.5 no-underline', className)}>
            <img src={logo || DEFAULT_LOGO} alt={''} className={'h-8 w-8 flex-none rounded-lg object-contain'} />
            <span className={'min-w-0'}>
                <span className={'block truncate text-[15px] font-semibold tracking-tight text-fg'}>{name}</span>
                {subtitle && <span className={'block truncate text-[11px] text-fg-subtle'}>{subtitle}</span>}
            </span>
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

// Billing, support, status and Discord links configured in Admin > Theme.
const ExternalLinks = () => {
    const { links } = themeConfig();
    const items: [string, string, IconComponent][] = (
        [
            [links.billing_url, 'Billing', CreditCardIcon],
            [links.support_url, 'Support', SupportIcon],
            [links.status_url, 'Status', StatusOnlineIcon],
            [links.discord_url, 'Discord', ChatAlt2Icon],
        ] as [string, string, IconComponent][]
    ).filter(([url]) => !!url);

    if (!items.length) return null;

    return (
        <NavSection title={'Links'}>
            {items.map(([url, label, Icon]) => (
                <a
                    key={label}
                    href={url}
                    target={'_blank'}
                    rel={'noopener noreferrer'}
                    className={
                        'group flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-fg-muted no-underline transition-colors hover:text-fg'
                    }
                >
                    <Icon className={'h-[18px] w-[18px] text-fg-subtle group-hover:text-fg-muted'} strokeWidth={1.6} />
                    <span className={'flex-1'}>{label}</span>
                    <ExternalLinkIcon className={'h-3.5 w-3.5 text-fg-subtle'} strokeWidth={1.8} />
                </a>
            ))}
        </NavSection>
    );
};

const Sidebar = ({ header, children, instance }: SidebarProps) => (
    <div className={'flex h-full flex-col'}>
        <div className={'flex h-[4.5rem] flex-none items-center px-5'}>
            <Brand />
        </div>
        {header && <div className={'px-3.5 pb-3'}>{header}</div>}
        <div className={'flex-1 overflow-y-auto px-3.5 pb-3'}>
            {children}
            <ExternalLinks />
        </div>
        <div className={'flex-none p-2.5'}>
            <UserMenu instance={instance} />
        </div>
    </div>
);

export default Sidebar;
