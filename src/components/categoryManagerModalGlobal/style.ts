import styled from 'styled-components/native';
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
  max-width: 620px;
  height: 85%;
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
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const HeaderTitleContainer = styled.View`
  flex: 1;
`;

export const ModalTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const ModalSubtitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: 2px;
`;

export const CloseButton = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  align-items: center;
  justify-content: center;
  margin-left: ${({ theme }) => theme.spacing.sm}px;
`;

export const TabBar = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { paddingHorizontal: 12 },
})`
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
`;

export const TabButton = styled.TouchableOpacity<{ isActive: boolean }>`
  flex-direction: row;
  align-items: center;
  padding-vertical: 12px;
  padding-horizontal: 14px;
  border-bottom-width: 2px;
  border-bottom-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary : 'transparent'};
`;

export const TabButtonText = styled.Text<{ isActive: boolean }>`
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ isActive, theme }) =>
    isActive ? theme.typography.weights.bold : theme.typography.weights.medium};
`;

export const TabBadge = styled.View<{ isActive: boolean }>`
  background-color: ${({ isActive, theme }) =>
    isActive ? 'rgba(229, 9, 20, 0.15)' : theme.colors.surfaceLight};
  padding-horizontal: 6px;
  padding-vertical: 2px;
  border-radius: 10px;
  margin-left: 6px;
`;

export const TabBadgeText = styled.Text<{ isActive: boolean }>`
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 11px;
  font-weight: bold;
`;

export const TabContent = styled.View`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md}px;
`;

export const SearchWrapper = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const ActionBanner = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const BannerInfoText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  flex: 1;
`;

export const CreateFolderBanner = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const CreateFolderBannerLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
  margin-right: 8px;
`;

export const CreateFolderIconCircle = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  margin-right: 10px;
`;

export const CreateFolderBannerTexts = styled.View`
  flex: 1;
`;

export const CreateFolderBannerTitle = styled.Text`
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const CreateFolderBannerSub = styled.Text`
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  margin-top: 1px;
`;

export const CreateFolderButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  gap: 6px;
  flex-shrink: 0;
`;

export const CreateFolderButtonText = styled.Text`
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const CategoryRow = styled.View<{ isHidden: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background-color: ${({ isHidden, theme }) =>
    isHidden ? 'rgba(0, 0, 0, 0.3)' : theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ isHidden, theme }) =>
    isHidden ? 'rgba(255, 255, 255, 0.05)' : theme.colors.border};
  margin-bottom: 8px;
  opacity: ${({ isHidden }) => (isHidden ? 0.6 : 1)};
`;

export const CategoryInfo = styled.View`
  flex: 1;
  margin-right: 12px;
`;

export const CategoryName = styled.Text<{ isHidden: boolean }>`
  color: ${({ isHidden, theme }) => (isHidden ? theme.colors.textMuted : theme.colors.text)};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  text-decoration-line: ${({ isHidden }) => (isHidden ? 'line-through' : 'none')};
`;

export const StatusBadge = styled.View<{ isHidden: boolean }>`
  margin-top: 4px;
  align-self: flex-start;
  padding-horizontal: 6px;
  padding-vertical: 2px;
  border-radius: 4px;
  background-color: ${({ isHidden, theme }) =>
    isHidden ? 'rgba(255, 255, 255, 0.08)' : 'rgba(3, 218, 198, 0.15)'};
`;

export const StatusBadgeText = styled.Text<{ isHidden: boolean }>`
  color: ${({ isHidden, theme }) => (isHidden ? theme.colors.textMuted : theme.colors.success)};
  font-size: 10px;
  font-weight: bold;
`;

export const ToggleButton = styled.TouchableOpacity<{ isHidden: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 92px;
  gap: 6px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ isHidden, theme }) =>
    isHidden ? theme.colors.surfaceLight : 'rgba(229, 9, 20, 0.1)'};
  border-width: 1px;
  border-color: ${({ isHidden, theme }) =>
    isHidden ? theme.colors.border : theme.colors.primary};
`;

export const ToggleButtonText = styled.Text<{ isHidden: boolean }>`
  color: ${({ isHidden, theme }) => (isHidden ? theme.colors.textSecondary : theme.colors.primary)};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const CustomFolderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  margin-bottom: 8px;
`;

export const FolderInfoContainer = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
  margin-right: 10px;
`;

export const FolderIconBox = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: rgba(76, 175, 80, 0.15);
  align-items: center;
  justify-content: center;
  margin-right: 10px;
`;

export const FolderTextsContainer = styled.View`
  flex: 1;
`;

export const FolderMetaText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  margin-top: 2px;
`;

export const FolderActions = styled.View`
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
`;

export const ActionIconButton = styled.TouchableOpacity`
  padding: 8px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  align-items: center;
  justify-content: center;
`;

export const EmptyContainer = styled.View`
  padding: 32px 16px;
  align-items: center;
  justify-content: center;
`;

export const EmptyText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
  margin-top: 12px;
`;
