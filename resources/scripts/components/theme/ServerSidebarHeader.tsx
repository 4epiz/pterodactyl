import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import isEqual from 'react-fast-compare';
import { ChevronLeftIcon } from '@heroicons/react/outline';
import { ServerContext } from '@/state/server';
import { capitalize } from '@/lib/strings';
import { toneForPowerState, toneText } from '@/components/theme/status';
import { detectGame, gameLabels } from '@/components/theme/games';
import GameArt from '@/components/theme/GameArt';

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data!, isEqual);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const game = detectGame(server);

    return (
        <div>
            <Link
                to={'/'}
                className={
                    'mb-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-fg-subtle no-underline hover:text-fg'
                }
            >
                <ChevronLeftIcon className={'h-3.5 w-3.5'} strokeWidth={2} />
                All servers
            </Link>
            <div className={'flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2'}>
                <GameArt game={game} seed={server.uuid} className={'h-10 w-10 flex-none rounded-lg'} />
                <div className={'min-w-0'}>
                    <p className={'truncate text-sm font-semibold text-fg'} title={server.name}>
                        {server.name}
                    </p>
                    <p className={'truncate text-xs'}>
                        <span className={classNames('font-medium', toneText[toneForPowerState(status)])}>
                            {status ? capitalize(status) : 'Connecting'}
                        </span>
                        <span className={'text-fg-subtle'}> · {server.eggName || gameLabels[game]}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
