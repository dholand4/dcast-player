import { renderHook, waitFor } from '@testing-library/react-native';
import * as Updates from 'expo-updates';
import { useAppUpdates } from '../useAppUpdates';

describe('useAppUpdates', () => {
  const originalDev = __DEV__;

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__DEV__ = originalDev;
    jest.clearAllMocks();
  });

  it('does nothing in __DEV__ mode', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__DEV__ = true;

    renderHook(() => useAppUpdates());

    expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it('checks for update when not in __DEV__ mode and does nothing if not available', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__DEV__ = false;
    (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValueOnce({
      isAvailable: false,
    });

    renderHook(() => useAppUpdates());

    await waitFor(() => {
      expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
    });

    expect(Updates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(Updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('fetches and reloads when an update is available', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__DEV__ = false;
    (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValueOnce({
      isAvailable: true,
    });
    (Updates.fetchUpdateAsync as jest.Mock).mockResolvedValueOnce(undefined);
    (Updates.reloadAsync as jest.Mock).mockResolvedValueOnce(undefined);

    renderHook(() => useAppUpdates());

    await waitFor(() => {
      expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
      expect(Updates.fetchUpdateAsync).toHaveBeenCalled();
      expect(Updates.reloadAsync).toHaveBeenCalled();
    });
  });

  it('catches and handles errors silently without crashing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__DEV__ = false;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (Updates.checkForUpdateAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    renderHook(() => useAppUpdates());

    await waitFor(() => {
      expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
