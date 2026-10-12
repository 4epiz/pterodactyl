import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import { motion } from 'framer-motion';
import PageHeader from '@/components/theme/PageHeader';
import Segmented from '@/components/theme/Segmented';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

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

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <PageHeader
                title={'Servers'}
                description={
                    servers
                        ? `${servers.pagination.total} ${servers.pagination.total === 1 ? 'server' : 'servers'}${
                              showOnlyAdmin && rootAdmin ? ' owned by other users' : ' on your account'
                          }`
                        : 'Loading your servers…'
                }
                actions={
                    rootAdmin && (
                        <Segmented
                            id={'server-scope'}
                            value={showOnlyAdmin ? 'others' : 'mine'}
                            onChange={(value) => setShowOnlyAdmin(value === 'others')}
                            options={[
                                { value: 'mine', label: 'My servers' },
                                { value: 'others', label: 'Other servers' },
                            ]}
                        />
                    )
                }
            />
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            <div className={'grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'}>
                                {items.map((server, index) => (
                                    <motion.div
                                        key={server.uuid}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <ServerRow server={server} />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div
                                className={'rounded-xl border border-dashed border-line-strong px-6 py-16 text-center'}
                            >
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
            )}
        </PageContentBlock>
    );
};
