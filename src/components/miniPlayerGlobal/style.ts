import styled from 'styled-components/native';
import { Image as ExpoImage } from 'expo-image';
import { Platform } from 'react-native';

export const Container = styled.View<{ insetBottom?: number }>`
  position: absolute;
  bottom: ${({ insetBottom = 0 }) => (Platform.OS === 'web' ? 0 : Math.max(0, insetBottom))}px;
  left: 0;
  right: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.border};
  z-index: 999;
  elevation: 10;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
`;

export const ProgressBarWrapper = styled.View`
  width: 100%;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.15);
`;

export const ProgressBarFill = styled.View<{ progressPercent: number }>`
  width: ${({ progressPercent }) => Math.min(100, Math.max(0, progressPercent))}%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
`;

export const InnerRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-vertical: ${({ theme }) => theme.spacing.sm + 2}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const PosterThumbnail = styled(ExpoImage)`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
`;

export const InfoContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

export const TitleText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const StatusRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
`;

export const StatusText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

export const ActionButtons = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

export const IconButton = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  align-items: center;
  justify-content: center;
`;
