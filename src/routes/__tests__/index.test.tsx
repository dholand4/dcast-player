import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../constants/theme';
import { Routes } from '../index';
import { useAuth } from '../../hooks/useAuth';
import { useProfiles } from '../../hooks/useProfiles';

jest.mock('../../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../../hooks/useProfiles', () => ({ useProfiles: jest.fn() }));

const account = { serverUrl: 'http://a.tv', username: 'daniel', password: 'p', label: 'Minha Lista' };
const profile = { id: 'default', name: 'Daniel', color: '#E50914', createdAt: 0, updatedAt: 0 };

function mockSession(options: { loggedIn: boolean; withProfile: boolean }) {
  (useAuth as jest.Mock).mockReturnValue({
    account: options.loggedIn ? account : null,
    isLoading: false,
    savedAccounts: [],
    accountWarning: null,
    loginWithM3u: jest.fn(),
    loginWithCredentials: jest.fn(),
    removeSavedAccount: jest.fn(),
    logout: jest.fn(),
  });
  (useProfiles as jest.Mock).mockReturnValue({
    profiles: [profile],
    activeProfile: options.withProfile ? profile : null,
    selectProfile: jest.fn(),
    switchProfile: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
  });
}

const renderRoutes = () =>
  render(
    <ThemeProvider theme={theme}>
      <Routes />
    </ThemeProvider>
  );

describe('Routes', () => {
  it('asks for a profile right after connecting a list', () => {
    mockSession({ loggedIn: true, withProfile: false });
    const { getByTestId } = renderRoutes();
    expect(getByTestId('profile-screen')).toBeTruthy();
  });

  it('goes back to the connection screen when leaving the list from inside the app', () => {
    mockSession({ loggedIn: true, withProfile: true });
    const view = renderRoutes();
    expect(view.getByTestId('home-screen')).toBeTruthy();

    mockSession({ loggedIn: false, withProfile: false });
    act(() => {
      view.rerender(
        <ThemeProvider theme={theme}>
          <Routes />
        </ThemeProvider>
      );
    });

    expect(view.getByTestId('setup-screen')).toBeTruthy();
    expect(view.queryByTestId('home-screen')).toBeNull();
  });
});
