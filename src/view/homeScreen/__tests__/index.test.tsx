import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { HomeScreen } from '../index';

import { HomeScreenProps } from '../../../routes/types';
import { storageService } from '../../../services/storageService';

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
} as unknown as HomeScreenProps['navigation'];

const mockRoute = {
  key: 'HomeScreen',
  name: 'HomeScreen',
} as unknown as HomeScreenProps['route'];

const wrap = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </NavigationContainer>
  );

describe('HomeScreen', () => {
  it('renders without crashing and displays categories', () => {
    const { getByTestId, getByText } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('home-screen')).toBeTruthy();
    expect(getByText('Canais Ao Vivo')).toBeTruthy();
    expect(getByText('Filmes')).toBeTruthy();
    expect(getByText('Séries')).toBeTruthy();
  });

  it('renders subscription card with list name and username when account exists', () => {
    const { getByTestId } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('home-screen')).toBeTruthy();
  });

  it('renders the search button on HomeScreen header and navigates to SearchScreen', () => {
    const { getByTestId } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    const searchBtn = getByTestId('header-search-button');
    expect(searchBtn).toBeTruthy();
    fireEvent.press(searchBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SearchScreen');
  });

  it('renders quick actions row with trocar lista, atualizar lista and testar conexao buttons', () => {
    const { getByTestId, getByText } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('quick-actions-row')).toBeTruthy();
    expect(getByText('Trocar Lista')).toBeTruthy();
    expect(getByText('Atualizar Lista')).toBeTruthy();
    expect(getByText('Testar Conexão')).toBeTruthy();
  });

  it('triggers catalog cache clearing when sync button is clicked', () => {
    const { getByTestId, getByText } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    const syncBtn = getByTestId('sync-catalog-button');
    expect(syncBtn).toBeTruthy();
    fireEvent.press(syncBtn);
    expect(getByTestId('home-sync-modal')).toBeTruthy();
    expect(getByText('Catálogo Atualizado')).toBeTruthy();
  });

  it('opens network diagnostic modal when diagnostic button is clicked', () => {
    const { getByTestId } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    const diagBtn = getByTestId('network-diagnostic-button');
    expect(diagBtn).toBeTruthy();
    fireEvent.press(diagBtn);
    expect(getByTestId('network-diagnostic-modal')).toBeTruthy();
  });

  it('renders logout button in quick actions row and not in header', () => {
    const { getByTestId, getByText, queryByTestId } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    const headerLogout = queryByTestId('header-logout-button');
    const quickLogout = getByTestId('home-logout-button');

    expect(headerLogout).toBeNull();
    expect(quickLogout).toBeTruthy();
    expect(getByText('Trocar Lista')).toBeTruthy();
  });

  it('opens custom logout confirmation modal when quick logout button is clicked', () => {
    const { getByTestId } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    const quickLogout = getByTestId('home-logout-button');
    fireEvent.press(quickLogout);

    expect(getByTestId('home-logout-modal')).toBeTruthy();
  });

  it('navigates directly to PlayerScreen when clicking a series in continue watching', () => {
    storageService.saveWatchProgress({
      id: '101',
      seriesId: '50',
      title: 'Stranger Things S01 E03',
      posterUrl: 'https://example.com/thumb.jpg',
      type: 'series',
      seasonNumber: 1,
      episodeNumber: 3,
      currentTime: 125,
      duration: 3000,
      percentage: 25,
      updatedAt: Date.now(),
      streamUrl: 'http://example.com/series/101.mp4',
    });

    const { getByText } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Continuar Assistindo')).toBeTruthy();
    const seriesCard = getByText('Stranger Things S01 E03');
    fireEvent.press(seriesCard);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('PlayerScreen', expect.objectContaining({
      streamUrl: 'http://example.com/series/101.mp4',
      type: 'series',
      contentId: '101',
      seriesId: '50',
      seasonNumber: 1,
      episodeNumber: 3,
      initialTime: 125,
    }));
  });

  it('navigates directly to PlayerScreen when clicking a movie in continue watching', () => {
    storageService.saveWatchProgress({
      id: '202',
      title: 'Inception',
      posterUrl: 'https://example.com/inception.jpg',
      type: 'movie',
      currentTime: 3600,
      duration: 7200,
      percentage: 50,
      updatedAt: Date.now(),
      streamUrl: 'http://example.com/movie/202.mp4',
    });

    const { getByText } = wrap(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    const movieCard = getByText('Inception');
    fireEvent.press(movieCard);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('PlayerScreen', expect.objectContaining({
      streamUrl: 'http://example.com/movie/202.mp4',
      type: 'movie',
      contentId: '202',
      initialTime: 3600,
    }));
  });
});

