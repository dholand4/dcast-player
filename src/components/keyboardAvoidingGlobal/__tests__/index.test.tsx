import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { KeyboardAvoidingGlobal } from '../index';

describe('KeyboardAvoidingGlobal', () => {
  it('renders its children', () => {
    const { getByText, getByTestId } = render(
      <ThemeProvider theme={theme}>
        <KeyboardAvoidingGlobal testID="kav">
          <Text>Campo</Text>
        </KeyboardAvoidingGlobal>
      </ThemeProvider>
    );

    expect(getByText('Campo')).toBeTruthy();
    expect(getByTestId('kav')).toBeTruthy();
  });
});
