import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { SearchScreen } from '../index';
import { SearchScreenProps } from '../../../routes/types';
import { xtreamService } from '../../../services/xtreamService';
import { storageService } from '../../../services/storageService';

jest.mock('../../../services/xtreamService', () => ({
  xtreamService: {
    getLiveStreams: jest.fn().mockResolvedValue([
      { stream_id: 1, name: 'Globo SP HD', stream_icon: 'http://icon.png' },
    ]),
    getVodStreams: jest.fn().mockResolvedValue([
      { stream_id: 10, name: 'Vingadores Ultimato', stream_icon: 'http://icon.png', rating: '8.4' },
    ]),
    getSeries: jest.fn().mockResolvedValue([
      { series_id: 100, name: 'Breaking Bad', cover: 'http://icon.png', rating: '9.5' },
    ]),
    buildLiveStreamUrl: jest.fn().mockReturnValue('http://stream.m3u8'),
  },
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    account: {
      serverUrl: 'http://test.com',
      username: 'user',
      password: 'pass',
      label: 'Lista Teste',
    },
  }),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as unknown as SearchScreenProps['navigation'];

const mockRoute = {
  key: 'SearchScreen',
  name: 'SearchScreen',
} as unknown as SearchScreenProps['route'];

const wrap = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </NavigationContainer>
  );

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input and initial empty state', async () => {
    const { getByTestId, getByText } = wrap(
      <SearchScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('global-search-input')).toBeTruthy();
    await waitFor(() => {
      expect(getByTestId('search-initial-empty')).toBeTruthy();
      expect(getByText('O que você quer assistir?')).toBeTruthy();
    });
  });

  it('handles back button press', () => {
    const { getByTestId } = wrap(
      <SearchScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('search-back-button'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('filters results when query is entered and navigates on item press', async () => {
    const { getByTestId, getByText } = wrap(
      <SearchScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId('global-search-input'), 'Vingadores');

    await waitFor(() => {
      expect(getByText('Vingadores Ultimato')).toBeTruthy();
    });

    fireEvent.press(getByTestId('search-result-10'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('DetailsScreen', expect.objectContaining({
      id: '10',
      type: 'movie',
      title: 'Vingadores Ultimato',
    }));
  });

  it('switches tabs to filter by type', async () => {
    const { getByTestId, getByText, queryByText } = wrap(
      <SearchScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId('global-search-input'), 'a');

    await waitFor(() => {
      expect(getByTestId('tab-series')).toBeTruthy();
    });

    // Switch to Series tab
    fireEvent.press(getByTestId('tab-series'));
    await waitFor(() => {
      expect(getByText('Breaking Bad')).toBeTruthy();
      expect(queryByText('Globo SP HD')).toBeNull();
    });
  });
});
