import styled from 'styled-components/native';

export const Container = styled.ScrollView.attrs<{ insetTop?: number }>(({ theme, insetTop }) => ({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: (insetTop || 0) + theme.spacing.lg,
  },
}))<{ insetTop?: number }>`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const Title = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xxl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

export const ProfilesGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg}px;
  max-width: 720px;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

export const ProfileTile = styled.TouchableOpacity<{ isFocused?: boolean }>`
  width: 110px;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 2px;
  border-color: ${({ isFocused }) => (isFocused ? '#FFFFFF' : 'transparent')};
`;

export const Avatar = styled.View<{ color: string }>`
  width: 96px;
  height: 96px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ color }) => color};
  align-items: center;
  justify-content: center;
`;

export const AddAvatar = styled.View`
  width: 96px;
  height: 96px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 2px;
  border-style: dashed;
  border-color: ${({ theme }) => theme.colors.borderLight};
  align-items: center;
  justify-content: center;
`;

export const AvatarInitial = styled.Text`
  color: #ffffff;
  font-size: 42px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const EditBadge = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: rgba(0, 0, 0, 0.55);
  align-items: center;
  justify-content: center;
`;

export const ProfileName = styled.Text.attrs({ numberOfLines: 1 })`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  margin-top: ${({ theme }) => theme.spacing.sm}px;
  text-align: center;
`;

export const ManageButtonWrapper = styled.View`
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
  max-width: 420px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

export const ModalTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const ColorRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

export const ColorSwatch = styled.TouchableOpacity<{ color: string; isSelected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ color }) => color};
  border-width: 3px;
  border-color: ${({ isSelected }) => (isSelected ? '#FFFFFF' : 'transparent')};
`;

export const ModalActions = styled.View`
  gap: ${({ theme }) => theme.spacing.sm}px;
`;
