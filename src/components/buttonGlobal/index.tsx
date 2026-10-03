import React from 'react';
import { IButtonGlobalProps } from './types';
import {
  ButtonContainer,
  ButtonLabel,
  IconContainer,
  LoadingIndicator,
} from './style';

export const ButtonGlobal: React.FC<IButtonGlobalProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  testID,
}) => {
  return (
    <ButtonContainer
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <LoadingIndicator />
      ) : (
        <>
          {icon && <IconContainer>{icon}</IconContainer>}
          <ButtonLabel variant={variant} size={size}>
            {label}
          </ButtonLabel>
        </>
      )}
    </ButtonContainer>
  );
};
