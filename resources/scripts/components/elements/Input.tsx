import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export interface Props {
    isLight?: boolean;
    hasError?: boolean;
}

// The theme styles inputs the same way on light and dark surfaces; "isLight"
// is kept for compatibility with existing callers and addons.
const light = css<Props>``;

const checkboxStyle = css<Props>`
    ${tw`bg-surface cursor-pointer appearance-none inline-block align-middle select-none flex-shrink-0 w-4 h-4 text-accent border border-line-strong rounded`};
    color-adjust: exact;
    background-origin: border-box;
    transition: all 75ms linear, box-shadow 25ms linear;

    &:checked {
        ${tw`border-transparent bg-no-repeat bg-center`};
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-color: currentColor;
        background-size: 100% 100%;
    }

    &:focus {
        ${tw`outline-none`};
        box-shadow: 0 0 0 3px rgb(var(--accent) / 0.2);
    }
`;

const inputStyle = css<Props>`
    // Reset to normal styling.
    resize: none;
    ${tw`appearance-none outline-none w-full min-w-0`};
    ${tw`px-3 py-2 border rounded-lg text-sm transition-all duration-150`};
    ${tw`bg-surface border-line-strong text-fg shadow-sm focus:ring-0`};
    line-height: 1.25rem;

    &::placeholder {
        ${tw`text-fg-subtle`};
    }

    &:hover:not(:disabled):not(:focus) {
        border-color: rgb(var(--fg-subtle) / 0.6);
    }

    & + .input-help {
        ${tw`mt-1.5 text-xs`};
        ${(props) => (props.hasError ? tw`text-red-500` : tw`text-fg-subtle`)};
    }

    &:required,
    &:invalid {
        ${tw`shadow-none`};
    }

    &:not(:disabled):not(:read-only):focus {
        border-color: rgb(var(--accent) / 0.7);
        box-shadow: 0 0 0 3px rgb(var(--accent) / 0.15);
        ${(props) =>
            props.hasError &&
            css`
                border-color: rgb(239 68 68 / 0.8);
                box-shadow: 0 0 0 3px rgb(239 68 68 / 0.15);
            `};
    }

    &:disabled,
    &:read-only {
        ${tw`bg-surface-2 text-fg-muted`};
    }

    &:disabled {
        ${tw`cursor-not-allowed opacity-75`};
    }

    ${(props) => props.isLight && light};
    ${(props) => props.hasError && tw`border-red-500`};
`;

const Input = styled.input<Props>`
    &:not([type='checkbox']):not([type='radio']) {
        ${inputStyle};
    }

    &[type='checkbox'],
    &[type='radio'] {
        ${checkboxStyle};

        &[type='radio'] {
            ${tw`rounded-full`};
        }
    }
`;
const Textarea = styled.textarea<Props>`
    ${inputStyle}
`;

export { Textarea };
export default Input;
