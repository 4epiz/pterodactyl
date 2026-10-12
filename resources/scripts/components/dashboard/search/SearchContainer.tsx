import React, { useState } from 'react';
import { SearchIcon } from '@heroicons/react/outline';
import useEventListener from '@/plugins/useEventListener';
import SearchModal from '@/components/dashboard/search/SearchModal';

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || navigator.userAgent);

export default () => {
    const [visible, setVisible] = useState(false);

    useEventListener('keydown', (e: KeyboardEvent) => {
        if (['input', 'textarea'].indexOf(((e.target as HTMLElement).tagName || 'input').toLowerCase()) < 0) {
            if (!visible && (e.metaKey || e.ctrlKey) && (e.key === '/' || e.key.toLowerCase() === 'k')) {
                e.preventDefault();
                setVisible(true);
            }
        }
    });

    return (
        <>
            {visible && <SearchModal appear visible={visible} onDismissed={() => setVisible(false)} />}
            <button
                type={'button'}
                onClick={() => setVisible(true)}
                aria-label={'Search servers'}
                className={
                    'group flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-sm text-fg-subtle shadow-sm transition-colors duration-150 hover:border-line-strong hover:text-fg-muted sm:w-64'
                }
            >
                <SearchIcon className={'h-4 w-4 flex-none'} strokeWidth={1.8} />
                <span className={'hidden flex-1 text-left sm:block'}>Search servers…</span>
                <kbd
                    className={
                        'hidden rounded border border-line bg-surface-2 px-1.5 py-px font-sans text-[11px] font-medium text-fg-subtle sm:block'
                    }
                >
                    {isMac ? '⌘' : 'Ctrl'} K
                </kbd>
            </button>
        </>
    );
};
