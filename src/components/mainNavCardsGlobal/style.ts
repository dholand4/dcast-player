import styled from 'styled-components/native';

export const Container = styled.View<{ isRow?: boolean }>`
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
  ${({ isRow }) => (isRow ? 'flex-direction: row;' : '')}
`;

export const BigCard = styled.TouchableOpacity<{ isFocused?: boolean; isRow?: boolean }>`
  flex-direction: row;
  align-items: center;
  background-color: ${({ isFocused, theme }) => (isFocused ? theme.colors.surfaceCard : theme.colors.surface)};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-width: ${({ isFocused }) => (isFocused ? 2 : 1)}px;
  border-color: ${({ isFocused, theme }) => (isFocused ? theme.colors.primary : theme.colors.border)};
  ${({ isFocused }) => (isFocused ? 'transform: scale(1.03);' : '')}
  ${({ isRow }) => (isRow ? 'flex: 1;' : '')}
`;

export const IconBox = styled.View<{ accentColor?: string }>`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ accentColor, theme }) => accentColor || theme.colors.surfaceLight};
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing.md}px;
`;

export const IconText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizes.xxl}px;
`;

export const TextContent = styled.View`
  flex: 1;
`;

export const CardTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  margin-bottom: 2px;
`;

export const CardSubtitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
`;

export const ArrowText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;
