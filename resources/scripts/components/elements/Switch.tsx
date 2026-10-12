import React, { useMemo } from 'react';
import styled from 'styled-components/macro';
import { v4 } from 'uuid';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';

const ToggleContainer = styled.div`
    ${tw`relative select-none w-9 leading-normal`};

    & > input[type='checkbox'] {
        ${tw`hidden`};

        &:checked + label {
            ${tw`bg-accent`};
        }

        &:checked + label:before {
            transform: translateX(1rem);
            background: rgb(var(--accent-fg));
        }

        &:disabled + label {
            ${tw`opacity-50 cursor-not-allowed`};
        }
    }

    & > label {
        ${tw`mb-0 block overflow-hidden cursor-pointer bg-surface-3 rounded-full h-5`};
        box-shadow: inset 0 0 0 1px rgb(var(--line-strong));
        transition: background-color 150ms ease;

        &::before {
            ${tw`absolute block h-4 w-4 rounded-full`};
            background: rgb(var(--surface));
            box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
            top: 0.125rem;
            left: 0.125rem;
            content: '';
            transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1), background-color 150ms ease;
        }
    }
`;

export interface SwitchProps {
    name: string;
    label?: string;
    description?: string;
    defaultChecked?: boolean;
    readOnly?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    children?: React.ReactNode;
}

const Switch = ({ name, label, description, defaultChecked, readOnly, onChange, children }: SwitchProps) => {
    const uuid = useMemo(() => v4(), []);

    return (
        <div css={tw`flex items-center`}>
            <ToggleContainer css={tw`flex-none`}>
                {children || (
                    <Input
                        id={uuid}
                        name={name}
                        type={'checkbox'}
                        onChange={(e) => onChange && onChange(e)}
                        defaultChecked={defaultChecked}
                        disabled={readOnly}
                    />
                )}
                <Label htmlFor={uuid} />
            </ToggleContainer>
            {(label || description) && (
                <div css={tw`ml-4 w-full`}>
                    {label && (
                        <Label css={[tw`cursor-pointer`, !!description && tw`mb-0`]} htmlFor={uuid}>
                            {label}
                        </Label>
                    )}
                    {description && <p css={tw`text-fg-subtle text-sm mt-1`}>{description}</p>}
                </div>
            )}
        </div>
    );
};

export default Switch;
