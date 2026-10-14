import { ServerContext } from '@/state/server';
import { useDeepCompareMemo } from '@/plugins/useDeepCompareMemo';

/**
 * Whether the given permissions allow an action. "file.*" matches any file
 * permission.
 */
export const hasPermission = (userPermissions: string[], permission: string): boolean =>
    userPermissions[0] === '*' ||
    (permission.endsWith('.*') && userPermissions.filter((p) => p.startsWith(permission.split('.')[0])).length > 0) ||
    userPermissions.indexOf(permission) >= 0;

export const usePermissions = (action: string | string[]): boolean[] => {
    const userPermissions = ServerContext.useStoreState((state) => state.server.permissions);

    return useDeepCompareMemo(() => {
        return (Array.isArray(action) ? action : [action]).map((permission) =>
            hasPermission(userPermissions, permission)
        );
    }, [action, userPermissions]);
};
