import React from 'react';
import { IKeyboardAvoidingGlobalProps } from './types';
import { Container } from './style';

/**
 * Encolhe o conteúdo quando o teclado abre, para ele nunca cobrir os campos.
 * No Android o app é edge-to-edge (a janela não redimensiona sozinha), então
 * "padding" é usado nas duas plataformas.
 */
export const KeyboardAvoidingGlobal: React.FC<IKeyboardAvoidingGlobalProps> = ({
  children,
  style,
  testID,
}) => {
  return (
    <Container behavior="padding" style={style} testID={testID}>
      {children}
    </Container>
  );
};
