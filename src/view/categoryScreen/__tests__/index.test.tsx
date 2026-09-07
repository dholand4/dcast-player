import React from 'react';
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
});

