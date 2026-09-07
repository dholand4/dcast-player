import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { HeaderGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('HeaderGlobal', () => {
  it('renders title and subtitle', () => {
    const { getByText } = wrap(
      <HeaderGlobal title="Minha Lista" subtitle="Conectado" />
    );
    expect(getByText('Minha Lista')).toBeTruthy();
    expect(getByText('Conectado')).toBeTruthy();
  });

  it('handles back button press', () => {
    const onBackMock = jest.fn();
    const { getByTestId } = wrap(
      <HeaderGlobal title="Filmes" onBack={onBackMock} />
    );

    fireEvent.press(getByTestId('header-back-button'));
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('handles search button press', () => {
    const onSearchMock = jest.fn();
    const { getByTestId } = wrap(
      <HeaderGlobal title="Canais" onSearchPress={onSearchMock} />
    );

    fireEvent.press(getByTestId('header-search-button'));
    expect(onSearchMock).toHaveBeenCalledTimes(1);
  });
});
