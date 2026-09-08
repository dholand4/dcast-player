import styled from 'styled-components/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

export const Container = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingBottom: theme.spacing.xxl,
  },
}))`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const HeroContainer = styled.View`
  width: 100%;
  height: 380px;
  position: relative;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
`;

export const HeroBackdrop = styled(ExpoImage)`
  width: 100%;
  height: 100%;
`;

export const GradientOverlay = styled(LinearGradient)`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 240px;
`;

export const TopBar = styled.View<{ insetTop?: number }>`
  position: absolute;
  top: ${({ insetTop }) => (insetTop ? insetTop + 8 : 40)}px;
  left: ${({ theme }) => theme.spacing.md}px;
  right: ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
`;

export const CircleButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.overlay};
  align-items: center;
  justify-content: center;
`;

export const CircleButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const ContentPadding = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  margin-top: -30px;
`;

export const TitleText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.hero}px;
  font-weight: ${({ theme }) => theme.typography.weights.extraBold};
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

export const MetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const MetaText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
`;

export const ButtonRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const ButtonFlex = styled.View`
  flex: 1;
  height: 50px;
  justify-content: center;
`;


export const PlotText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  line-height: 22px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const SectionTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const SeasonScroll = styled.ScrollView.attrs(({ theme }) => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: {
    paddingVertical: theme.spacing.xs,
  },
}))`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const SeasonPill = styled.TouchableOpacity<{ isSelected: boolean }>`
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : theme.colors.surfaceLight};
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-vertical: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  margin-right: ${({ theme }) => theme.spacing.sm}px;
`;

export const SeasonPillText = styled.Text<{ isSelected: boolean }>`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ isSelected, theme }) =>
    isSelected ? theme.typography.weights.bold : theme.typography.weights.medium};
`;

export const EpisodeItem = styled.TouchableOpacity<{ isWatched?: boolean }>`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  border-width: 1px;
  border-color: ${({ isWatched, theme }) => (isWatched ? theme.colors.primary : theme.colors.border)};
  border-left-width: ${({ isWatched }) => (isWatched ? '5px' : '1px')};
  border-left-color: ${({ isWatched, theme }) => (isWatched ? theme.colors.primary : theme.colors.border)};
`;

export const EpisodeThumbWrapper = styled.View`
  width: 90px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  margin-right: ${({ theme }) => theme.spacing.md}px;
  position: relative;
`;

export const EpisodeThumb = styled(ExpoImage)`
  width: 100%;
  height: 100%;
`;

export const EpisodeInfo = styled.View`
  flex: 1;
`;

export const EpisodeTitle = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
`;

export const EpisodeSub = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: 2px;
`;
