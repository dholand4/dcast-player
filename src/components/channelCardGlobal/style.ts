import styled from 'styled-components/native';
import { Image as ExpoImage } from 'expo-image';

export const Container = styled.View<{ isFocused?: boolean }>`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${({ theme }) => theme.spacing.sm}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ isFocused, theme }) => (isFocused ? theme.colors.surfaceCard : theme.colors.surface)};
  border-radius: ${({ theme }) => theme.radii.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  border-width: ${({ isFocused }) => (isFocused ? 2 : 1)}px;
  border-color: ${({ isFocused, theme }) => (isFocused ? theme.colors.primary : theme.colors.border)};
  ${({ isFocused }) => (isFocused ? 'transform: scale(1.02);' : '')}
`;

export const ContentPressable = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
`;

export const LogoWrapper = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  overflow: hidden;
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing.md}px;
`;

export const ChannelLogo = styled(ExpoImage)`
  width: 100%;
  height: 100%;
`;

export const ChannelFallbackText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const InfoContainer = styled.View`
  flex: 1;
`;

export const ChannelName = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
`;

export const ChannelNumber = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: 2px;
`;

export const ActionsContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const IconButton = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.spacing.xs}px;
  margin-left: ${({ theme }) => theme.spacing.xs}px;
`;

export const ActionIconText = styled.Text<{ isFavorite?: boolean }>`
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  color: ${({ isFavorite, theme }) =>
    isFavorite ? theme.colors.primary : theme.colors.textMuted};
`;
