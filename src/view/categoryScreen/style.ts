import { Platform } from 'react-native';
import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const SearchRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-top: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${Platform.OS === 'web' ? 14 : 6}px;
`;

export const HamburgerButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  height: 52px;
  margin-right: ${({ theme }) => theme.spacing.sm}px;
`;

export const HamburgerButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
  margin-left: ${({ theme }) => theme.spacing.xs}px;
`;

export const SearchInputContainer = styled.View`
  flex: 1;
  height: 52px;
  justify-content: center;
`;

export const CategoryTitleRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-top: ${({ theme }) => theme.spacing.md}px;
  padding-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

export const CategoryTitleText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const CategoryItemsCount = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

export const SearchWrapper = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-top: ${({ theme }) => theme.spacing.sm}px;
`;

export const CategoryScroll = styled.ScrollView.attrs(({ theme }) => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
}))`
  max-height: 48px;
`;

export const CategoryPill = styled.TouchableOpacity<{ isSelected: boolean }>`
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : theme.colors.surfaceLight};
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-vertical: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  margin-right: ${({ theme }) => theme.spacing.sm}px;
  justify-content: center;
  align-items: center;
`;

export const CategoryPillText = styled.Text<{ isSelected: boolean }>`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ isSelected, theme }) =>
    isSelected ? theme.typography.weights.bold : theme.typography.weights.medium};
`;

export const ContentArea = styled.View`
  flex: 1;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
`;

export const EmptyContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl}px;
`;

export const EmptyText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.sm}px;
`;

export const EmptyActionButton = styled.TouchableOpacity`
  margin-top: ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.primary};
  padding-horizontal: ${({ theme }) => theme.spacing.lg}px;
  padding-vertical: ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radii.md}px;
`;

export const EmptyActionButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;
