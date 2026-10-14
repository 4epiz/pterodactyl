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
            component: PropertiesContainer,
        },
    ],
} as AddonDefinition;
