import styled from 'styled-components/native';

interface IContainerProps {
  fullscreen?: boolean;
}

export const Container = styled.View<IContainerProps>`
  flex: ${({ fullscreen }) => (fullscreen ? 1 : 0)};
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg}px;
  background-color: ${({ fullscreen, theme }) =>
    fullscreen ? theme.colors.background : theme.colors.transparent};
`;

export const StyledSpinner = styled.ActivityIndicator.attrs(({ theme }) => ({
  color: theme.colors.primary,
  size: 'large',
}))``;

export const MessageText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  margin-top: ${({ theme }) => theme.spacing.sm}px;
  text-align: center;
`;
