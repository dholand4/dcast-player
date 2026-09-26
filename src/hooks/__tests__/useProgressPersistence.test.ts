import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useProgressPersistence, PROGRESS_SAVE_INTERVAL_MS } from '../useProgressPersistence';

describe('useProgressPersistence', () => {
  let appStateListener: ((state: string) => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      appStateListener = listener as (state: string) => void;
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('saves periodically while playing, using the latest position', () => {
    const persist = jest.fn();
    let time = 30;
    renderHook(() =>
      useProgressPersistence({ isPlaying: true, getSnapshot: () => ({ time, duration: 3600 }), persist })
    );

    time = 50;
    act(() => {
      jest.advanceTimersByTime(PROGRESS_SAVE_INTERVAL_MS);
    });

    expect(persist).toHaveBeenCalledWith(50, 3600);
  });

  it('does not save periodically while paused', () => {
    const persist = jest.fn();
    renderHook(() =>
      useProgressPersistence({ isPlaying: false, getSnapshot: () => ({ time: 30, duration: 3600 }), persist })
    );

    act(() => {
      jest.advanceTimersByTime(PROGRESS_SAVE_INTERVAL_MS * 3);
    });

    expect(persist).not.toHaveBeenCalled();
  });

  it('saves when the app goes to background and on unmount only', () => {
    const persist = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ duration }) =>
        useProgressPersistence({ isPlaying: false, getSnapshot: () => ({ time: 90, duration }), persist }),
      { initialProps: { duration: 0 } }
    );

    // Mudança de duração não deve disparar salvamento (antes disparava)
    rerender({ duration: 3600 });
    expect(persist).not.toHaveBeenCalled();

    act(() => {
      appStateListener?.('background');
    });
    expect(persist).toHaveBeenCalledTimes(1);

    unmount();
    expect(persist).toHaveBeenCalledTimes(2);
    expect(persist).toHaveBeenLastCalledWith(90, 3600);
  });
});
