import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import tw from 'twin.macro';

const ContentContainer = styled.div`
    max-width: 1440px;
    ${tw`mx-auto px-4`};

    ${breakpoint('sm')`
        ${tw`px-6`};
    `};

    ${breakpoint('lg')`
        ${tw`px-8`};
    `};
`;
ContentContainer.displayName = 'ContentContainer';

export default ContentContainer;
