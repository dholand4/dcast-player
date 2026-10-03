import styled from 'styled-components/native';

export const FocusRing = styled.View<{ radius: number; color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-width: 2px;
  border-color: ${({ color }) => color};
  border-radius: ${({ radius }) => radius}px;
`;
