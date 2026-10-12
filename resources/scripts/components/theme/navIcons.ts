import React from 'react';
import {
    AdjustmentsIcon,
    ArchiveIcon,
    ClipboardListIcon,
    ClockIcon,
    CodeIcon,
    CogIcon,
    CubeIcon,
    DatabaseIcon,
    FolderIcon,
    GlobeAltIcon,
    KeyIcon,
    LightningBoltIcon,
    PuzzleIcon,
    TerminalIcon,
    UserCircleIcon,
    UserGroupIcon,
    UsersIcon,
} from '@heroicons/react/outline';

type IconComponent = (props: React.ComponentProps<'svg'>) => JSX.Element;

/**
 * Sidebar icons, keyed by the route path from routers/routes.ts.
 *
 * Routes added by addons that are not listed here still show up in the sidebar
 * with the fallback icon. To give an addon its own icon, add its path below;
 * there is no need to touch routes.ts.
 */
const server: Record<string, IconComponent> = {
    '/': TerminalIcon,
    '/files': FolderIcon,
    '/databases': DatabaseIcon,
    '/schedules': ClockIcon,
    '/users': UsersIcon,
    '/backups': ArchiveIcon,
    '/network': GlobeAltIcon,
    '/startup': LightningBoltIcon,
    '/settings': CogIcon,
    '/activity': ClipboardListIcon,

    // Common community addons.
    '/versions': CubeIcon,
    '/version': CubeIcon,
    '/properties': AdjustmentsIcon,
    '/players': UserGroupIcon,
    '/plugins': PuzzleIcon,
    '/mods': PuzzleIcon,
    '/subdomain': GlobeAltIcon,
    '/subdomains': GlobeAltIcon,
};

const account: Record<string, IconComponent> = {
    '/': UserCircleIcon,
    '/api': CodeIcon,
    '/ssh': KeyIcon,
    '/activity': ClipboardListIcon,
};

export const fallbackIcon: IconComponent = PuzzleIcon;

export const serverIcon = (path: string): IconComponent => server[path] ?? fallbackIcon;

export const accountIcon = (path: string): IconComponent => account[path] ?? fallbackIcon;
