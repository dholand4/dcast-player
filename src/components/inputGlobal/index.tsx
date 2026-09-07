import React, { useState } from 'react';
import { IInputGlobalProps } from './types';
import {
  Container,
  Label,
  InputWrapper,
  StyledTextInput,
  ActionButton,
  ActionText,
  ErrorText,
} from './style';

export const InputGlobal: React.FC<IInputGlobalProps> = ({
  label,
  error,
  onPaste,
  onClear,
  value,
  onFocus,
  onBlur,
  noMargin,
  testID,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Container testID={testID} noMargin={noMargin}>
      {label && <Label>{label}</Label>}
      <InputWrapper hasError={Boolean(error)} isFocused={isFocused}>
        <StyledTextInput
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {onPaste && !value && (
          <ActionButton onPress={onPaste} accessibilityRole="button" accessibilityLabel="Colar">
            <ActionText>Colar</ActionText>
          </ActionButton>
        )}
        {onClear && Boolean(value) && (
          <ActionButton onPress={onClear} accessibilityRole="button" accessibilityLabel="Limpar">
            <ActionText>Limpar</ActionText>
          </ActionButton>
        )}
      </InputWrapper>
      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  );
};
