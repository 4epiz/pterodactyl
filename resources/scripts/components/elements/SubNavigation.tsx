import styled from 'styled-components/macro';
import tw from 'twin.macro';

// No longer used by the panel's own routers (the sidebar replaced it) but kept,
// restyled, for addons that render their own tab bars.
const SubNavigation = styled.div`
    ${tw`w-full border-b border-line overflow-x-auto`};

    & > div {
        ${tw`flex items-center gap-1 text-sm mx-auto px-4`};
        max-width: 1180px;

        & > a,
        & > div {
            ${tw`relative inline-block py-3 px-3 text-fg-muted no-underline whitespace-nowrap transition-colors duration-150`};

            &:hover {
                ${tw`text-fg`};
            }

            &:active,
            &.active {
                ${tw`text-fg`};
                box-shadow: inset 0 -2px rgb(var(--ink));
            }
        }
    }
`;

export default SubNavigation;
