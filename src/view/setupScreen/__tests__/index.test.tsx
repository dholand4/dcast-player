import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { SetupScreen } from '../index';

import { SetupScreenProps } from '../../../routes/types';

const mockNavigation = {
  replace: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
} as unknown as SetupScreenProps['navigation'];

const mockRoute = {
  key: 'SetupScreen',
  name: 'SetupScreen',
} as unknown as SetupScreenProps['route'];

const wrap = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </NavigationContainer>
  );

describe('SetupScreen', () => {
  it('renders without crashing', () => {
    const { getByText, getByTestId } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('setup-screen')).toBeTruthy();
    expect(getByTestId('brand-logo')).toBeTruthy();
    expect(getByText('DCAST PLAYER')).toBeTruthy();
    expect(getByText('Adicionar Lista IPTV')).toBeTruthy();
    expect(getByText('Conectar e Assistir')).toBeTruthy();
  });
});
