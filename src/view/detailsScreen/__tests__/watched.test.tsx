import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { DetailsScreen } from '../index';
import { DetailsScreenProps } from '../../../routes/types';
import { IWatchProgress } from '../../../@types/storage';

const mockMarkAsWatched = jest.fn();
const mockMarkAsUnwatched = jest.fn();
let mockProgress: Record<string, IWatchProgress> = {};

const mockAuth = {
  account: { serverUrl: 'http://test.com', username: 'user', password: 'pass', label: 'Test' },
};

jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => mockAuth }));

jest.mock('../../../hooks/useXtream', () => ({
  useXtream: () => ({
    isLoading: false,
    fetchSeriesInfo: jest.fn(),
    seriesInfo: {
      info: { name: 'Dark' },
      episodes: {
        '1': [
          { id: 'e1', episode_num: 1, title: 'Segredos', info: { duration_secs: 3000 } },
          { id: 'e2', episode_num: 2, title: 'Mentiras', info: { duration_secs: 3000 } },
        ],
      },
    },
  }),
}));

jest.mock('../../../hooks/useWatchHistory', () => ({
  useWatchHistory: () => ({
    continueWatching: [],
    getProgress: (id: string) => mockProgress[id] ?? null,
    getAllWatchProgress: () => Object.values(mockProgress).sort((a, b) => b.updatedAt - a.updatedAt),
    saveProgress: jest.fn(),
    markAsWatched: mockMarkAsWatched,
    markAsUnwatched: mockMarkAsUnwatched,
  }),
}));

const navigation = { navigate: jest.fn(), goBack: jest.fn() } as unknown as DetailsScreenProps['navigation'];
const route = {
  key: 'DetailsScreen',
  name: 'DetailsScreen',
  params: { id: 's1', type: 'series', title: 'Dark', posterUrl: 'http://x/p.jpg' },
} as unknown as DetailsScreenProps['route'];

const wrap = () =>
  render(
    <NavigationContainer>
      <ThemeProvider theme={theme}>
        <DetailsScreen navigation={navigation} route={route} />
      </ThemeProvider>
    </NavigationContainer>
  );

const finished = (id: string, episode: number): IWatchProgress => ({
  id,
  seriesId: 's1',
  title: 'Dark',
  posterUrl: '',
  type: 'series',
  seasonNumber: 1,
  episodeNumber: episode,
  currentTime: 3000,
  duration: 3000,
  percentage: 100,
  updatedAt: 1000 + episode,
});

describe('DetailsScreen watched marks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProgress = {};
  });

  it('marks a single episode as watched', () => {
    const { getByTestId } = wrap();
    fireEvent.press(getByTestId('episode-watched-toggle-e1'));

    expect(mockMarkAsWatched).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'e1', seriesId: 's1', seasonNumber: 1, episodeNumber: 1, duration: 3000 }),
    ]);
  });

  it('unmarks a finished episode', () => {
    mockProgress = { e1: finished('e1', 1) };
    const { getByTestId } = wrap();
    fireEvent.press(getByTestId('episode-watched-toggle-e1'));

    expect(mockMarkAsUnwatched).toHaveBeenCalledWith([expect.objectContaining({ id: 'e1' })]);
  });

  it('marks the whole season in episode order', () => {
    const { getByTestId } = wrap();
    fireEvent.press(getByTestId('season-watched-toggle'));

    expect(mockMarkAsWatched).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'e1' }),
      expect.objectContaining({ id: 'e2' }),
    ]);
  });

  it('offers the next episode when the last watched one is finished', () => {
    mockProgress = { e1: finished('e1', 1) };
    const { getByText } = wrap();

    expect(getByText('Assistir T1E2')).toBeTruthy();
  });
});
