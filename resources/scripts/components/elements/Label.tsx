import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Label = styled.label<{ isLight?: boolean }>`
    ${tw`block font-medium text-fg mb-1.5`};
    font-size: 0.8125rem;
`;

export default Label;
