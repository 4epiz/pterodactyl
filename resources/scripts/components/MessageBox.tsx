import * as React from 'react';
import classNames from 'classnames';
import { motion } from 'framer-motion';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    title?: string;
    children: string;
    type?: FlashMessageType;
}

const tone: Record<FlashMessageType, { box: string; dot: string }> = {
    error: { box: 'bg-red-500/[0.08] ring-red-500/25', dot: 'bg-red-500' },
    info: { box: 'bg-surface ring-line', dot: 'bg-fg-subtle' },
    success: { box: 'bg-emerald-500/[0.08] ring-emerald-500/25', dot: 'bg-emerald-500' },
    warning: { box: 'bg-amber-500/[0.08] ring-amber-500/25', dot: 'bg-amber-500' },
};

const MessageBox = ({ title, children, type = 'info' }: Props) => (
    <motion.div
        role={'alert'}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={classNames(
            'flex w-full items-start gap-3 rounded-xl px-4 py-3 text-sm leading-relaxed text-fg ring-1 ring-inset',
            tone[type].box
        )}
    >
        <span className={classNames('mt-[7px] h-1.5 w-1.5 flex-none rounded-full', tone[type].dot)} />
        <span className={'min-w-0 flex-auto'}>
            {title && <span className={'mr-1.5 font-semibold'}>{title}.</span>}
            {children}
        </span>
    </motion.div>
);
MessageBox.displayName = 'MessageBox';

export default MessageBox;
