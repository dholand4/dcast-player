import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { LoadingGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('LoadingGlobal', () => {
  it('renders spinner and optional message', () => {
    const { getByText, getByTestId } = wrap(
      <LoadingGlobal message="Carregando canais..." testID="loader" />
    );
    expect(getByTestId('loader')).toBeTruthy();
    expect(getByTestId('loading-spinner')).toBeTruthy();
    expect(getByText('Carregando canais...')).toBeTruthy();
  });
});
