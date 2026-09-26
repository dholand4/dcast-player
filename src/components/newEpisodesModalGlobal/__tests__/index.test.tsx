import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { NewEpisodesModalGlobal } from '../index';
import { INewEpisodeItem } from '../../../hooks/useNewEpisodes';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const ted: INewEpisodeItem = {
  seriesId: 'ted',
  seriesTitle: 'Ted Lasso',
  posterUrl: 'http://capa.jpg',
  episode: { id: 'e9', season: 4, episode: 9, title: 'Nove', added: 0 },
  newCount: 2,
  episodeIds: ['e9', 'e10'],
  detectedAt: Date.now(),
};

describe('NewEpisodesModalGlobal', () => {
  it('lists series with new episodes and handles select and dismiss', () => {
    const onSelect = jest.fn();
    const onDismiss = jest.fn();
    const { getByText, getByTestId } = wrap(
      <NewEpisodesModalGlobal visible items={[ted]} onClose={jest.fn()} onSelect={onSelect} onDismiss={onDismiss} />
    );

    expect(getByText('Ted Lasso')).toBeTruthy();
    expect(getByText('T4E9 · 2 episódios novos · chegou hoje')).toBeTruthy();

    fireEvent.press(getByTestId('new-episode-ted'));
    expect(onSelect).toHaveBeenCalledWith(ted);

    fireEvent.press(getByTestId('new-episode-dismiss-ted'));
    expect(onDismiss).toHaveBeenCalledWith(ted);
  });

  it('shows an empty state', () => {
    const { getByTestId } = wrap(
      <NewEpisodesModalGlobal visible items={[]} onClose={jest.fn()} onSelect={jest.fn()} onDismiss={jest.fn()} />
    );
    expect(getByTestId('new-episodes-empty')).toBeTruthy();
  });
});
