import type { RouteDefinition, ServerRouteDefinition } from '@/routers/routes';

/**
 * Client-area pages added by addons. Every folder in resources/scripts/addons
 * with an index.ts (or index.tsx) that default-exports an AddonDefinition is
 * picked up automatically when the panel is built, so installing an addon does
 * not require editing routes.ts:
 *
 *   // resources/scripts/addons/example/index.ts
 *   export default {
 *       server: [{ path: '/example', name: 'Example', permission: 'example.*', component: ExamplePage }],
 *   };
 *
 * Server routes accept `games`, `nestIds` and `eggIds` to only show up for
 * matching servers.
 */
export interface AddonDefinition {
    account?: RouteDefinition[];
    server?: ServerRouteDefinition[];
}

const context = require.context('./', true, /^\.\/[^/]+\/index\.tsx?$/);

const definitions: AddonDefinition[] = context
    .keys()
    .sort()
    .map((key) => context(key).default as AddonDefinition)
    .filter(Boolean);

export default {
    account: ([] as RouteDefinition[]).concat(...definitions.map((addon) => addon.account || [])),
    server: ([] as ServerRouteDefinition[]).concat(...definitions.map((addon) => addon.server || [])),
};
