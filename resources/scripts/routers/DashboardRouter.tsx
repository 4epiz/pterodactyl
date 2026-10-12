import React from 'react';
import { matchPath, Route, Switch } from 'react-router-dom';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import AppShell, { Crumb } from '@/components/theme/AppShell';
import Sidebar, { NavItem, NavSection } from '@/components/theme/Sidebar';
import { accountIcon } from '@/components/theme/navIcons';
import { ViewGridIcon } from '@heroicons/react/outline';

const accountPath = (path: string) => `/account/${path}`.replace('//', '/').replace(/\/$/, '') || '/account';

export default () => {
    const location = useLocation();

    const crumbs: Crumb[] = [];
    if (location.pathname.startsWith('/account')) {
        const current = routes.account.find(({ path, exact }) =>
            matchPath(location.pathname, { path: accountPath(path), exact: exact ?? true })
        );
        crumbs.push({ label: 'Account', to: '/account' });
        if (current?.name && current.path !== '/') crumbs.push({ label: current.name });
    } else {
        crumbs.push({ label: 'Servers' });
    }

    return (
        <AppShell
            crumbs={crumbs}
            sidebar={(instance) => (
                <Sidebar instance={instance}>
                    <NavSection>
                        <NavItem to={'/'} exact icon={ViewGridIcon} label={'Servers'} layoutGroup={instance} />
                    </NavSection>
                    <NavSection title={'Account'}>
                        {routes.account
                            .filter((route) => !!route.name)
                            .map(({ path, name, exact = false }) => (
                                <NavItem
                                    key={path}
                                    to={accountPath(path)}
                                    exact={exact}
                                    icon={accountIcon(path)}
                                    label={name}
                                    layoutGroup={instance}
                                />
                            ))}
                    </NavSection>
                </Sidebar>
            )}
        >
            <TransitionRouter>
                <React.Suspense fallback={<Spinner centered />}>
                    <Switch location={location}>
                        <Route path={'/'} exact>
                            <DashboardContainer />
                        </Route>
                        {routes.account.map(({ path, component: Component }) => (
                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                <Component />
                            </Route>
                        ))}
                        <Route path={'*'}>
                            <NotFound />
                        </Route>
                    </Switch>
                </React.Suspense>
            </TransitionRouter>
        </AppShell>
    );
};
