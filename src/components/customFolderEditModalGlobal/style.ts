import styled from 'styled-components/native';
import { Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

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

export const FormBody = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
`;

export const SearchWrapper = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const SelectionCountBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const SelectionCountText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const ClearSelectionText = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const StreamItem = styled.TouchableOpacity<{ isSelected: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ isSelected, theme }) =>
    isSelected ? 'rgba(229, 9, 20, 0.12)' : theme.colors.surface};
  border-width: 1px;
  border-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : theme.colors.border};
  margin-bottom: 6px;
`;

export const StreamIconWrapper = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  overflow: hidden;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
`;

export const StreamIcon = styled(ExpoImage)`
  width: 100%;
  height: 100%;
`;

export const StreamName = styled.Text<{ isSelected: boolean }>`
  flex: 1;
  color: ${({ isSelected, theme }) => (isSelected ? theme.colors.text : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ isSelected }) => (isSelected ? 'bold' : 'normal')};
`;

export const CheckboxCircle = styled.View<{ isSelected: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border-width: 2px;
  border-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : theme.colors.border};
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : 'transparent'};
  align-items: center;
  justify-content: center;
  margin-left: 8px;
`;

export const EmptySearchText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
  padding: 24px;
  font-style: italic;
`;

export const ModalFooter = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  flex-direction: row;
  justify-content: flex-end;
  gap: 10px;
`;
