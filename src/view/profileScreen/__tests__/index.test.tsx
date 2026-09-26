import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { ProfileScreen } from '../index';
import { useProfiles } from '../../../hooks/useProfiles';

const mockLogout = jest.fn();

jest.mock('../../../hooks/useProfiles', () => ({
  useProfiles: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    account: { serverUrl: 'http://a.tv', username: 'daniel', password: 'p', label: 'Minha Lista' },
    logout: mockLogout,
  }),
}));

const wrap = (ui: React.ReactElement) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ProfileScreen', () => {
  const selectProfile = jest.fn();
  const createProfile = jest.fn();
  const updateProfile = jest.fn();
  const deleteProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProfiles as jest.Mock).mockReturnValue({
      profiles: [
        { id: 'default', name: 'Principal', color: '#E50914', createdAt: 0, updatedAt: 0 },
        { id: 'kids', name: 'Kids', color: '#29B6F6', createdAt: 1, updatedAt: 1 },
      ],
      selectProfile,
      createProfile,
      updateProfile,
      deleteProfile,
    });
  });

  it('asks who is watching and enters the chosen profile', () => {
    const { getByText, getByTestId } = wrap(<ProfileScreen />);

    expect(getByText('Quem está assistindo?')).toBeTruthy();
    fireEvent.press(getByTestId('profile-tile-kids'));

    expect(selectProfile).toHaveBeenCalledWith('kids');
  });

  it('only shows "add profile" after opening the gear menu', () => {
    const { getByTestId, queryByTestId } = wrap(<ProfileScreen />);

    expect(queryByTestId('profile-add')).toBeNull();
    fireEvent.press(getByTestId('profile-manage-toggle'));
    expect(getByTestId('profile-add')).toBeTruthy();
  });

  it('hides "add profile" when the account already has 4 profiles', () => {
    (useProfiles as jest.Mock).mockReturnValue({
      profiles: ['a', 'b', 'c', 'd'].map((id, i) => ({
        id,
        name: id,
        color: '#E50914',
        createdAt: i,
        updatedAt: i,
      })),
      selectProfile,
      createProfile,
      updateProfile,
      deleteProfile,
    });
    const { getByTestId, queryByTestId } = wrap(<ProfileScreen />);

    fireEvent.press(getByTestId('profile-manage-toggle'));
    expect(queryByTestId('profile-add')).toBeNull();
  });

  it('creates a new profile', () => {
    const { getByTestId } = wrap(<ProfileScreen />);

    fireEvent.press(getByTestId('profile-manage-toggle'));
    fireEvent.press(getByTestId('profile-add'));
    fireEvent.changeText(getByTestId('profile-name-input').findByType(require('react-native').TextInput), 'Maria');
    fireEvent.press(getByTestId('profile-color-#46D369'));
    fireEvent.press(getByTestId('profile-save'));

    expect(createProfile).toHaveBeenCalledWith('Maria', '#46D369');
  });

  it('edits in manage mode and only allows deleting non-default profiles', () => {
    const { getByTestId, queryByTestId, getByText } = wrap(<ProfileScreen />);

    fireEvent.press(getByTestId('profile-manage-toggle'));
    expect(getByText('Gerenciar perfis')).toBeTruthy();

    fireEvent.press(getByTestId('profile-tile-default'));
    expect(queryByTestId('profile-delete')).toBeNull();
    fireEvent.press(getByText('Cancelar'));

    fireEvent.press(getByTestId('profile-tile-kids'));
    fireEvent.press(getByTestId('profile-delete'));
    fireEvent.press(getByText('Excluir'));

    expect(selectProfile).not.toHaveBeenCalled();
    expect(deleteProfile).toHaveBeenCalledWith('kids');
  });

  it('switches IPTV list from the profile screen after confirming', () => {
    const { getByTestId, getByText } = wrap(<ProfileScreen />);

    expect(getByText('Minha Lista • @daniel')).toBeTruthy();
    fireEvent.press(getByTestId('profile-switch-list'));
    fireEvent.press(getByText('Trocar'));

    expect(mockLogout).toHaveBeenCalled();
  });
});
