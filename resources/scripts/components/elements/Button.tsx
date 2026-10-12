import React from 'react';
import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';

interface Props {
    isLoading?: boolean;
    size?: 'xsmall' | 'small' | 'large' | 'xlarge';
    color?: 'green' | 'red' | 'primary' | 'grey';
    isSecondary?: boolean;
}

const ButtonStyle = styled.button<Omit<Props, 'isLoading'>>`
    ${tw`relative inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 select-none whitespace-nowrap`};
    ${tw`h-9 px-3.5`};

    &:focus-visible {
        box-shadow: 0 0 0 2px rgb(var(--app)), 0 0 0 4px rgb(var(--ink) / 0.35);
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    ${(props) =>
        ((!props.isSecondary && !props.color) || props.color === 'primary') &&
        !props.isSecondary &&
        css`
            ${tw`bg-ink text-ink-fg shadow-sm`};

            &:hover:not(:disabled) {
                background: rgb(var(--ink) / 0.88);
            }
        `};

    ${(props) =>
        props.color === 'grey' &&
        !props.isSecondary &&
        css`
            ${tw`bg-surface text-fg shadow-sm`};
            box-shadow: inset 0 0 0 1px rgb(var(--line-strong));

            &:hover:not(:disabled) {
                ${tw`bg-surface-3`};
            }
        `};

    ${(props) =>
        props.color === 'green' &&
        !props.isSecondary &&
        css`
            ${tw`bg-green-600 text-white shadow-sm`};

            &:hover:not(:disabled) {
                ${tw`bg-green-500`};
            }
        `};

    ${(props) =>
        props.color === 'red' &&
        !props.isSecondary &&
        css`
            ${tw`bg-red-600 text-white shadow-sm`};

            &:hover:not(:disabled) {
                ${tw`bg-red-500`};
            }
        `};

    ${(props) =>
        props.isSecondary &&
        css<Props>`
            ${tw`bg-transparent text-fg`};
            box-shadow: inset 0 0 0 1px rgb(var(--line-strong));

            &:hover:not(:disabled) {
                ${tw`bg-surface-3`};
            }

            ${(props) =>
                props.color === 'red' &&
                css`
                    ${tw`text-red-500`};
                    box-shadow: inset 0 0 0 1px rgb(239 68 68 / 0.4);

                    &:hover:not(:disabled) {
                        background: rgb(239 68 68 / 0.1);
                    }
                `};

            ${(props) =>
                props.color === 'green' &&
                css`
                    ${tw`text-green-500`};
                    box-shadow: inset 0 0 0 1px rgb(16 185 129 / 0.4);

                    &:hover:not(:disabled) {
                        background: rgb(16 185 129 / 0.1);
                    }
                `};
        `};

    ${(props) => props.size === 'xsmall' && tw`h-7 px-2.5 text-xs rounded-md`};
    ${(props) => props.size === 'large' && tw`h-10 px-4`};
    ${(props) => props.size === 'xlarge' && tw`h-11 px-4 w-full`};

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

type ComponentProps = Omit<JSX.IntrinsicElements['button'], 'ref' | keyof Props> & Props;

const Button: React.FC<ComponentProps> = ({ children, isLoading, ...props }) => (
    <ButtonStyle {...props}>
        {isLoading && (
            <div css={tw`flex absolute justify-center items-center w-full h-full left-0 top-0`}>
                <Spinner size={'small'} />
            </div>
        )}
        <span css={isLoading ? tw`text-transparent` : undefined}>{children}</span>
    </ButtonStyle>
);

type LinkProps = Omit<JSX.IntrinsicElements['a'], 'ref' | keyof Props> & Props;

const LinkButton: React.FC<LinkProps> = (props) => <ButtonStyle as={'a'} {...props} />;

export { LinkButton, ButtonStyle };
export default Button;
