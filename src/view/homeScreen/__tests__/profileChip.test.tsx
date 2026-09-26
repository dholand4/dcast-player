import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { HomeScreen } from '../index';
import { HomeScreenProps } from '../../../routes/types';

const mockSwitchProfile = jest.fn();

// Objetos estáveis, como no app: um objeto novo a cada render dispararia os efeitos sem parar
const mockAuth = {
  account: { serverUrl: 'http://test.com', username: 'daniel', password: 'p', label: 'Minha Lista' },
  userInfo: null,
  accountWarning: null,
};
const mockProfiles = {
  activeProfile: { id: 'default', name: 'Daniel', color: '#E50914', createdAt: 0, updatedAt: 0 },
  switchProfile: mockSwitchProfile,
};

jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => mockAuth }));
jest.mock('../../../hooks/useProfiles', () => ({ useProfiles: () => mockProfiles }));

const mockMarkAllSeen = jest.fn();
const mockInbox = {
  items: [
    {
      seriesId: 'ted',
      seriesTitle: 'Ted Lasso',
      posterUrl: '',
      episode: { id: 'e9', season: 4, episode: 9, title: 'Nove', added: 0 },
      newCount: 1,
      episodeIds: ['e9'],
      detectedAt: Date.now(),
    },
  ],
  unseenCount: 1,
  markAllSeen: mockMarkAllSeen,
  dismissItem: jest.fn(),
};
jest.mock('../../../hooks/useNewEpisodesInbox', () => ({ useNewEpisodesInbox: () => mockInbox }));

const navigation = { navigate: jest.fn(), replace: jest.fn(), goBack: jest.fn() } as unknown as HomeScreenProps['navigation'];
const route = { key: 'HomeScreen', name: 'HomeScreen' } as unknown as HomeScreenProps['route'];

describe('HomeScreen profile chip', () => {
  it('shows the profile in the header, the list only in the card, and exits the profile', () => {
    const { getByTestId, getByText, queryByText } = render(
      <NavigationContainer>
        <ThemeProvider theme={theme}>
          <HomeScreen navigation={navigation} route={route} />
        </ThemeProvider>
      </NavigationContainer>
    );

    expect(getByText('Daniel')).toBeTruthy();
    expect(getByText('Minha Lista • @daniel')).toBeTruthy();
    expect(queryByText('@daniel')).toBeNull();

    fireEvent.press(getByTestId('header-title-button'));
    expect(getByText('Sair do perfil')).toBeTruthy();
    fireEvent.press(getByText('Sair'));

    expect(mockSwitchProfile).toHaveBeenCalled();
  });

  it('shows the Novidades badge, marks it as seen when opened and goes to the series', () => {
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <ThemeProvider theme={theme}>
          <HomeScreen navigation={navigation} route={route} />
        </ThemeProvider>
      </NavigationContainer>
    );

    expect(getByTestId('new-episodes-badge')).toBeTruthy();
    fireEvent.press(getByTestId('new-episodes-button'));
    expect(mockMarkAllSeen).toHaveBeenCalled();

    fireEvent.press(getByText('Ted Lasso'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      'DetailsScreen',
      expect.objectContaining({ id: 'ted', type: 'series', title: 'Ted Lasso' })
    );
  });
});
