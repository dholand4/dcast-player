import styled, { DefaultTheme } from 'styled-components/native';
import { ButtonVariant, ButtonSize } from './types';

interface IContainerProps {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
}

interface ILabelProps {
  variant: ButtonVariant;
  size: ButtonSize;
}

const getBackgroundColor = (variant: ButtonVariant, theme: DefaultTheme, disabled?: boolean): string => {
  if (disabled) return theme.colors.surfaceLight;
  switch (variant) {
    case 'primary':
      return theme.colors.primary;
    case 'secondary':
      return theme.colors.surfaceLight;
    case 'danger':
      return theme.colors.error;
    case 'ghost':
      return theme.colors.transparent;
    default:
      return theme.colors.primary;
  }
};

const getTextColor = (variant: ButtonVariant, theme: DefaultTheme): string => {
  switch (variant) {
    case 'ghost':
      return theme.colors.primary;
    default:
      return theme.colors.text;
  }
};

const getPadding = (size: ButtonSize, theme: DefaultTheme): { v: number; h: number } => {
  switch (size) {
    case 'sm':
      return { v: theme.spacing.xs, h: theme.spacing.sm };
    case 'lg':
      return { v: theme.spacing.md, h: theme.spacing.xl };
    case 'md':
    default:
      return { v: theme.spacing.sm, h: theme.spacing.md };
  }
};

export const ButtonContainer = styled.TouchableOpacity<IContainerProps>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 48px;
  background-color: ${({ variant, theme, disabled }) => getBackgroundColor(variant, theme, disabled)};
  padding-horizontal: ${({ size, theme }) => getPadding(size, theme).h}px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  border-width: ${({ variant }) => (variant === 'ghost' ? 1 : 0)}px;
  border-color: ${({ variant, theme }) => (variant === 'ghost' ? theme.colors.border : theme.colors.transparent)};
`;

export const ButtonLabel = styled.Text.attrs({
  numberOfLines: 1,
})<ILabelProps>`
  color: ${({ variant, theme }) => getTextColor(variant, theme)};
  font-size: ${({ size, theme }) =>
    size === 'sm'
      ? theme.typography.sizes.sm
      : size === 'lg'
        ? theme.typography.sizes.md
        : theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
  text-align: center;
`;

export const IconContainer = styled.View`
  margin-right: ${({ theme }) => theme.spacing.xs}px;
`;

export const LoadingIndicator = styled.ActivityIndicator.attrs(({ theme }) => ({
  color: theme.colors.text,
}))``;
