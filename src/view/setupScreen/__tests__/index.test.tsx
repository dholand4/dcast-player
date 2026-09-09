import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { SetupScreen } from '../index';
import { SetupScreenProps } from '../../../routes/types';
import { useAuth } from '../../../hooks/useAuth';

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
} as unknown as SetupScreenProps['navigation'];

const mockRoute = {
  key: 'SetupScreen',
  name: 'SetupScreen',
} as unknown as SetupScreenProps['route'];

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SetupScreen', () => {
  const mockLoginWithM3u = jest.fn();
  const mockLoginWithCredentials = jest.fn();
  const mockRemoveSavedAccount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      loginWithM3u: mockLoginWithM3u,
      loginWithCredentials: mockLoginWithCredentials,
      savedAccounts: [
        {
          serverUrl: 'http://server1.com:8080',
          username: 'userA',
          password: 'passA',
          label: 'Lista Principal',
        },
        {
          serverUrl: 'http://server2.com:8080',
          username: 'userB',
          password: 'passB',
          label: 'Lista Secundaria',
        },
      ],
      removeSavedAccount: mockRemoveSavedAccount,
      isLoading: false,
      error: null,
    });
  });

  it('renders brand logo and title', () => {
    const { getByTestId, getByText } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('brand-logo')).toBeTruthy();
    expect(getByText('DCAST PLAYER')).toBeTruthy();
  });

  it('renders saved accounts when available', () => {
    const { getByText, getByTestId } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Suas Listas Conectadas')).toBeTruthy();
    expect(getByText('Lista Principal')).toBeTruthy();
    expect(getByText('Lista Secundaria')).toBeTruthy();
    expect(getByTestId('connect-saved-userA')).toBeTruthy();
    expect(getByTestId('connect-saved-userB')).toBeTruthy();
  });

  it('triggers quick login when tapping connect on a saved account', () => {
    const { getByTestId } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    const connectBtn = getByTestId('connect-saved-userA');
    fireEvent.press(connectBtn);

    expect(mockLoginWithCredentials).toHaveBeenCalledWith({
      serverUrl: 'http://server1.com:8080',
      username: 'userA',
      password: 'passA',
      label: 'Lista Principal',
    });
  });

  it('renders input card to add a new M3U list', () => {
    const { getByText, getByPlaceholderText } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Adicionar Lista IPTV')).toBeTruthy();
    expect(getByPlaceholderText('Ex: Lista Principal')).toBeTruthy();
    expect(
      getByPlaceholderText('http://servidor.com:8080/get.php?username=...')
    ).toBeTruthy();
  });
});
