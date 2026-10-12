import React, { useContext } from 'react';
import { DialogContext } from './';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(
            <div className={'px-6 py-3.5 bg-surface-2 border-t border-line flex items-center justify-end space-x-2'}>
                {children}
            </div>
        );
    }, [children]);

    return null;
};
