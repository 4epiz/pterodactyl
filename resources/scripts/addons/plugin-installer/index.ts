import { lazy } from 'react';
import { AddonDefinition } from '@/addons';

const PluginsContainer = lazy(() => import('./PluginsContainer'));

export default {
    server: [
        {
            path: '/plugins',
            name: 'Plugins',
            permission: 'file.*',
            games: ['minecraft'],
            component: PluginsContainer,
        },
    ],
} as AddonDefinition;
