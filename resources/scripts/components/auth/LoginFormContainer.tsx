import React, { forwardRef } from 'react';
import { Form } from 'formik';
import { motion } from 'framer-motion';
import { ServerIcon } from '@heroicons/react/outline';
import { useStoreState } from 'easy-peasy';
import FlashMessageRender from '@/components/FlashMessageRender';
import ThemeToggle from '@/components/theme/ThemeToggle';
import AuthShowcase from '@/components/theme/AuthShowcase';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
    subtitle?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, subtitle, className: _className, ...props }, ref) => {
    const name = useStoreState((state) => state.settings.data?.name || 'Pterodactyl');

    return (
        <div className={'grid min-h-screen bg-app lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'}>
            <div className={'flex min-h-screen flex-col px-6 py-6 sm:px-10'}>
                <header className={'flex items-center justify-between'}>
                    <span className={'flex items-center gap-2.5'}>
                        <span
                            className={
                                'flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-ink-fg shadow-card'
                            }
                        >
                            <ServerIcon className={'h-4 w-4'} strokeWidth={1.8} />
                        </span>
                        <span className={'text-[15px] font-semibold tracking-tight text-fg'}>{name}</span>
                    </span>
                    <ThemeToggle />
                </header>
                <main className={'flex flex-1 items-center justify-center py-12'}>
                    <motion.div
                        className={'w-full max-w-sm'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {title && <h1 className={'text-[28px] font-semibold tracking-tight text-fg'}>{title}</h1>}
                        {subtitle && <p className={'mt-2 text-sm text-fg-muted'}>{subtitle}</p>}
                        <FlashMessageRender className={'mt-6'} />
                        <Form {...props} ref={ref} className={'mt-8'}>
                            {props.children}
                        </Form>
                    </motion.div>
                </main>
                <footer className={'text-xs text-fg-subtle'}>
                    &copy; 2015 - {new Date().getFullYear()}&nbsp;
                    <a
                        rel={'noopener nofollow noreferrer'}
                        href={'https://pterodactyl.io'}
                        target={'_blank'}
                        className={'text-fg-subtle no-underline hover:text-fg-muted'}
                    >
                        Pterodactyl Software
                    </a>
                </footer>
            </div>
            <div className={'hidden p-3 lg:block'}>
                <AuthShowcase />
            </div>
        </div>
    );
});
