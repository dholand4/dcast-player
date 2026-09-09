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
  height: 90%;
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
  padding: 8px 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const HeaderTitleContainer = styled.View`
  flex: 1;
`;

export const ModalTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const ModalSubtitle = styled.Text`
  display: none;
`;

export const CloseButton = styled.TouchableOpacity`
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  align-items: center;
  justify-content: center;
  margin-left: ${({ theme }) => theme.spacing.sm}px;
`;

export const TabBar = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center' },
})`
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  flex-grow: 0;
`;

export const TabButton = styled.TouchableOpacity<{ isActive: boolean }>`
  flex-direction: row;
  align-items: center;
  padding-vertical: 5px;
  padding-horizontal: 10px;
  border-radius: 14px;
  background-color: ${({ isActive, theme }) =>
    isActive ? 'rgba(229, 9, 20, 0.15)' : theme.colors.surfaceLight};
  border-width: 1px;
  border-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary : 'transparent'};
  margin-right: 6px;
`;

export const TabButtonText = styled.Text<{ isActive: boolean }>`
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 11px;
  font-weight: ${({ isActive, theme }) =>
    isActive ? theme.typography.weights.bold : theme.typography.weights.medium};
`;

export const TabBadge = styled.View<{ isActive: boolean }>`
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)'};
  padding-horizontal: 5px;
  padding-vertical: 1px;
  border-radius: 6px;
  margin-left: 4px;
`;

export const TabBadgeText = styled.Text<{ isActive: boolean }>`
  color: #ffffff;
  font-size: 9px;
  font-weight: bold;
`;

export const TabContent = styled.View`
  flex: 1;
  padding: 6px 8px;
`;

export const SearchWrapper = styled.View`
  margin-bottom: 4px;
`;

export const ActionBanner = styled.View`
  display: none;
`;

export const BannerInfoText = styled.Text`
  display: none;
`;

export const CreateFolderBanner = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #2E7D32;
  padding-vertical: 7px;
  padding-horizontal: 10px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  margin-bottom: 6px;
  gap: 4px;
`;

export const CreateFolderBannerTitle = styled.Text`
  color: #ffffff;
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const CategoryRow = styled.View<{ isHidden: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: ${({ isHidden, theme }) =>
    isHidden ? 'rgba(0, 0, 0, 0.3)' : theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ isHidden, theme }) =>
    isHidden ? 'rgba(255, 255, 255, 0.05)' : theme.colors.border};
  margin-bottom: 4px;
  opacity: ${({ isHidden }) => (isHidden ? 0.6 : 1)};
`;

export const CategoryInfo = styled.View`
  flex: 1;
  margin-right: 10px;
`;

export const CategoryName = styled.Text<{ isHidden: boolean }>`
  color: ${({ isHidden, theme }) => (isHidden ? theme.colors.textMuted : theme.colors.text)};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  text-decoration-line: ${({ isHidden }) => (isHidden ? 'line-through' : 'none')};
`;

export const StatusBadge = styled.View<{ isHidden: boolean }>`
  margin-top: 2px;
  align-self: flex-start;
  padding-horizontal: 5px;
  padding-vertical: 1px;
  border-radius: 4px;
  background-color: ${({ isHidden, theme }) =>
    isHidden ? 'rgba(255, 255, 255, 0.08)' : 'rgba(3, 218, 198, 0.15)'};
`;

export const StatusBadgeText = styled.Text<{ isHidden: boolean }>`
  color: ${({ isHidden, theme }) => (isHidden ? theme.colors.textMuted : theme.colors.success)};
  font-size: 9px;
  font-weight: bold;
`;

export const ToggleButton = styled.TouchableOpacity<{ isHidden: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 78px;
  gap: 4px;
  padding: 5px 8px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: ${({ isHidden, theme }) =>
    isHidden ? theme.colors.surfaceLight : 'rgba(229, 9, 20, 0.1)'};
  border-width: 1px;
  border-color: ${({ isHidden, theme }) =>
    isHidden ? theme.colors.border : theme.colors.primary};
`;

export const ToggleButtonText = styled.Text<{ isHidden: boolean }>`
  color: ${({ isHidden, theme }) => (isHidden ? theme.colors.textSecondary : theme.colors.primary)};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const CustomFolderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  margin-bottom: 4px;
`;

export const FolderInfoContainer = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
  margin-right: 8px;
`;

export const FolderIconBox = styled.View`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: rgba(76, 175, 80, 0.15);
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

export const FolderTextsContainer = styled.View`
  flex: 1;
`;

export const FolderMetaText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  margin-top: 1px;
`;

export const FolderActions = styled.View`
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
`;

export const ActionIconButton = styled.TouchableOpacity`
  padding: 6px;
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
