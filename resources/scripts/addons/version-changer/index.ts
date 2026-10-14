import { lazy } from 'react';
import { AddonDefinition } from '@/addons';

const VersionsContainer = lazy(() => import('./VersionsContainer'));

export default {
    server: [
        {
            path: '/versions',
            name: 'Versions',
            permission: 'versions.*',
            games: ['minecraft'],
            component: VersionsContainer,
        },
    ],
} as AddonDefinition;
