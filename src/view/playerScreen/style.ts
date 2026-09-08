import styled from 'styled-components/native';
import { Image as ExpoImage } from 'expo-image';
import { VideoView } from 'expo-video';

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.black};
`;

export const VideoWrapper = styled.View`
  flex: 1;
  position: relative;
  justify-content: center;
  align-items: center;
`;

export const StyledVideo = styled(VideoView)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

export const BackgroundPressable = styled.Pressable`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export const BufferingWrapper = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
`;

export const ControlsOverlay = styled.View`

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.overlay};
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

export const OverlayTouchable = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.overlay};
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

export const TopControls = styled.View<{ insetTop?: number }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: ${({ insetTop, theme }) => (insetTop ? insetTop : theme.spacing.md)}px;
`;

export const TopRightActions = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const ControlButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${({ theme }) => theme.colors.overlayDark};
  align-items: center;
  justify-content: center;
`;

export const ControlButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const PlayerTitle = styled.Text.attrs({
  numberOfLines: 1,
})`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  margin-horizontal: ${({ theme }) => theme.spacing.md}px;
`;

export const CenterControls = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const BigPlayButton = styled.TouchableOpacity`
  width: 68px;
  height: 68px;
  border-radius: 34px;
  background-color: ${({ theme }) => theme.colors.primary};
  align-items: center;
  justify-content: center;
`;

export const BigPlayText = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.sizes.xxl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const SeekButton = styled.TouchableOpacity`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${({ theme }) => theme.colors.overlayDark};
  align-items: center;
  justify-content: center;
`;

export const SeekText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const BottomControls = styled.View`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const TimeRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

export const TimeText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
`;

/* --- Remote Control Mode (Cast Ativo) --- */
export const RemoteContainer = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xl}px;
`;

export const RemoteTop = styled.View<{ insetTop?: number }>`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ insetTop, theme }) => (insetTop ? insetTop : theme.spacing.md)}px;
`;

export const CastBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(229, 9, 20, 0.2);
  border-radius: ${({ theme }) => theme.radii.round}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-vertical: ${({ theme }) => theme.spacing.xs}px;
`;

export const CastBadgeDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.primary};
  margin-right: ${({ theme }) => theme.spacing.xs}px;
`;

export const CastBadgeText = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const RemoteArtworkWrapper = styled.View`
  width: 220px;
  height: 220px;
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  elevation: 10;
`;

export const RemoteArtwork = styled(ExpoImage)`
  width: 100%;
  height: 100%;
`;

export const RemoteInfo = styled.View`
  align-items: center;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
`;

export const RemoteTitle = styled.Text.attrs({
  numberOfLines: 2,
})`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

export const RemoteSub = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
`;

export const ErrorOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.88);
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg}px;
  z-index: 10;
`;

export const ErrorBox = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  max-width: 440px;
  width: 100%;
  align-items: center;
`;

export const ErrorTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  margin-top: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
  text-align: center;
`;

export const ErrorMessage = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
  line-height: 20px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const ErrorButtonGroup = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.md}px;
  width: 100%;
  justify-content: center;
`;

