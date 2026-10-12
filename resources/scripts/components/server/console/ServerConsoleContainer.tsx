import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/components/elements/alert';
import { toneForPowerState } from '@/components/theme/status';
import GameArt from '@/components/theme/GameArt';
import { detectGame, gameLabels } from '@/components/theme/games';
import StatusBadge from '@/components/theme/StatusBadge';
import { capitalize } from '@/lib/strings';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerStatus = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);

    return (
        <StatusBadge
            tone={toneForPowerState(status)}
            label={status ? capitalize(status) : 'Connecting'}
            variant={'overlay'}
        />
    );
};

// Page header drawn over the server's game artwork.
const ServerHero = () => {
    const server = ServerContext.useStoreState((state) => state.server.data!, isEqual);
    const game = detectGame(server);

    return (
        <div
            data-theme-scope={'dark'}
            className={'relative mb-4 overflow-hidden rounded-2xl border border-line shadow-card'}
            style={{ background: 'rgb(var(--term-bg))' }}
        >
            {/* Art fills the right side and fades into the dark panel behind the text. */}
            <div
                className={'absolute inset-y-0 right-0 w-full sm:aspect-[2/1] sm:w-auto'}
                style={{
                    maskImage: 'linear-gradient(to right, transparent, black 40%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)',
                }}
            >
                <GameArt game={game} seed={server.uuid} align={'center'} className={'h-full w-full'} />
            </div>
            <div
                className={'absolute inset-0 sm:hidden'}
                style={{ background: 'linear-gradient(to top, rgb(0 0 0 / 0.75), rgb(0 0 0 / 0.35))' }}
            />
            <div className={'relative flex min-h-[11rem] flex-col justify-end p-5 sm:p-6 sm:pr-[42%] lg:pr-[38%]'}>
                <p className={'text-xs font-medium text-white/60'}>{server.eggName || gameLabels[game]}</p>
                <div className={'mt-1 flex flex-wrap items-center gap-3'}>
                    <h1 className={'truncate text-2xl font-semibold tracking-tight text-white'}>{server.name}</h1>
                    <ServerStatus />
                </div>
                {server.description && (
                    <p className={'mt-1 text-sm text-white/70 line-clamp-2'}>{server.description}</p>
                )}
                <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                    <PowerButtons className={'mt-5 flex w-full max-w-md gap-2'} />
                </Can>
            </div>
        </div>
    );
};

const ServerConsoleContainer = () => {
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);

    return (
        <ServerContentBlock title={'Console'}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                        : isInstalling
                        ? 'This server is currently running its installation process and most actions are unavailable.'
                        : 'This server is currently being transferred to another node and all actions are unavailable.'}
                </Alert>
            )}
            <ServerHero />
            <div className={'mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12'}>
                <div className={'flex min-w-0 lg:col-span-8 xl:col-span-9'}>
                    <Spinner.Suspense>
                        <Console />
                    </Spinner.Suspense>
                </div>
                <ServerDetailsBlock className={'lg:col-span-4 xl:col-span-3'} />
            </div>
            <div className={'grid grid-cols-1 gap-4 md:grid-cols-3'}>
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
