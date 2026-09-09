import styled from 'styled-components/native';
import { Image as ExpoImage } from 'expo-image';
import { Platform } from 'react-native';

export const ModalBackdrop = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.overlayDark};
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md}px;
`;

export const ModalContainer = styled.View`
  width: 100%;
  max-width: 580px;
  max-height: 85%;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  overflow: hidden;
  ${Platform.OS === 'web' ? 'box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);' : ''}
`;

export const ModalHeader = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const ChannelLogoWrapper = styled.View`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin-right: ${({ theme }) => theme.spacing.sm}px;
`;

export const ChannelLogo = styled(ExpoImage)`
  width: 100%;
  height: 100%;
`;

export const ChannelInfo = styled.View`
  flex: 1;
`;

export const ChannelTitleText = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const ChannelSubText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: 2px;
`;

export const CloseButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

export const HeaderSubtitleBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-vertical: ${({ theme }) => theme.spacing.xs}px;
  background-color: rgba(255, 255, 255, 0.02);
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
`;

export const SubtitleBarText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

export const ProgramItemContainer = styled.TouchableOpacity<{ isCurrent: boolean }>`
  padding: ${({ theme }) => theme.spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.06);
  background-color: ${({ isCurrent, theme }) =>
    isCurrent ? 'rgba(3, 218, 198, 0.08)' : 'transparent'};
  ${({ isCurrent, theme }) =>
    isCurrent ? `border-left-width: 4px; border-left-color: ${theme.colors.success};` : ''}
`;

export const ProgramTopRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const ProgramTimeText = styled.Text<{ isCurrent: boolean; isPast: boolean }>`
  color: ${({ isCurrent, isPast, theme }) =>
    isCurrent
      ? theme.colors.success
      : isPast
      ? theme.colors.textMuted
      : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ isCurrent, theme }) =>
    isCurrent ? theme.typography.weights.bold : theme.typography.weights.medium};
`;

export const ProgramBadge = styled.View<{ variant: 'now' | 'next' | 'past' }>`
  padding-horizontal: 8px;
  padding-vertical: 2px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  background-color: ${({ variant, theme }) =>
    variant === 'now'
      ? theme.colors.success
      : variant === 'next'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(255, 255, 255, 0.06)'};
`;

export const ProgramBadgeText = styled.Text<{ variant: 'now' | 'next' | 'past' }>`
  color: ${({ variant, theme }) =>
    variant === 'now' ? '#000000' : theme.colors.textSecondary};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  text-transform: uppercase;
`;

export const ProgramTitleText = styled.Text<{ isCurrent: boolean; isPast: boolean }>`
  color: ${({ isPast, theme }) =>
    isPast ? theme.colors.textSecondary : theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ isCurrent, theme }) =>
    isCurrent ? theme.typography.weights.bold : theme.typography.weights.semiBold};
`;

export const ProgramDescriptionText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  line-height: 18px;
  margin-top: 6px;
`;

export const ProgressBarTrack = styled.View`
  height: 4px;
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.View<{ widthPercent: number }>`
  height: 100%;
  width: ${({ widthPercent }) => Math.min(100, Math.max(0, widthPercent))}%;
  background-color: ${({ theme }) => theme.colors.success};
  border-radius: 2px;
`;

export const LoadingWrapper = styled.View`
  padding: ${({ theme }) => theme.spacing.xl}px;
  align-items: center;
  justify-content: center;
`;

export const EmptyWrapper = styled.View`
  padding: ${({ theme }) => theme.spacing.xl}px;
  align-items: center;
  justify-content: center;
`;

export const EmptyMessageText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.sm}px;
`;
