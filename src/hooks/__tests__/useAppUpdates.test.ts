import { renderHook, waitFor } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';
import { useAppUpdates } from '../useAppUpdates';
import { navigationRef } from '../../routes/navigationRef';

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

    const { result } = renderHook(() => useAppUpdates());

    await waitFor(() => {
      expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
      expect(Updates.fetchUpdateAsync).toHaveBeenCalled();
      expect(Updates.reloadAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          reloadScreenOptions: expect.objectContaining({ backgroundColor: '#121212' }),
        })
      );
    });
    expect(result.current).toBe('restarting');
  });

  it('reports downloading status while the update is being fetched', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__DEV__ = false;
    (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValueOnce({
      isAvailable: true,
    });
    (Updates.fetchUpdateAsync as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useAppUpdates());

    expect(result.current).toBe('idle');
    await waitFor(() => {
      expect(result.current).toBe('downloading');
    });
    expect(Updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('returns to idle when the download fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__DEV__ = false;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValueOnce({
      isAvailable: true,
    });
    (Updates.fetchUpdateAsync as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAppUpdates());

    await waitFor(() => {
      expect(Updates.fetchUpdateAsync).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });
    expect(result.current).toBe('idle');
    expect(Updates.reloadAsync).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
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

  describe('when the app returns to the foreground', () => {
    let emitAppState: (state: AppStateStatus) => void;
    const remove = jest.fn();

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).__DEV__ = false;
      jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
        emitAppState = listener as (state: AppStateStatus) => void;
        return { remove };
      });
      (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValue({ isAvailable: false });
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it('checks again once enough time has passed', async () => {
      jest.useFakeTimers({ now: 0 });
      renderHook(() => useAppUpdates());
      await waitFor(() => expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1));

      jest.setSystemTime(30 * 1000);
      emitAppState('active');
      expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);

      jest.setSystemTime(2 * 60 * 1000);
      emitAppState('active');
      await waitFor(() => expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(2));
    });

    it('does not check while the player is open', async () => {
      jest.useFakeTimers({ now: 0 });
      jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
      jest
        .spyOn(navigationRef, 'getCurrentRoute')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue({ key: 'player', name: 'PlayerScreen' } as any);

      renderHook(() => useAppUpdates());
      await waitFor(() => expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1));

      jest.setSystemTime(2 * 60 * 1000);
      emitAppState('active');
      expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
    });

    it('removes the listener on unmount', () => {
      const { unmount } = renderHook(() => useAppUpdates());
      unmount();
      expect(remove).toHaveBeenCalled();
    });
  });
});
