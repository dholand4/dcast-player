import styled from 'styled-components/native';

export const Container = styled.ScrollView.attrs<{ insetTop?: number }>(({ theme, insetTop }) => ({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    paddingTop: (insetTop || 0) + theme.spacing.lg,
  },
}))<{ insetTop?: number }>`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const BrandContainer = styled.View`
  align-items: center;
  align-self: center;
  width: 100%;
  max-width: 480px;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

export const BrandLogo = styled.Image`
  width: 90px;
  height: 90px;
  border-radius: 20px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const BrandTitle = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.sizes.hero}px;
  font-weight: ${({ theme }) => theme.typography.weights.extraBold};
  letter-spacing: 1.5px;
`;

export const BrandSubtitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
  text-align: center;
`;

export const Card = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  width: 100%;
  max-width: 480px;
  align-self: center;
`;

export const CardTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const HelperText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: ${({ theme }) => theme.spacing.md}px;
  line-height: 18px;
  text-align: center;
`;

export const SavedAccountCard = styled.View`
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm + 2}px ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const SavedAccountInfo = styled.View`
  flex: 1;
  margin-right: ${({ theme }) => theme.spacing.sm}px;
`;

export const SavedAccountLabel = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const SavedAccountHost = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  margin-top: 2px;
`;

export const SavedAccountActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const SavedAccountConnectBtn = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.primary};
  padding-vertical: 7px;
  padding-horizontal: 14px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  align-items: center;
  justify-content: center;
`;

export const SavedAccountConnectText = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const SavedAccountDeleteBtn = styled.TouchableOpacity`
  padding: 6px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  align-items: center;
  justify-content: center;
  background-color: rgba(229, 9, 20, 0.1);
`;

export const OrDivider = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  width: 100%;
  max-width: 480px;
  align-self: center;
`;

export const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
`;

export const DividerText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
  margin-horizontal: ${({ theme }) => theme.spacing.sm}px;
  letter-spacing: 0.5px;
`;
