import styled from 'styled-components/native';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export const ModalOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.overlayDark};
  flex-direction: row;
`;

export const DrawerContainer = styled.TouchableOpacity<{ insetTop: number; insetBottom: number }>`
  width: ${DRAWER_WIDTH}px;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  border-right-width: 1px;
  border-right-color: ${({ theme }) => theme.colors.border};
  padding-top: ${({ insetTop }) => Math.max(insetTop, 16)}px;
  padding-bottom: ${({ insetBottom }) => Math.max(insetBottom, 16)}px;
  display: flex;
  flex-direction: column;
`;

export const DrawerHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-bottom: ${({ theme }) => theme.spacing.sm}px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
`;

export const DrawerTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const CloseButton = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
`;

export const DrawerSearchWrapper = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-top: ${({ theme }) => theme.spacing.sm}px;
  padding-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

export const CategoryItem = styled.TouchableOpacity<{ isSelected: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-vertical: ${({ theme }) => theme.spacing.md}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.surfaceLight : theme.colors.transparent};
  border-left-width: 4px;
  border-left-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary : theme.colors.transparent};
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
`;

export const CategoryItemContent = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
  margin-right: ${({ theme }) => theme.spacing.sm}px;
`;

export const CategoryItemText = styled.Text<{ isSelected: boolean }>`
  color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.white : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-weight: ${({ isSelected, theme }) =>
    isSelected ? theme.typography.weights.bold : theme.typography.weights.regular};
  margin-left: ${({ theme }) => theme.spacing.sm}px;
  flex-shrink: 1;
`;

export const EmptySearchText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

export const DrawerFooter = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.sm}px;
  margin: ${({ theme }) => theme.spacing.sm}px;
`;

export const DrawerFooterTitle = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const DrawerFooterSub = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: 2px;
`;

export const DrawerFooterExp = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.primaryLight};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  margin-top: 4px;
`;

