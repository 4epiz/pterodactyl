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
            // Plugin servers and proxies; modded, vanilla, Sponge and Bedrock
            // servers cannot use these plugins.
            platforms: ['bukkit', 'bungee', 'velocity', 'unknown'],
            component: PluginsContainer,
        },
    ],
} as AddonDefinition;
