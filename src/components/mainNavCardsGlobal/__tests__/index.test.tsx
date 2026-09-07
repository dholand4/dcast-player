import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { MainNavCardsGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('MainNavCardsGlobal', () => {
  it('renders all 3 main categories and triggers callbacks', () => {
    const onLiveMock = jest.fn();
    const onMoviesMock = jest.fn();
    const onSeriesMock = jest.fn();

    const { getByText } = wrap(
      <MainNavCardsGlobal
        onSelectLive={onLiveMock}
        onSelectMovies={onMoviesMock}
        onSelectSeries={onSeriesMock}
      />
    );

    expect(getByText('Canais Ao Vivo')).toBeTruthy();
    expect(getByText('Filmes (VOD)')).toBeTruthy();
    expect(getByText('Séries')).toBeTruthy();

    fireEvent.press(getByText('Canais Ao Vivo'));
    expect(onLiveMock).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Filmes (VOD)'));
    expect(onMoviesMock).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Séries'));
    expect(onSeriesMock).toHaveBeenCalledTimes(1);
  });
});
