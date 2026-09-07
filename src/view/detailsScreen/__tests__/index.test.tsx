import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { DetailsScreen } from '../index';

import { DetailsScreenProps } from '../../../routes/types';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as unknown as DetailsScreenProps['navigation'];

const mockRoute = {
  key: 'DetailsScreen',
  name: 'DetailsScreen',
  params: {
    id: '123',
    type: 'movie',
    title: 'Matrix',
    posterUrl: 'http://example.com/matrix.jpg',
  },
} as unknown as DetailsScreenProps['route'];

const wrap = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </NavigationContainer>
  );

describe('DetailsScreen', () => {
  it('renders title and action buttons', () => {
    const { getByTestId, getByText } = wrap(
      <DetailsScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('details-screen')).toBeTruthy();
    expect(getByText('Matrix')).toBeTruthy();
    expect(getByText('Assistir')).toBeTruthy();
    expect(getByText('Favoritar')).toBeTruthy();
  });

  it('handles back button press', () => {
    const { getByTestId } = wrap(
      <DetailsScreen navigation={mockNavigation} route={mockRoute} />
    );

    const backBtn = getByTestId('details-back-button');
    expect(backBtn).toBeTruthy();
  });

  it('renders series with Começar a Assistir button', () => {
    const seriesRoute = {
      key: 'DetailsScreen',
      name: 'DetailsScreen',
      params: {
        id: '999',
        type: 'series',
        title: 'Breaking Bad',
        posterUrl: 'http://example.com/bb.jpg',
      },
    } as unknown as DetailsScreenProps['route'];

    const { getByText } = wrap(
      <DetailsScreen navigation={mockNavigation} route={seriesRoute} />
    );

    expect(getByText('Começar a Assistir')).toBeTruthy();
  });
});

