import styled from 'styled-components/native';

export const Container = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const BigCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
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
