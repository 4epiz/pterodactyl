import styled from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded-xl no-underline text-fg items-center bg-surface p-4 transition-all duration-150 overflow-hidden`};
    box-shadow: 0 1px 2px rgb(var(--shadow) / 0.05), 0 0 0 1px rgb(var(--line));

    ${(props) =>
        props.$hoverable !== false &&
        `
        &:hover {
            box-shadow: 0 4px 12px -4px rgb(var(--shadow) / 0.12), 0 0 0 1px rgb(var(--line-strong));
        }
    `};

    & .icon {
        ${tw`rounded-lg w-10 h-10 flex flex-none items-center justify-center bg-surface-3 text-fg-muted`};
    }
`;
