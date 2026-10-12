import React from 'react';
import classNames from 'classnames';

interface Props {
    title: React.ReactNode;
    description?: React.ReactNode;
    // Rendered next to the title, e.g. a status badge.
    meta?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export default ({ title, description, meta, actions, className }: Props) => (
    <div className={classNames('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
        <div className={'min-w-0'}>
            <div className={'flex flex-wrap items-center gap-3'}>
                <h1 className={'truncate text-2xl font-semibold tracking-tight text-fg'}>{title}</h1>
                {meta}
            </div>
            {description && <p className={'mt-1 text-sm text-fg-muted line-clamp-2'}>{description}</p>}
        </div>
        {actions && <div className={'flex flex-none items-center gap-2'}>{actions}</div>}
    </div>
);
