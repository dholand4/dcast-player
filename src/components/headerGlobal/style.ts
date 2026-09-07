import styled from 'styled-components/native';

export const Container = styled.View<{ insetTop: number }>`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-top: ${({ insetTop, theme }) => insetTop + theme.spacing.sm}px;
  padding-bottom: ${({ theme }) => theme.spacing.sm}px;
  background-color: ${({ theme }) => theme.colors.background};
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
`;

export const LeftSection = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

export const BackButton = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.spacing.xs}px;
  margin-right: ${({ theme }) => theme.spacing.sm}px;
  justify-content: center;
  align-items: center;
`;

export const BackIconText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xl}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const TitleContainer = styled.View`
  flex: 1;
`;

export const TitleText = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const SubtitleText = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
`;

export const ExtraInfoText = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: 2px;
`;

export const RightSection = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const SearchButton = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.spacing.xs}px;
  margin-right: ${({ theme }) => theme.spacing.xs}px;
  justify-content: center;
  align-items: center;
`;

export const SearchIconText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
`;
