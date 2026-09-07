import styled, { DefaultTheme } from 'styled-components/native';
import { BadgeVariant } from './types';

interface IBadgeContainerProps {
  variant: BadgeVariant;
}

const getBadgeBg = (variant: BadgeVariant, theme: DefaultTheme): string => {
  switch (variant) {
    case 'rating':
      return theme.colors.warning;
    case 'hd':
      return theme.colors.surfaceLight;
    case 'accent':
      return theme.colors.primary;
    case 'default':
    default:
      return theme.colors.surfaceCard;
  }
};

const getBadgeColor = (variant: BadgeVariant, theme: DefaultTheme): string => {
  switch (variant) {
    case 'rating':
      return theme.colors.black;
    default:
      return theme.colors.text;
  }
};

export const BadgeContainer = styled.View<IBadgeContainerProps>`
  background-color: ${({ variant, theme }) => getBadgeBg(variant, theme)};
  padding-horizontal: ${({ theme }) => theme.spacing.xs}px;
  padding-vertical: 2px;
  border-radius: ${({ theme }) => theme.radii.xs}px;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
`;

export const BadgeText = styled.Text<IBadgeContainerProps>`
  color: ${({ variant, theme }) => getBadgeColor(variant, theme)};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  text-transform: uppercase;
`;
