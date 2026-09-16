import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
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

  it('triggers quick login when tapping connect on a saved account', async () => {
    mockLoginWithCredentials.mockResolvedValue(true);
    const { getByTestId } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    const connectBtn = getByTestId('connect-saved-userA');
    await act(async () => {
      fireEvent.press(connectBtn);
    });

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

  it('renders tab selector with Link M3U and Xtream Codes API tabs', () => {
    const { getByTestId, getByText } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('setup-tab-selector')).toBeTruthy();
    expect(getByText('Link M3U')).toBeTruthy();
    expect(getByText('Xtream Codes API')).toBeTruthy();
  });

  it('connects successfully using M3U link tab', () => {
    mockLoginWithM3u.mockResolvedValue(true);

    const { getByPlaceholderText, getByTestId } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    const urlInput = getByPlaceholderText('http://servidor.com:8080/get.php?username=...');
    fireEvent.changeText(urlInput, 'http://server.com:8080/get.php?username=user1&password=pass1');

    const connectBtn = getByTestId('connect-m3u-button');
    fireEvent.press(connectBtn);

    expect(mockLoginWithM3u).toHaveBeenCalledWith(
      'http://server.com:8080/get.php?username=user1&password=pass1',
      'Minha Lista'
    );
  });

  it('switches to Xtream Codes tab and connects with credentials', () => {
    mockLoginWithCredentials.mockResolvedValue(true);

    const { getByTestId, getByPlaceholderText } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Switch to Xtream tab
    fireEvent.press(getByTestId('tab-xtream-btn'));

    const serverInput = getByPlaceholderText('http://dns.meuservidor.com:8080');
    const userInput = getByPlaceholderText('Seu usuário');
    const passInput = getByPlaceholderText('Sua senha');

    fireEvent.changeText(serverInput, 'http://myserver.com:8080');
    fireEvent.changeText(userInput, 'myuser');
    fireEvent.changeText(passInput, 'mypass');

    const connectBtn = getByTestId('connect-xtream-button');
    fireEvent.press(connectBtn);

    expect(mockLoginWithCredentials).toHaveBeenCalledWith({
      serverUrl: 'http://myserver.com:8080',
      username: 'myuser',
      password: 'mypass',
      label: 'Minha Lista',
    });
  });

  it('auto-detects full M3U URL pasted in Xtream server field and extracts user/pass', () => {
    const { getByTestId, getByPlaceholderText } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('tab-xtream-btn'));

    const serverInput = getByPlaceholderText('http://dns.meuservidor.com:8080');
    fireEvent.changeText(
      serverInput,
      'http://iptv.example.com:8000/get.php?username=autouser&password=autopass&type=m3u'
    );

    const userInput = getByPlaceholderText('Seu usuário');
    const passInput = getByPlaceholderText('Sua senha');

    expect(serverInput.props.value).toBe('http://iptv.example.com:8000');
    expect(userInput.props.value).toBe('autouser');
    expect(passInput.props.value).toBe('autopass');
  });

  it('toggles password visibility when clicking eye button', () => {
    const { getByTestId, getByPlaceholderText } = wrap(
      <SetupScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('tab-xtream-btn'));

    const passInput = getByPlaceholderText('Sua senha');
    expect(passInput.props.secureTextEntry).toBe(true);

    const toggleBtn = getByTestId('toggle-password-visibility');
    fireEvent.press(toggleBtn);

    expect(passInput.props.secureTextEntry).toBe(false);
  });
});
