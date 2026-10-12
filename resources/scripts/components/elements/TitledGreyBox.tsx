import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <div className={`rounded-xl bg-surface shadow-card ${className || ''}`}>
        <div css={tw`px-5 py-3.5 border-b border-line`}>
            {typeof title === 'string' ? (
                <p css={tw`flex items-center text-sm font-semibold text-fg`}>
                    {icon && <FontAwesomeIcon icon={icon} css={tw`mr-2.5 text-fg-subtle`} />}
                    {title}
                </p>
            ) : (
                title
            )}
        </div>
        <div css={tw`p-5`}>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
