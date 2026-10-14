import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { CheckCircleIcon, CubeIcon, DownloadIcon, RefreshIcon } from '@heroicons/react/outline';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import PageHeader from '@/components/theme/PageHeader';
import { usePermissions } from '@/plugins/usePermissions';
import useFlash, { useFlashKey } from '@/plugins/useFlash';
import { getVersions, installVersion, VersionGroup, VersionOption, VersionsResponse } from './api';

interface Selection {
    group: VersionGroup;
    version: VersionOption;
}

const InstallDialog = ({
    selection,
    onClose,
    onInstalled,
}: {
    selection: Selection | null;
    onClose: () => void;
    onInstalled: () => void;
}) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:versions');
    const { addFlash } = useFlash();
    const [wipe, setWipe] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => setWipe(false), [selection]);

    if (!selection) return null;

    const { group, version } = selection;
    const isEgg = group.type === 'egg';

    const submit = () => {
        clearFlashes();
        setBusy(true);

        installVersion(uuid, group.id, version.id, wipe)
            .then(({ name, reinstalling }) => {
                addFlash({
                    key: 'server:versions',
                    type: 'success',
                    message: reinstalling
                        ? `Switching to ${name}. The server is being reinstalled; this can take a few minutes.`
                        : `${name} is installed. Start the server to use it.`,
                });
                onInstalled();
                // An egg switch puts the server into the installing state.
                if (reinstalling) getServer(id).catch(console.error);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setBusy(false);
                onClose();
            });
    };

    return (
        <Dialog
            open
            onClose={() => !busy && onClose()}
            preventExternalClose={busy}
            hideCloseIcon={busy}
            title={`${version.current ? 'Reinstall' : 'Install'} ${version.name}?`}
        >
            <p className={'text-sm text-fg-muted'}>
                {isEgg
                    ? `The server switches to the ${version.name} egg and is reinstalled with its install script. Your files are kept unless you delete them below.`
                    : `${version.name} is downloaded into the server's folder and replaces the .jar files in its top folder. Worlds, plugins and settings are kept unless you delete them below.`}
            </p>
            <label className={'mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3'}>
                <Input.Checkbox
                    checked={wipe}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWipe(e.currentTarget.checked)}
                    disabled={busy}
                    className={'mt-0.5'}
                />
                <span>
                    <span className={'block text-sm font-medium text-fg'}>Delete all files first</span>
                    <span className={'block text-xs text-fg-subtle'}>
                        Starts fresh. Worlds, plugins and configs are removed permanently, so make a backup first.
                    </span>
                </span>
            </label>
            {busy && (
                <div className={'mt-4 flex items-center gap-2 text-sm text-fg-muted'}>
                    <Spinner size={'small'} />
                    {isEgg ? 'Switching egg…' : 'Downloading, this can take a minute…'}
                </div>
            )}
            <Dialog.Footer>
                <Button.Text onClick={onClose} disabled={busy}>
                    Cancel
                </Button.Text>
                {wipe ? (
                    <Button.Danger onClick={submit} disabled={busy}>
                        Delete files and install
                    </Button.Danger>
                ) : (
                    <Button onClick={submit} disabled={busy}>
                        {version.current ? 'Reinstall' : 'Install'}
                    </Button>
                )}
            </Dialog.Footer>
        </Dialog>
    );
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const [canInstall] = usePermissions('versions.install');
    const { clearAndAddHttpError } = useFlashKey('server:versions');
    const [selection, setSelection] = useState<Selection | null>(null);

    const { data, error, mutate } = useSWR<VersionsResponse>([uuid, '/addons/versions'], () => getVersions(uuid), {
        revalidateOnFocus: false,
    });

    useEffect(() => {
        if (error) clearAndAddHttpError(error);
    }, [error]);

    const running = status !== null && status !== 'offline';

    return (
        <ServerContentBlock title={'Versions'}>
            <PageHeader
                title={'Versions'}
                description={'Switch your server to another version or server type.'}
                meta={
                    data?.current && (
                        <span
                            className={
                                'inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg-muted ring-1 ring-inset ring-line'
                            }
                        >
                            <CheckCircleIcon className={'h-3.5 w-3.5 text-accent-text'} strokeWidth={2} />
                            {data.current.name}
                        </span>
                    )
                }
            />
            <FlashMessageRender byKey={'server:versions'} className={'mb-4'} />
            {canInstall && running && (
                <div className={'mb-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted'}>
                    Stop the server before changing its version.
                </div>
            )}
            {!data ? (
                !error && <Spinner size={'large'} centered />
            ) : data.groups.length === 0 ? (
                <div className={'panel rounded-2xl px-6 py-14 text-center'}>
                    <CubeIcon className={'mx-auto h-8 w-8 text-fg-subtle'} strokeWidth={1.4} />
                    <p className={'mt-3 text-sm font-medium text-fg'}>No versions available</p>
                    <p className={'mt-1 text-sm text-fg-subtle'}>
                        Your host has not set up any versions for this type of server.
                    </p>
                </div>
            ) : (
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    {data.groups.map((group) => (
                        <section key={group.id} className={'panel overflow-hidden rounded-2xl'}>
                            <header
                                className={'flex items-center justify-between gap-3 border-b border-line px-5 py-3.5'}
                            >
                                <h2 className={'text-sm font-semibold text-fg'}>{group.name}</h2>
                                <span className={'text-xs text-fg-subtle'}>
                                    {group.type === 'egg' ? 'Reinstalls the server' : 'Replaces the server jar'}
                                </span>
                            </header>
                            <ul className={'max-h-[26rem] divide-y divide-line overflow-y-auto'}>
                                {group.versions.map((version) => (
                                    <li
                                        key={version.id}
                                        className={'flex items-center justify-between gap-3 px-5 py-2.5'}
                                    >
                                        <span className={'flex min-w-0 items-center gap-2'}>
                                            <span className={'truncate text-sm text-fg'}>{version.name}</span>
                                            {version.current && (
                                                <span
                                                    className={
                                                        'flex-none rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg'
                                                    }
                                                >
                                                    Installed
                                                </span>
                                            )}
                                        </span>
                                        {canInstall && (
                                            <Button.Text
                                                size={Button.Sizes.Small}
                                                disabled={running}
                                                onClick={() => setSelection({ group, version })}
                                                className={'flex-none'}
                                            >
                                                {version.current ? (
                                                    <RefreshIcon className={'mr-1.5 h-4 w-4'} strokeWidth={1.8} />
                                                ) : (
                                                    <DownloadIcon className={'mr-1.5 h-4 w-4'} strokeWidth={1.8} />
                                                )}
                                                {version.current ? 'Reinstall' : 'Install'}
                                            </Button.Text>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
            <InstallDialog selection={selection} onClose={() => setSelection(null)} onInstalled={() => mutate()} />
        </ServerContentBlock>
    );
};
