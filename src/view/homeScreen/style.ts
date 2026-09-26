import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const ScrollArea = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
}))``;

export const SubscriptionCard = styled.View`
  margin-horizontal: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const AccountWarningCard = styled.View`
  margin-horizontal: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  background-color: rgba(255, 179, 0, 0.12);
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.warning};
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const AccountWarningText = styled.Text`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
`;

export const ProfileAvatar = styled.View<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  margin-right: ${({ theme }) => theme.spacing.sm}px;
  background-color: ${({ color }) => color};
  align-items: center;
  justify-content: center;
`;

export const SubscriptionInfo = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  flex: 1;
`;

export const SubscriptionText = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

export const ExpirationBadge = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing.sm}px;
  padding-vertical: 3px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  border-radius: ${({ theme }) => theme.radii.sm}px;
`;

export const ExpirationBadgeText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
`;

export const QuickActionsRow = styled.View`
  margin-horizontal: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const QuickActionButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding-vertical: 10px;
  padding-horizontal: 4px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

export const QuickActionIconWrapper = styled.View`
  position: relative;
`;

// Selo de "não visto", como nos apps de mensagem
export const NotificationBadge = styled.View`
  position: absolute;
  top: -6px;
  right: -12px;
  min-width: 18px;
  height: 18px;
  padding-horizontal: 4px;
  border-radius: 9px;
  background-color: ${({ theme }) => theme.colors.primary};
  align-items: center;
  justify-content: center;
`;

export const NotificationBadgeText = styled.Text`
  color: #ffffff;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const QuickActionText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
  text-align: center;
`;



