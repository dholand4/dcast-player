import styled from 'styled-components/native';
import { FocusableGlobal } from '../focusableGlobal';
import { Image as ExpoImage } from 'expo-image';

// Sem transform no foco: este View envolve o botão focado, e ganhar um transform faz o Android
// remontar os filhos dele. O botão sai e volta da tela, perde o foco e o controle pula para a seta
// de voltar. No card de filme o zoom fica num filho do botão focado, por isso lá funciona
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
`;

export const ContentPressable = styled(FocusableGlobal).attrs({ focusRing: false })`
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

export const IconButton = styled(FocusableGlobal)`
  padding: ${({ theme }) => theme.spacing.xs}px;
  margin-left: ${({ theme }) => theme.spacing.xs}px;
`;

export const ActionIconText = styled.Text<{ isFavorite?: boolean }>`
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  color: ${({ isFavorite, theme }) =>
    isFavorite ? theme.colors.primary : theme.colors.textMuted};
`;
