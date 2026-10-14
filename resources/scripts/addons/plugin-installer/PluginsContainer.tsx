import React, { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import {
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CollectionIcon,
    DownloadIcon,
    ExternalLinkIcon,
    PuzzleIcon,
    RefreshIcon,
    SearchIcon,
    StarIcon,
    TrashIcon,
} from '@heroicons/react/outline';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import Input from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';
import PageHeader from '@/components/theme/PageHeader';
import Segmented from '@/components/theme/Segmented';
import { usePermissions } from '@/plugins/usePermissions';
import useFlash, { useFlashKey } from '@/plugins/useFlash';
import { bytesToString } from '@/lib/formatters';
import {
    getInstalledPlugins,
    getPluginVersions,
    installPlugin,
    InstalledPlugin,
    Plugin,
    PluginSource,
    PluginVersion,
    searchPlugins,
    uninstallPlugin,
} from './api';

const FLASH = 'server:plugins';

const SOURCES: { value: PluginSource; label: string }[] = [
    { value: 'spigot', label: 'SpigotMC' },
    { value: 'modrinth', label: 'Modrinth' },
    { value: 'polymart', label: 'Polymart' },
];

const SPIGOT_CATEGORIES: [number, string][] = [
    [4, 'Spigot'],
    [2, 'Bungee - Spigot'],
    [3, 'Bungee - Proxy'],
    [5, 'Transportation'],
    [6, 'Chat'],
    [7, 'Tools and utilities'],
    [8, 'Misc'],
    [9, 'Libraries / APIs'],
];

const GAME_VERSIONS = [
    '1.21.4',
    '1.21.1',
    '1.20.6',
    '1.20.4',
    '1.20.1',
    '1.19.4',
    '1.18.2',
    '1.17.1',
    '1.16.5',
    '1.12.2',
    '1.8.8',
];

const compact = (value: number) =>
    value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`
        : value >= 1_000
        ? `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`
        : String(value);

const relative = (date: string | null) => {
    if (!date) return null;
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
    if (days < 1) return 'today';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
};

const PluginIcon = ({ src, className }: { src: string | null; className?: string }) => {
    const [failed, setFailed] = useState(false);

    return (
        <span
            className={classNames(
                'flex flex-none items-center justify-center overflow-hidden rounded-xl bg-surface-3 ring-1 ring-inset ring-line',
                className
            )}
        >
            {src && !failed ? (
                <img
                    src={src}
                    alt={''}
                    className={'h-full w-full object-cover'}
                    loading={'lazy'}
                    onError={() => setFailed(true)}
                />
            ) : (
                <PuzzleIcon className={'h-5 w-5 text-fg-subtle'} strokeWidth={1.6} />
            )}
        </span>
    );
};

const VersionsDialog = ({
    plugin,
    installed,
    busy,
    canInstall,
    onInstall,
    onClose,
}: {
    plugin: Plugin | null;
    installed?: InstalledPlugin;
    busy: boolean;
    canInstall: boolean;
    onInstall: (plugin: Plugin, version: string) => void;
    onClose: () => void;
}) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [versions, setVersions] = useState<PluginVersion[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!plugin) return;
        setVersions(null);
        setError('');
        getPluginVersions(uuid, plugin)
            .then(setVersions)
            .catch(() => setError('The versions could not be loaded.'));
    }, [plugin]);

    if (!plugin) return null;

    return (
        <Dialog open onClose={onClose} title={plugin.name}>
            <p className={'-mt-2 mb-4 text-sm text-fg-muted'}>
                {plugin.source === 'modrinth'
                    ? 'Pick a version to install. It replaces any other version of this plugin installed from here.'
                    : 'Only the latest version can be installed from here. Older versions are available on the plugin page.'}
            </p>
            <div className={'max-h-80 overflow-y-auto rounded-xl border border-line'}>
                {!versions ? (
                    <div className={'py-10'}>
                        {error ? <p className={'text-center text-sm text-fg-subtle'}>{error}</p> : <Spinner centered />}
                    </div>
                ) : versions.length === 0 ? (
                    <p className={'py-10 text-center text-sm text-fg-subtle'}>No versions found.</p>
                ) : (
                    <ul className={'divide-y divide-line'}>
                        {versions.map((version) => {
                            const current = installed?.version === version.id.replace(/[^A-Za-z0-9]/g, '');

                            return (
                                <li key={version.id} className={'flex items-center justify-between gap-3 px-4 py-2.5'}>
                                    <div className={'min-w-0'}>
                                        <p className={'flex items-center gap-2 truncate text-sm text-fg'}>
                                            {version.name}
                                            {current && (
                                                <span
                                                    className={
                                                        'rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg'
                                                    }
                                                >
                                                    Installed
                                                </span>
                                            )}
                                        </p>
                                        <p className={'truncate text-xs text-fg-subtle'}>
                                            {[
                                                relative(version.releasedAt),
                                                version.gameVersions.length > 0 &&
                                                    `MC ${version.gameVersions.slice(-3).reverse().join(', ')}`,
                                                version.downloads !== null && `${compact(version.downloads)} downloads`,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                    </div>
                                    {canInstall && version.installable && !current && (
                                        <Button.Text
                                            size={Button.Sizes.Small}
                                            disabled={busy}
                                            onClick={() => onInstall(plugin, version.id)}
                                        >
                                            Install
                                        </Button.Text>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            <Dialog.Footer>
                <a href={plugin.url} target={'_blank'} rel={'noopener noreferrer'} className={'mr-auto'}>
                    <Button.Text>
                        Plugin page <ExternalLinkIcon className={'ml-1.5 h-4 w-4'} />
                    </Button.Text>
                </a>
                <Button onClick={onClose}>Close</Button>
            </Dialog.Footer>
        </Dialog>
    );
};

const PluginCard = ({
    plugin,
    installed,
    busy,
    canInstall,
    canDelete,
    onInstall,
    onRemove,
    onVersions,
}: {
    plugin: Plugin;
    installed?: InstalledPlugin;
    busy: boolean;
    canInstall: boolean;
    canDelete: boolean;
    onInstall: () => void;
    onRemove: () => void;
    onVersions: () => void;
}) => {
    const updateAvailable =
        !!installed &&
        !!plugin.latestVersion &&
        installed.version !== plugin.latestVersion.replace(/[^A-Za-z0-9]/g, '');
    const versions = plugin.gameVersions.length > 0 ? plugin.gameVersions : [];

    return (
        <motion.div
            layout={'position'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={'panel flex flex-col rounded-2xl p-4'}
        >
            <div className={'flex items-start gap-3'}>
                <PluginIcon src={plugin.icon} className={'h-11 w-11'} />
                <div className={'min-w-0 flex-1'}>
                    <a
                        href={plugin.url}
                        target={'_blank'}
                        rel={'noopener noreferrer'}
                        className={'block truncate text-sm font-semibold text-fg no-underline hover:underline'}
                        title={plugin.name}
                    >
                        {plugin.name}
                    </a>
                    <p className={'truncate text-xs text-fg-subtle'}>
                        {plugin.author ? `by ${plugin.author}` : SOURCES.find((s) => s.value === plugin.source)?.label}
                    </p>
                </div>
                {plugin.premium && (
                    <span
                        className={
                            'flex-none rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-medium text-fg-muted'
                        }
                    >
                        Premium
                    </span>
                )}
            </div>
            <p className={'mt-3 min-h-[2.5rem] text-sm leading-5 text-fg-muted line-clamp-2'}>
                {plugin.summary || 'No description.'}
            </p>
            <div className={'mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle'}>
                <span className={'inline-flex items-center gap-1'}>
                    <DownloadIcon className={'h-3.5 w-3.5'} strokeWidth={1.8} />
                    {compact(plugin.downloads)}
                </span>
                {plugin.rating !== null && plugin.rating > 0 && (
                    <span className={'inline-flex items-center gap-1'}>
                        <StarIcon className={'h-3.5 w-3.5'} strokeWidth={1.8} />
                        {plugin.rating.toFixed(1)}
                    </span>
                )}
                {plugin.updatedAt && <span>Updated {relative(plugin.updatedAt)}</span>}
                {versions.length > 0 && (
                    <span className={'truncate'} title={versions.join(', ')}>
                        {versions.length > 1 ? `${versions[0]} – ${versions[versions.length - 1]}` : versions[0]}
                    </span>
                )}
            </div>
            <div className={'mt-4 flex items-center gap-2 border-t border-line pt-3'}>
                {installed ? (
                    <>
                        <span className={'inline-flex items-center gap-1.5 text-xs font-medium text-accent-text'}>
                            <CheckIcon className={'h-4 w-4'} strokeWidth={2} />
                            Installed
                        </span>
                        <span className={'flex-1'} />
                        {updateAvailable && canInstall && (
                            <Button size={Button.Sizes.Small} disabled={busy} onClick={onInstall}>
                                <RefreshIcon className={'mr-1.5 h-4 w-4'} strokeWidth={1.8} />
                                Update
                            </Button>
                        )}
                        {canDelete && (
                            <Button.Text
                                size={Button.Sizes.Small}
                                shape={Button.Shapes.IconSquare}
                                disabled={busy}
                                onClick={onRemove}
                                aria-label={`Remove ${plugin.name}`}
                                title={'Remove'}
                            >
                                <TrashIcon className={'h-4 w-4'} strokeWidth={1.8} />
                            </Button.Text>
                        )}
                    </>
                ) : plugin.installable ? (
                    <>
                        {canInstall && (
                            <Button size={Button.Sizes.Small} disabled={busy} onClick={onInstall}>
                                {busy ? (
                                    <Spinner size={'small'} />
                                ) : (
                                    <DownloadIcon className={'mr-1.5 h-4 w-4'} strokeWidth={1.8} />
                                )}
                                {busy ? '' : 'Install'}
                            </Button>
                        )}
                        <span className={'flex-1'} />
                    </>
                ) : (
                    <>
                        <a href={plugin.url} target={'_blank'} rel={'noopener noreferrer'}>
                            <Button.Text size={Button.Sizes.Small}>
                                {plugin.premium ? 'Buy' : 'Download'}
                                <ExternalLinkIcon className={'ml-1.5 h-4 w-4'} strokeWidth={1.8} />
                            </Button.Text>
                        </a>
                        <span className={'flex-1'} />
                    </>
                )}
                <Button.Text size={Button.Sizes.Small} onClick={onVersions}>
                    Versions
                </Button.Text>
            </div>
        </motion.div>
    );
};

const InstalledList = ({
    plugins,
    busy,
    canDelete,
    onRemove,
}: {
    plugins: InstalledPlugin[];
    busy: string | null;
    canDelete: boolean;
    onRemove: (file: string) => void;
}) =>
    plugins.length === 0 ? (
        <div className={'panel rounded-2xl px-6 py-14 text-center'}>
            <CollectionIcon className={'mx-auto h-8 w-8 text-fg-subtle'} strokeWidth={1.4} />
            <p className={'mt-3 text-sm font-medium text-fg'}>No plugins installed</p>
            <p className={'mt-1 text-sm text-fg-subtle'}>
                Plugins you install appear here, along with any in the plugins folder.
            </p>
        </div>
    ) : (
        <div className={'panel divide-y divide-line overflow-hidden rounded-2xl'}>
            {plugins.map((plugin) => (
                <div key={plugin.file} className={'flex items-center gap-3 px-5 py-3'}>
                    <PluginIcon src={null} className={'h-9 w-9'} />
                    <div className={'min-w-0 flex-1'}>
                        <p className={'truncate font-mono text-sm text-fg'}>{plugin.file}</p>
                        <p className={'text-xs text-fg-subtle'}>
                            {[
                                bytesToString(plugin.size),
                                plugin.source && `from ${SOURCES.find((s) => s.value === plugin.source)?.label}`,
                                plugin.modifiedAt && `added ${relative(plugin.modifiedAt)}`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                    {canDelete && (
                        <Button.Text
                            size={Button.Sizes.Small}
                            disabled={busy !== null}
                            onClick={() => onRemove(plugin.file)}
                        >
                            {busy === plugin.file ? (
                                <Spinner size={'small'} />
                            ) : (
                                <TrashIcon className={'mr-1.5 h-4 w-4'} strokeWidth={1.8} />
                            )}
                            {busy === plugin.file ? '' : 'Remove'}
                        </Button.Text>
                    )}
                </div>
            ))}
        </div>
    );

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [canInstall, canDelete] = usePermissions(['file.create', 'file.delete']);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey(FLASH);
    const { addFlash } = useFlash();

    const [tab, setTab] = useState<'browse' | 'installed'>('browse');
    const [source, setSource] = useState<PluginSource>('spigot');
    const [input, setInput] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState<number | null>(null);
    const [gameVersion, setGameVersion] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [versionsFor, setVersionsFor] = useState<Plugin | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);

    // Search as the user types, but not on every key press.
    useEffect(() => {
        const timeout = setTimeout(() => setQuery(input.trim()), 350);
        return () => clearTimeout(timeout);
    }, [input]);

    useEffect(() => setPage(1), [source, query, category, gameVersion]);

    const params = {
        source,
        query,
        page,
        category: source === 'spigot' && !query ? category : null,
        version: source === 'modrinth' ? gameVersion : null,
    };
    const search = useSWR([uuid, '/addons/plugins', JSON.stringify(params)], () => searchPlugins(uuid, params), {
        revalidateOnFocus: false,
    });
    // Keep showing the previous results while the next page loads.
    const lastResults = useRef(search.data);
    if (search.data) lastResults.current = search.data;
    const installed = useSWR<InstalledPlugin[]>([uuid, '/addons/plugins/installed'], () => getInstalledPlugins(uuid), {
        revalidateOnFocus: false,
    });

    useEffect(() => {
        if (search.error) clearAndAddHttpError(search.error);
    }, [search.error]);

    useEffect(() => {
        if (installed.error) clearAndAddHttpError(installed.error);
    }, [installed.error]);

    const installedFor = useMemo(() => {
        const map = new Map<string, InstalledPlugin>();
        (installed.data || []).forEach((plugin) => plugin.source && map.set(`${plugin.source}:${plugin.id}`, plugin));
        return map;
    }, [installed.data]);

    const install = (plugin: Plugin, version?: string) => {
        clearFlashes();
        setBusy(`${plugin.source}:${plugin.id}`);

        installPlugin(uuid, plugin, version)
            .then((plugins) => {
                installed.mutate(plugins, false);
                setVersionsFor(null);
                addFlash({
                    key: FLASH,
                    type: 'success',
                    message: `${plugin.name} is installed. Restart the server to load it.`,
                });
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setBusy(null));
    };

    const remove = (file: string, name?: string) => {
        if (!window.confirm(`Remove ${name || file} from the plugins folder?`)) return;

        clearFlashes();
        setRemoving(file);
        setBusy(file);

        uninstallPlugin(uuid, file)
            .then((plugins) => {
                installed.mutate(plugins, false);
                addFlash({
                    key: FLASH,
                    type: 'success',
                    message: `${name || file} was removed. Restart the server to unload it.`,
                });
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setBusy(null);
                setRemoving(null);
            });
    };

    const results = search.data || (search.error ? undefined : lastResults.current);
    const loading = !search.data && !search.error;

    return (
        <ServerContentBlock title={'Plugins'}>
            <PageHeader
                title={'Plugins'}
                description={'Find plugins on SpigotMC, Modrinth and Polymart and install them in one click.'}
                actions={
                    <Segmented
                        id={'plugin-tabs'}
                        value={tab}
                        onChange={setTab}
                        options={[
                            { value: 'browse', label: 'Browse' },
                            {
                                value: 'installed',
                                label: `Installed${installed.data ? ` (${installed.data.length})` : ''}`,
                            },
                        ]}
                    />
                }
            />
            <FlashMessageRender byKey={FLASH} className={'mb-4'} />
            {tab === 'installed' ? (
                !installed.data ? (
                    !installed.error && <Spinner size={'large'} centered />
                ) : (
                    <InstalledList
                        plugins={installed.data}
                        busy={removing}
                        canDelete={canDelete}
                        onRemove={(file) => remove(file)}
                    />
                )
            ) : (
                <>
                    <div className={'mb-5 flex flex-col gap-3 lg:flex-row lg:items-center'}>
                        <Segmented id={'plugin-source'} value={source} onChange={setSource} options={SOURCES} />
                        <div className={'relative flex-1'}>
                            <SearchIcon
                                className={
                                    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle'
                                }
                                strokeWidth={1.8}
                            />
                            <Input
                                type={'search'}
                                value={input}
                                onChange={(e) => setInput(e.currentTarget.value)}
                                placeholder={`Search ${SOURCES.find((s) => s.value === source)?.label}`}
                                aria-label={'Search plugins'}
                                className={'!pl-9'}
                            />
                        </div>
                        {source === 'spigot' && (
                            <Select
                                value={category ?? ''}
                                onChange={(e) =>
                                    setCategory(e.currentTarget.value ? Number(e.currentTarget.value) : null)
                                }
                                disabled={!!query}
                                title={query ? 'Categories cannot be combined with a search' : undefined}
                                className={'lg:!w-52'}
                                aria-label={'Category'}
                            >
                                <option value={''}>All categories</option>
                                {SPIGOT_CATEGORIES.map(([id, label]) => (
                                    <option key={id} value={id}>
                                        {label}
                                    </option>
                                ))}
                            </Select>
                        )}
                        {source === 'modrinth' && (
                            <Select
                                value={gameVersion ?? ''}
                                onChange={(e) => setGameVersion(e.currentTarget.value || null)}
                                className={'lg:!w-44'}
                                aria-label={'Minecraft version'}
                            >
                                <option value={''}>Any version</option>
                                {GAME_VERSIONS.map((version) => (
                                    <option key={version} value={version}>
                                        {version}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </div>
                    {!results ? (
                        !search.error && <Spinner size={'large'} centered />
                    ) : results.plugins.length === 0 ? (
                        <div className={'panel rounded-2xl px-6 py-14 text-center'}>
                            <SearchIcon className={'mx-auto h-8 w-8 text-fg-subtle'} strokeWidth={1.4} />
                            <p className={'mt-3 text-sm font-medium text-fg'}>No plugins found</p>
                            <p className={'mt-1 text-sm text-fg-subtle'}>Try another search or source.</p>
                        </div>
                    ) : (
                        <div className={classNames('transition-opacity', loading && 'opacity-60')}>
                            <div className={'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'}>
                                {results.plugins.map((plugin) => {
                                    const key = `${plugin.source}:${plugin.id}`;
                                    const entry = installedFor.get(key);

                                    return (
                                        <PluginCard
                                            key={key}
                                            plugin={plugin}
                                            installed={entry}
                                            busy={busy === key || (!!entry && busy === entry.file)}
                                            canInstall={canInstall}
                                            canDelete={canDelete}
                                            onInstall={() => install(plugin)}
                                            onRemove={() => entry && remove(entry.file, plugin.name)}
                                            onVersions={() => setVersionsFor(plugin)}
                                        />
                                    );
                                })}
                            </div>
                            <div className={'mt-6 flex items-center justify-center gap-3'}>
                                <Button.Text
                                    size={Button.Sizes.Small}
                                    disabled={page <= 1 || loading}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeftIcon className={'mr-1 h-4 w-4'} /> Previous
                                </Button.Text>
                                <span className={'text-sm tabular-nums text-fg-subtle'}>Page {page}</span>
                                <Button.Text
                                    size={Button.Sizes.Small}
                                    disabled={!results.hasMore || loading}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next <ChevronRightIcon className={'ml-1 h-4 w-4'} />
                                </Button.Text>
                            </div>
                        </div>
                    )}
                </>
            )}
            <VersionsDialog
                plugin={versionsFor}
                installed={versionsFor ? installedFor.get(`${versionsFor.source}:${versionsFor.id}`) : undefined}
                busy={busy !== null}
                canInstall={canInstall}
                onInstall={install}
                onClose={() => setVersionsFor(null)}
            />
        </ServerContentBlock>
    );
};
