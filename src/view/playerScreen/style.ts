import styled from 'styled-components/native';
import { Image as ExpoImage } from 'expo-image';
import { VideoView } from 'expo-video';

export const Container = styled.View`
  flex: 1;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.black};
  overflow: hidden;
`;

export const VideoWrapper = styled.View`
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.black};
`;

export const StyledVideo = styled(VideoView)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
`;

export const BackgroundPressable = styled.Pressable`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
`;

export const BufferingWrapper = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

export const ControlsOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
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

/* --- EPG (Guia de TV) --- */
export const EpgContainer = styled.View`
  background-color: rgba(18, 18, 18, 0.88);
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  margin-top: ${({ theme }) => theme.spacing.sm}px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  max-width: 500px;
  width: 100%;
`;

export const EpgHeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const EpgNowBadge = styled.View`
  background-color: ${({ theme }) => theme.colors.primary};
  padding-horizontal: 6px;
  padding-vertical: 2px;
  border-radius: 4px;
`;

export const EpgNowBadgeText = styled.Text`
  color: #ffffff;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
`;

export const EpgProgramTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  margin-top: 2px;
`;

export const EpgTimeRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
`;

export const EpgTimeText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
`;

export const EpgTrack = styled.View`
  width: 100%;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
`;

export const EpgFill = styled.View<{ widthPercent: number }>`
  width: ${({ widthPercent }) => Math.max(0, Math.min(100, widthPercent))}%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
`;

export const EpgNextText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  margin-top: 6px;
  font-style: italic;
`;

/* --- GAVETA LATERAL DE CANAIS (ZAPPING) --- */
export const DrawerBackdrop = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 20;
`;

export const DrawerContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  max-width: 85%;
  background-color: rgba(18, 18, 18, 0.96);
  border-right-width: 1px;
  border-right-color: rgba(255, 255, 255, 0.12);
  z-index: 21;
  padding: ${({ theme }) => theme.spacing.md}px;
`;

export const DrawerHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const DrawerTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const DrawerSearchInput = styled.TextInput`
  background-color: rgba(255, 255, 255, 0.08);
  color: ${({ theme }) => theme.colors.text};
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const DrawerItem = styled.TouchableOpacity<{ isActive?: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: ${({ isActive }) => (isActive ? 'rgba(229, 9, 20, 0.2)' : 'transparent')};
  margin-bottom: 4px;
`;

export const DrawerItemLogo = styled(ExpoImage)`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  margin-right: 10px;
  background-color: rgba(255, 255, 255, 0.05);
`;

export const DrawerItemText = styled.Text<{ isActive?: boolean }>`
  color: ${({ isActive, theme }) => (isActive ? theme.colors.primaryLight : theme.colors.text)};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ isActive }) => (isActive ? 'bold' : 'normal')};
  flex: 1;
`;

/* --- MODAL DE ÁUDIO / LEGENDAS / VELOCIDADE --- */
export const SettingsModalBackdrop = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  justify-content: center;
  align-items: center;
  z-index: 25;
  padding: ${({ theme }) => theme.spacing.md}px;
`;

export const SettingsModalContent = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  max-width: 420px;
  width: 100%;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

export const SettingsSection = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const SettingsSectionTitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
`;

export const SpeedRow = styled.View`
  flex-direction: row;
  gap: 8px;
  flex-wrap: wrap;
`;

export const SpeedButton = styled.TouchableOpacity<{ isSelected?: boolean }>`
  padding: 8px 14px;
  border-radius: 20px;
  border-width: 1px;
  border-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : 'rgba(255, 255, 255, 0.2)'};
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : 'rgba(255, 255, 255, 0.05)'};
`;

export const SpeedButtonText = styled.Text<{ isSelected?: boolean }>`
  color: ${({ isSelected }) => (isSelected ? '#ffffff' : '#e0e0e0')};
  font-size: 13px;
  font-weight: bold;
`;

export const TrackItem = styled.TouchableOpacity<{ isSelected?: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  background-color: ${({ isSelected }) =>
    isSelected ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255, 255, 255, 0.04)'};
  margin-bottom: 6px;
`;

export const TrackItemText = styled.Text<{ isSelected?: boolean }>`
  color: ${({ isSelected, theme }) => (isSelected ? theme.colors.primaryLight : theme.colors.text)};
  font-size: 14px;
  font-weight: ${({ isSelected }) => (isSelected ? 'bold' : 'normal')};
`;

/* --- Card Próximo Episódio (Estilo Netflix) --- */
export const NextEpisodeContainer = styled.View`
  position: absolute;
  bottom: 80px;
  right: 24px;
  z-index: 100;
  max-width: 380px;
  width: 90%;
  background-color: rgba(18, 18, 18, 0.95);
  border-radius: 12px;
  padding: 14px 16px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.15);
`;

export const NextEpisodeHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

export const NextEpisodeCountdown = styled.Text`
  color: ${({ theme }) => theme.colors.primaryLight};
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

export const NextEpisodeTitle = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
`;

export const NextEpisodeButtonRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

export const NextEpisodePlayBtn = styled.TouchableOpacity`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.primary};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-vertical: 8px;
  padding-horizontal: 14px;
  border-radius: 6px;
`;

export const NextEpisodePlayBtnText = styled.Text`
  color: #ffffff;
  font-size: 13px;
  font-weight: bold;
  margin-left: 6px;
`;

export const NextEpisodeCancelBtn = styled.TouchableOpacity`
  padding-vertical: 8px;
  padding-horizontal: 12px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
`;

export const NextEpisodeCancelBtnText = styled.Text`
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  font-weight: 500;
`;

/* --- Bloqueio de Tela (Lock Screen) --- */
export const LockScreenBackdrop = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 120;
  align-items: center;
  justify-content: center;
`;

export const UnlockButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: rgba(18, 18, 18, 0.92);
  padding-horizontal: 20px;
  padding-vertical: 12px;
  border-radius: 30px;
  border-width: 1.5px;
  border-color: ${({ theme }) => theme.colors.primary};
`;

export const UnlockButtonText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  margin-left: 8px;
`;

/* --- Sleep Timer Badge --- */
export const SleepTimerBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(229, 9, 20, 0.25);
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.primary};
  padding-horizontal: 8px;
  padding-vertical: 4px;
  border-radius: 12px;
  margin-right: 8px;
`;

export const SleepTimerBadgeText = styled.Text`
  color: #ffffff;
  font-size: 11px;
  font-weight: bold;
  margin-left: 4px;
`;

