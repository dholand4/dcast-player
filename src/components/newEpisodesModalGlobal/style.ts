import styled from 'styled-components/native';
import { FocusableGlobal } from '../focusableGlobal';
import { Image as ExpoImage } from 'expo-image';

export const ModalOverlay = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.overlayDark};
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md}px;
`;

export const ModalCard = styled.View`
  width: 100%;
  max-width: 520px;
  max-height: 85%;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

export const ModalHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const TitleContainer = styled.View`
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

export const CloseButton = styled(FocusableGlobal)`
  padding: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
`;

export const List = styled.ScrollView`
  flex-grow: 0;
`;

export const ItemRow = styled(FocusableGlobal)`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

export const Poster = styled(ExpoImage)`
  width: 44px;
  height: 66px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
`;

export const ItemInfo = styled.View`
  flex: 1;
  margin-horizontal: ${({ theme }) => theme.spacing.md}px;
`;

export const ItemTitle = styled.Text.attrs({ numberOfLines: 1 })`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const ItemSubtitle = styled.Text.attrs({ numberOfLines: 2 })`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: 4px;
`;

export const DismissButton = styled(FocusableGlobal)`
  padding: ${({ theme }) => theme.spacing.xs}px;
`;

export const EmptyContainer = styled.View`
  align-items: center;
  padding-vertical: ${({ theme }) => theme.spacing.xl}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const EmptyText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
`;

export const FooterText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.sm}px;
`;
