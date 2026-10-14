import { lazy } from 'react';
import { AddonDefinition } from '@/addons';

const PropertiesContainer = lazy(() => import('./PropertiesContainer'));

export default {
    server: [
        {
            path: '/properties',
            name: 'Properties',
            permission: 'properties.*',
            games: ['minecraft'],
            // Proxies (BungeeCord, Waterfall, Velocity) have no server.properties.
            platforms: ['bukkit', 'sponge', 'modded', 'bedrock', 'vanilla', 'unknown'],
            component: PropertiesContainer,
        },
    ],
} as AddonDefinition;
