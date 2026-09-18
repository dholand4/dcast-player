import React from 'react';
import { IButtonGlobalProps } from './types';
import { useTVFocus } from '../../hooks/useTVFocus';
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
  const { isFocused, focusable, onFocus, onBlur } = useTVFocus();

  return (
    <ButtonContainer
      variant={variant}
      size={size}
      disabled={disabled || loading}
      isFocused={isFocused}
      focusable={focusable && !disabled && !loading}
      onFocus={onFocus}
      onBlur={onBlur}
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
