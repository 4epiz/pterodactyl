import React from 'react';
import classNames from 'classnames';

interface Props {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
    'aria-label'?: string;
}

/**
 * A controlled on/off switch.
 */
export default ({ checked, onChange, disabled, id, ...props }: Props) => (
    <button
        id={id}
        type={'button'}
        role={'switch'}
        aria-checked={checked}
        aria-label={props['aria-label']}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={classNames(
            'relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-accent' : 'bg-surface-3 ring-1 ring-inset ring-line-strong'
        )}
    >
        <span
            className={classNames(
                'inline-block h-4 w-4 rounded-full shadow transition-transform duration-200',
                checked ? 'translate-x-[1.125rem] bg-accent-fg' : 'translate-x-0.5 bg-surface'
            )}
        />
    </button>
);
