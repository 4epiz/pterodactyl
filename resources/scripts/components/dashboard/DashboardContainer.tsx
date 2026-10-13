import React, { useCallback, useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import { motion } from 'framer-motion';
import Segmented from '@/components/theme/Segmented';
import { ServerStats } from '@/api/server/getServerResourceUsage';
import { ClipboardListIcon } from '@heroicons/react/outline';
import StatTiles from '@/components/dashboard/StatTiles';
import FeaturedServer from '@/components/dashboard/FeaturedServer';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { Link, useLocation } from 'react-router-dom';

const greeting = () => {
    const hour = new Date().getHours();
    return hour < 5 ? 'Good evening' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const username = useStoreState((state) => state.user.data!.username);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [stats, setStats] = useState<Record<string, ServerStats | null>>({});
    const onStats = useCallback(
        (server: string, value: ServerStats | null) => setStats((current) => ({ ...current, [server]: value })),
        []
    );

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => {
        setPage(1);
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    const online = (stat?: ServerStats | null) => !!stat && !stat.isSuspended && stat.status !== 'offline';
    const items = servers?.items || [];
    const onlineCount = items.filter((server) => online(stats[server.uuid])).length;
    const loaded = items.filter((server) => stats[server.uuid] !== undefined).length;

    const visible = items.filter((server) =>
        filter === 'all' ? true : filter === 'online' ? online(stats[server.uuid]) : !online(stats[server.uuid])
    );

    // The most active running server is featured at the top of the page.
    const featured = items
        .filter((server) => online(stats[server.uuid]))
        .sort((a, b) => (stats[b.uuid]?.cpuUsagePercent || 0) - (stats[a.uuid]?.cpuUsagePercent || 0))[0];

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <div className={'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'}>
                <div>
                    <h1 className={'text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-fg'}>
                        {greeting()}, {username}
                    </h1>
                    <p className={'mt-1.5 text-sm text-fg-muted'}>
                        {!servers
                            ? 'Loading your servers…'
                            : !items.length
                            ? 'You have no servers yet.'
                            : loaded < items.length
                            ? `Checking ${items.length} ${items.length === 1 ? 'server' : 'servers'}…`
                            : `${onlineCount} of ${items.length} ${
                                  items.length === 1 ? 'server is' : 'servers are'
                              } online.`}
                    </p>
                </div>
                <div className={'flex items-center gap-2'}>
                    {rootAdmin && (
                        <Segmented
                            id={'server-scope'}
                            value={showOnlyAdmin ? 'others' : 'mine'}
                            onChange={(value) => setShowOnlyAdmin(value === 'others')}
                            options={[
                                { value: 'mine', label: 'My servers' },
                                { value: 'others', label: 'Other servers' },
                            ]}
                        />
                    )}
                    <Link
                        to={'/account/activity'}
                        className={
                            'flex h-10 items-center gap-2 rounded-xl border border-line bg-surface-0 px-4 text-[13px] font-semibold text-fg no-underline transition-colors hover:border-line-strong'
                        }
                    >
                        <ClipboardListIcon className={'h-4 w-4 text-fg-muted'} strokeWidth={1.8} />
                        Activity
                    </Link>
                </div>
            </div>

            {servers && items.length > 0 && <StatTiles servers={items} stats={stats} />}
            {featured && <FeaturedServer server={featured} stats={stats[featured.uuid]!} />}

            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <>
                    <div className={'mb-3.5 mt-8 flex items-center justify-between gap-3'}>
                        <h2 className={'text-base font-semibold text-fg'}>Your servers</h2>
                        {items.length > 0 && (
                            <Segmented
                                id={'server-filter'}
                                value={filter}
                                onChange={setFilter}
                                options={[
                                    { value: 'all', label: `All ${items.length}` },
                                    { value: 'online', label: `Online ${onlineCount}` },
                                    { value: 'offline', label: `Offline ${loaded - onlineCount}` },
                                ]}
                            />
                        )}
                    </div>
                    <Pagination data={servers} onPageSelect={setPage}>
                        {() =>
                            items.length > 0 ? (
                                <div className={'grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3'}>
                                    {items.map((server, index) => (
                                        <motion.div
                                            key={server.uuid}
                                            className={visible.includes(server) ? undefined : 'hidden'}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.4,
                                                delay: index * 0.04,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                        >
                                            <ServerRow server={server} onStats={onStats} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className={'panel rounded-[1.375rem] px-6 py-16 text-center'}>
                                    <p className={'text-sm font-medium text-fg'}>No servers yet</p>
                                    <p className={'mt-1 text-sm text-fg-subtle'}>
                                        {showOnlyAdmin
                                            ? 'There are no other servers to display.'
                                            : 'There are no servers associated with your account.'}
                                    </p>
                                </div>
                            )
                        }
                    </Pagination>
                    {items.length > 0 && !visible.length && (
                        <p className={'py-10 text-center text-sm text-fg-subtle'}>No {filter} servers on this page.</p>
                    )}
                </>
            )}
        </PageContentBlock>
    );
};
