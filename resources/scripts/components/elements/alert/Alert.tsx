import { ExclamationIcon, ShieldExclamationIcon } from '@heroicons/react/outline';
import React from 'react';
import classNames from 'classnames';

interface AlertProps {
    type: 'warning' | 'danger';
    className?: string;
    children: React.ReactNode;
}

export default ({ type, className, children }: AlertProps) => {
    return (
        <div
            className={classNames(
                'flex items-start gap-3 rounded-xl px-4 py-3 text-sm text-fg ring-1 ring-inset',
                {
                    ['bg-red-500/[0.08] ring-red-500/25']: type === 'danger',
                    ['bg-amber-500/[0.08] ring-amber-500/25']: type === 'warning',
                },
                className
            )}
        >
            {type === 'danger' ? (
                <ShieldExclamationIcon className={'mt-px h-5 w-5 flex-none text-red-500'} strokeWidth={1.8} />
            ) : (
                <ExclamationIcon className={'mt-px h-5 w-5 flex-none text-amber-500'} strokeWidth={1.8} />
            )}
            <div className={'min-w-0 flex-1 leading-relaxed'}>{children}</div>
        </div>
    );
};
