import styled from 'styled-components/native';
import { Image as ExpoImage } from 'expo-image';

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const SearchHeader = styled.View<{ insetTop?: number }>`
  flex-direction: row;
  align-items: center;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-top: ${({ insetTop, theme }) => (insetTop ? insetTop + 8 : theme.spacing.md)}px;
  padding-bottom: ${({ theme }) => theme.spacing.sm}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.08);
`;

export const IconButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.06);
`;

export const SearchInputWrapper = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  height: 44px;
`;

export const SearchInput = styled.TextInput`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  padding-horizontal: ${({ theme }) => theme.spacing.sm}px;
`;

export const TabsContainer = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
})`
  flex-grow: 0;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.05);
`;

export const TabButton = styled.TouchableOpacity<{ isSelected?: boolean }>`
  padding-horizontal: 14px;
  padding-vertical: 7px;
  border-radius: 20px;
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : 'rgba(255, 255, 255, 0.06)'};
  border-width: 1px;
  border-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : 'rgba(255, 255, 255, 0.12)'};
`;

export const TabButtonText = styled.Text<{ isSelected?: boolean }>`
  color: ${({ isSelected }) => (isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)')};
  font-size: 13px;
  font-weight: ${({ isSelected }) => (isSelected ? 'bold' : '500')};
`;

export const ResultsListWrapper = styled.View`
  flex: 1;
`;

export const ResultCard = styled.TouchableOpacity`
  flex: 1;
  margin: 6px;
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: ${({ theme }) => theme.radii.md}px;
  overflow: hidden;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
`;

export const ResultPosterWrapper = styled.View`
  width: 100%;
  aspect-ratio: 0.68;
  background-color: rgba(0, 0, 0, 0.3);
  position: relative;
`;

export const ResultPoster = styled(ExpoImage)`
  width: 100%;
  height: 100%;
`;

export const TypeBadge = styled.View<{ typeBadge: 'live' | 'movie' | 'series' }>`
  position: absolute;
  top: 6px;
  left: 6px;
  background-color: ${({ typeBadge, theme }) =>
    typeBadge === 'live'
      ? '#E50914'
      : typeBadge === 'movie'
      ? '#1E88E5'
      : '#7B1FA2'};
  padding-horizontal: 6px;
  padding-vertical: 2px;
  border-radius: 4px;
`;

export const TypeBadgeText = styled.Text`
  color: #ffffff;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
`;

export const RatingBadge = styled.View`
  position: absolute;
  top: 6px;
  right: 6px;
  background-color: rgba(0, 0, 0, 0.75);
  flex-direction: row;
  align-items: center;
  padding-horizontal: 5px;
  padding-vertical: 2px;
  border-radius: 4px;
  gap: 3px;
`;

export const RatingText = styled.Text`
  color: #ffc107;
  font-size: 10px;
  font-weight: bold;
`;

export const ResultInfo = styled.View`
  padding: 8px;
`;

export const ResultTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: bold;
`;

export const ResultMeta = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  margin-top: 2px;
`;

export const EmptyContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px;
`;

export const EmptyTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: 17px;
  font-weight: bold;
  margin-top: 16px;
  text-align: center;
`;

export const EmptySubtitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  margin-top: 6px;
  text-align: center;
  line-height: 18px;
`;

export const LoadingWrapper = styled.View`
  padding-vertical: 30px;
  align-items: center;
  justify-content: center;
`;
