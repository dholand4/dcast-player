import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { storageService } from '../../services/storageService';
import { xtreamService } from '../../services/xtreamService';

jest.mock('../../services/storageService', () => ({
  storageService: {
    getAccount: jest.fn(() => null),
    saveAccount: jest.fn(),
    getSavedAccounts: jest.fn(() => []),
    saveAccountToSavedList: jest.fn(),
    removeSavedAccount: jest.fn(),
    getUserInfo: jest.fn(() => null),
    saveUserInfo: jest.fn(),
    clearAccount: jest.fn(),
  },
}));

jest.mock('../../services/xtreamService', () => ({
  xtreamService: {
    authenticate: jest.fn(),
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with null account when storage is empty', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.account).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('fails with invalid M3U URL', async () => {
    const { result } = renderHook(() => useAuth());

    let success = false;
    await act(async () => {
      success = await result.current.loginWithM3u('invalid-url');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('successfully logs in with valid M3U URL', async () => {
    (xtreamService.authenticate as jest.Mock).mockResolvedValueOnce({
      user_info: { auth: 1, status: 'Active' },
      server_info: {},
    });

    const { result } = renderHook(() => useAuth());

    let success = false;
    await act(async () => {
      success = await result.current.loginWithM3u(
        'http://server.com:8080/get.php?username=user123&password=pass123&type=m3u_plus',
        'Lista Teste'
      );
    });

    expect(success).toBe(true);
    expect(storageService.saveAccount).toHaveBeenCalledWith({
      serverUrl: 'http://server.com:8080',
      username: 'user123',
      password: 'pass123',
      label: 'Lista Teste',
    });
    expect(result.current.account?.username).toBe('user123');
  });

  it('clears account on logout', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(storageService.clearAccount).toHaveBeenCalled();
    expect(result.current.account).toBeNull();
  });
});
