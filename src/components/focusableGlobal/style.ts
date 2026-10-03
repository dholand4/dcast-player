import styled from 'styled-components/native';

export const FocusRing = styled.View<{ radius: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-width: 2px;
  border-color: #ffffff;
  border-radius: ${({ radius }) => radius}px;
  background-color: rgba(255, 255, 255, 0.12);
`;
