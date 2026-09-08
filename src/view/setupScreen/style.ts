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
