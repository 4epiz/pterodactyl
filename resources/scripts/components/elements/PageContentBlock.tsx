import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import { themeConfig } from '@/components/theme/config';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
        }
    }, [title]);

    return (
        <>
            <ContentContainer css={tw`py-6 sm:py-8`} className={className}>
                {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
                {children}
            </ContentContainer>
            <ContentContainer css={tw`pb-6`}>
                <p className={'text-xs text-fg-subtle'}>
                    <a
                        rel={'noopener nofollow noreferrer'}
                        href={'https://pterodactyl.io'}
                        target={'_blank'}
                        className={'text-fg-subtle no-underline hover:text-fg-muted'}
                    >
                        Pterodactyl&reg;
                    </a>
                    &nbsp;&copy; 2015 - {new Date().getFullYear()}
                    {themeConfig().branding.footer_text && (
                        <span className={'ml-3 border-l border-line pl-3'}>{themeConfig().branding.footer_text}</span>
                    )}
                </p>
            </ContentContainer>
        </>
    );
};

export default PageContentBlock;
