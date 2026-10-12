import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { matchPath, Route, Switch, useRouteMatch } from 'react-router-dom';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import AppShell from '@/components/theme/AppShell';
import Sidebar, { NavItem, NavSection } from '@/components/theme/Sidebar';
import ServerSidebarHeader from '@/components/theme/ServerSidebarHeader';
import { serverIcon } from '@/components/theme/navIcons';
import { ExternalLinkIcon } from '@heroicons/react/outline';

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    const sidebar = (instance: string) => (
        <Sidebar instance={instance} header={uuid && id ? <ServerSidebarHeader /> : undefined}>
            {uuid && id && (
                <NavSection title={'Server'}>
                    {routes.server
                        .filter((route) => !!route.name)
                        .map((route) => {
                            const item = (
                                <NavItem
                                    key={route.path}
                                    to={to(route.path, true)}
                                    match={to(route.path)}
                                    exact={route.exact}
                                    icon={serverIcon(route.path)}
                                    label={route.name}
                                    layoutGroup={instance}
                                />
                            );

                            return route.permission ? (
                                <Can key={route.path} action={route.permission} matchAny>
                                    {item}
                                </Can>
                            ) : (
                                item
                            );
                        })}
                    {rootAdmin && (
                        // eslint-disable-next-line react/jsx-no-target-blank
                        <a
                            href={`/admin/servers/view/${serverId}`}
                            target={'_blank'}
                            className={
                                'flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-fg-muted no-underline hover:text-fg'
                            }
                        >
                            <ExternalLinkIcon className={'h-[18px] w-[18px] text-fg-subtle'} strokeWidth={1.6} />
                            Manage in admin
                        </a>
                    )}
                </NavSection>
            )}
        </Sidebar>
    );

    const current = routes.server.find(
        (route) => !!route.name && matchPath(location.pathname, { path: to(route.path), exact: route.exact })
    );

    return (
        <AppShell
            sidebar={sidebar}
            crumbs={[
                { label: 'Servers', to: '/' },
                ...(name ? [{ label: name, to: to('/', true) }] : []),
                ...(current?.name && current.path !== '/' ? [{ label: current.name }] : []),
            ]}
        >
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size={'large'} centered />
                )
            ) : (
                <>
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <TransitionRouter>
                                <Switch location={location}>
                                    {routes.server.map(({ path, permission, component: Component }) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                            <Spinner.Suspense>
                                                <Component />
                                            </Spinner.Suspense>
                                        </PermissionRoute>
                                    ))}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </TransitionRouter>
                        </ErrorBoundary>
                    )}
                </>
            )}
        </AppShell>
    );
};
