import React, { useState } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRightIcon,
    CheckCircleIcon,
    ExclamationIcon,
    InformationCircleIcon,
    ShieldExclamationIcon,
    XIcon,
} from '@heroicons/react/outline';
import { themeConfig } from '@/components/theme/config';

const tones = {
    info: { box: 'border-line bg-surface', icon: 'text-accent-text', Icon: InformationCircleIcon },
    success: {
        box: 'border-emerald-500/25 bg-emerald-500/[0.07]',
        icon: 'text-emerald-600 dark:text-emerald-400',
        Icon: CheckCircleIcon,
    },
    warning: {
        box: 'border-amber-500/25 bg-amber-500/[0.07]',
        icon: 'text-amber-600 dark:text-amber-400',
        Icon: ExclamationIcon,
    },
    danger: {
        box: 'border-red-500/25 bg-red-500/[0.07]',
        icon: 'text-red-600 dark:text-red-400',
        Icon: ShieldExclamationIcon,
    },
};

const storageKey = (id: string) => `panel:announcement:${id}`;

const isDismissed = (id: string) => {
    try {
        return window.localStorage.getItem(storageKey(id)) === '1';
    } catch (e) {
        return false;
    }
};

/**
 * The announcement set in Admin > Theme, shown at the top of every client
 * area page. Dismissals are remembered per browser until the text changes.
 */
export default () => {
    const announcement = themeConfig().announcement;
    const [visible, setVisible] = useState(() => !!announcement && !isDismissed(announcement.id));

    if (!announcement) return null;

    const tone = tones[announcement.type] || tones.info;
    const dismiss = () => {
        try {
            window.localStorage.setItem(storageKey(announcement.id), '1');
        } catch (e) {
            // Hidden for this page view only.
        }
        setVisible(false);
    };

    return (
        <AnimatePresence initial={false}>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className={'overflow-hidden'}
                >
                    <div className={'mx-auto max-w-[1440px] px-4 pt-5 sm:px-6 lg:px-8'}>
                        <div
                            role={'status'}
                            className={classNames(
                                'flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-card sm:items-center',
                                tone.box
                            )}
                        >
                            <tone.Icon
                                className={classNames('mt-px h-5 w-5 flex-none sm:mt-0', tone.icon)}
                                strokeWidth={1.8}
                            />
                            <div className={'flex min-w-0 flex-1 flex-col gap-x-4 gap-y-1 sm:flex-row sm:items-center'}>
                                <p className={'min-w-0 flex-1 text-sm leading-relaxed text-fg'}>
                                    {announcement.title && (
                                        <span className={'mr-1.5 font-semibold'}>{announcement.title}</span>
                                    )}
                                    <span className={'text-fg-muted'}>{announcement.message}</span>
                                </p>
                                {announcement.link_url && (
                                    <a
                                        href={announcement.link_url}
                                        target={'_blank'}
                                        rel={'noopener noreferrer'}
                                        className={
                                            'inline-flex flex-none items-center gap-1.5 text-sm font-semibold text-fg no-underline hover:underline'
                                        }
                                    >
                                        {announcement.link_label || 'Learn more'}
                                        <ArrowRightIcon className={'h-3.5 w-3.5'} strokeWidth={2} />
                                    </a>
                                )}
                            </div>
                            {announcement.dismissible && (
                                <button
                                    type={'button'}
                                    onClick={dismiss}
                                    aria-label={'Dismiss announcement'}
                                    className={
                                        '-my-1 -mr-1.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg'
                                    }
                                >
                                    <XIcon className={'h-4 w-4'} strokeWidth={1.8} />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
