import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { CategoryScreen } from '../index';

import { CategoryScreenProps } from '../../../routes/types';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as unknown as CategoryScreenProps['navigation'];

const mockRoute = {
  key: 'CategoryScreen',
  name: 'CategoryScreen',
  params: {
    type: 'live',
    title: 'Canais Ao Vivo',
  },
} as unknown as CategoryScreenProps['route'];

const wrap = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </NavigationContainer>
  );

describe('CategoryScreen', () => {
  it('renders screen and category header with lists drawer button', () => {
    const { getByTestId, getByText } = wrap(
      <CategoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('category-screen')).toBeTruthy();
    expect(getByText('Canais Ao Vivo')).toBeTruthy();
    expect(getByTestId('open-category-drawer')).toBeTruthy();
    expect(getByText('Listas')).toBeTruthy();
    expect(getByTestId('active-category-row')).toBeTruthy();
  });

  it('opens category drawer when clicking lists button', () => {
    const { getByTestId, getByText } = wrap(
      <CategoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('open-category-drawer'));
    expect(getByText('Listas & Categorias')).toBeTruthy();
  });

  it('handles search input change and shows search query', () => {
    const { getByPlaceholderText } = wrap(
      <CategoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    const input = getByPlaceholderText('Buscar em Canais Ao Vivo...');
    expect(input).toBeTruthy();
    fireEvent.changeText(input, 'Globo');
  });

  it('renders sort pills and handles clicking on sort options', () => {
    const { getByTestId } = wrap(
      <CategoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('sort-bar-container')).toBeTruthy();
    expect(getByTestId('sort-pill-default')).toBeTruthy();
    expect(getByTestId('sort-pill-name-asc')).toBeTruthy();
    expect(getByTestId('sort-pill-name-desc')).toBeTruthy();
    expect(getByTestId('sort-pill-recent')).toBeTruthy();

    fireEvent.press(getByTestId('sort-pill-name-asc'));
    fireEvent.press(getByTestId('sort-pill-recent'));
  });

  it('renders rating sort pill for movies and series', () => {
    const movieRoute = {
      ...mockRoute,
      params: { type: 'movie', title: 'Filmes' },
    } as unknown as CategoryScreenProps['route'];

    const { getByTestId } = wrap(
      <CategoryScreen navigation={mockNavigation} route={movieRoute} />
    );

    expect(getByTestId('sort-pill-rating')).toBeTruthy();
    fireEvent.press(getByTestId('sort-pill-rating'));
  });

  it('renders web view without errors when Platform.OS is web', () => {
    const originalPlatform = Platform.OS;
    (Platform as any).OS = 'web';
    try {
      const movieRoute = {
        ...mockRoute,
        params: { type: 'movie', title: 'Filmes' },
      } as unknown as CategoryScreenProps['route'];

      const { getByTestId, getByText } = wrap(
        <CategoryScreen navigation={mockNavigation} route={movieRoute} />
      );

      expect(getByTestId('category-screen')).toBeTruthy();
      expect(getByText('Filmes')).toBeTruthy();
    } finally {
      (Platform as any).OS = originalPlatform;
    }
  });
});

