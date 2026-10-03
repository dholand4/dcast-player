import styled from 'styled-components/native';
import { FocusableGlobal } from '../../components/focusableGlobal';

export const Screen = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const Container = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
}))`
  flex: 1;
`;

export const GearButton = styled(FocusableGlobal)<{ insetTop: number; isFocused?: boolean }>`
  position: absolute;
  top: ${({ insetTop, theme }) => insetTop + theme.spacing.sm}px;
  right: ${({ theme }) => theme.spacing.md}px;
  z-index: 1;
  padding: ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  background-color: ${({ isFocused }) =>
    isFocused ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'};
`;

export const Title = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  text-align: center;
`;

export const Subtitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

export const ProfileList = styled.View`
  width: 100%;
  max-width: 400px;
  margin-top: ${({ theme }) => theme.spacing.xl}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const ProfileRow = styled(FocusableGlobal)<{ isFocused?: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({ isFocused, theme }) => (isFocused ? '#FFFFFF' : theme.colors.border)};
`;

export const Avatar = styled.View<{ color: string; size?: number }>`
  width: ${({ size }) => size ?? 44}px;
  height: ${({ size }) => size ?? 44}px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: ${({ color }) => color};
  align-items: center;
  justify-content: center;
`;

export const AddAvatar = styled.View`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  border-width: 1px;
  border-style: dashed;
  border-color: ${({ theme }) => theme.colors.borderLight};
  align-items: center;
  justify-content: center;
`;

export const ProfileName = styled.Text.attrs({ numberOfLines: 1 })`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  margin-left: ${({ theme }) => theme.spacing.md}px;
`;

export const AddLabel = styled(ProfileName)`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const ListFooter = styled.View`
  width: 100%;
  max-width: 400px;
  margin-top: ${({ theme }) => theme.spacing.xl}px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const ListInfoText = styled.Text.attrs({ numberOfLines: 1 })`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
`;

export const SwitchListButtonWrapper = styled.View`
  width: 220px;
`;

export const ModalBackdrop = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.overlayDark};
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md}px;
`;

export const ModalCard = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: { padding: theme.spacing.lg },
}))`
  flex-grow: 0;
  width: 100%;
  max-width: 400px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

export const ModalHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const ModalTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const ColorRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const ColorSwatch = styled(FocusableGlobal)<{ color: string; isSelected: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${({ color }) => color};
  border-width: 3px;
  border-color: ${({ isSelected }) => (isSelected ? '#FFFFFF' : 'transparent')};
`;

export const ModalActions = styled.View`
  gap: ${({ theme }) => theme.spacing.sm}px;
`;
