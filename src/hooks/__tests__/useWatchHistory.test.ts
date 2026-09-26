import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWatchHistory } from '../useWatchHistory';
import { storageService } from '../../services/storageService';
import { supabaseService } from '../../services/supabaseService';
import { resetSessionSyncs } from '../../utils/sessionSync';
import { IWatchProgress } from '../../@types/storage';

jest.mock('../../services/storageService', () => ({
  storageService: {
    getAccount: jest.fn(() => null),
    getContinueWatching: jest.fn(() => []),
    getWatchProgress: jest.fn(() => null),
    getAllWatchProgress: jest.fn(() => []),
    saveWatchProgress: jest.fn(),
    hideFromContinueWatching: jest.fn(() => []),
    hideAllFromContinueWatching: jest.fn(() => []),
  },
}));

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getUserKey: jest.fn(() => 'guest'),
    fetchWatchProgressList: jest.fn(async () => []),
    upsertWatchProgressBatch: jest.fn(async () => {}),
  },
}));

describe('useWatchHistory hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionSyncs();
    (supabaseService.getUserKey as jest.Mock).mockReturnValue('guest');
  });

  const mockProgress: IWatchProgress = {
    id: 'movie-456',
    title: 'Inception',
    posterUrl: 'http://example.com/poster.jpg',
    type: 'movie',
    currentTime: 1200,
    duration: 7200,
    percentage: 16,
    updatedAt: 1600000000,
    streamUrl: 'http://server.com/movie/user/pass/456.mp4',
  };

  it('loads continue watching items on mount', () => {
    (storageService.getContinueWatching as jest.Mock).mockReturnValueOnce([mockProgress]);
    const { result } = renderHook(() => useWatchHistory());

    expect(result.current.continueWatching).toHaveLength(1);
    expect(result.current.continueWatching[0].title).toBe('Inception');
  });

  it('saves watch progress and reloads history', () => {
    const { result } = renderHook(() => useWatchHistory());

    act(() => {
      result.current.saveProgress(mockProgress);
    });

    expect(storageService.saveWatchProgress).toHaveBeenCalledWith(mockProgress);
  });

  it('retrieves single watch progress by id', () => {
    (storageService.getWatchProgress as jest.Mock).mockReturnValueOnce(mockProgress);
    const { result } = renderHook(() => useWatchHistory());

    const item = result.current.getProgress('movie-456');
    expect(item).toEqual(mockProgress);
  });

  it('retrieves all watch progress', () => {
    (storageService.getAllWatchProgress as jest.Mock).mockReturnValueOnce([mockProgress]);
    const { result } = renderHook(() => useWatchHistory());

    const all = result.current.getAllWatchProgress();
    expect(all).toEqual([mockProgress]);
  });

  it('hides an item from continue watching without deleting its progress', () => {
    const hidden = { ...mockProgress, hiddenFromContinue: true };
    (storageService.hideFromContinueWatching as jest.Mock).mockReturnValueOnce([hidden]);
    (supabaseService.getUserKey as jest.Mock).mockReturnValue('key');
    const { result } = renderHook(() => useWatchHistory());

    act(() => {
      result.current.hideFromContinueWatching('ep-1', 'series-9');
    });

    expect(storageService.hideFromContinueWatching).toHaveBeenCalledWith('ep-1', 'series-9');
    expect(supabaseService.upsertWatchProgressBatch).toHaveBeenCalledWith('key', [hidden]);
  });

  it('hides every item of a type from continue watching', () => {
    const { result } = renderHook(() => useWatchHistory());

    act(() => {
      result.current.hideAllFromContinueWatching('movie');
    });

    expect(storageService.hideAllFromContinueWatching).toHaveBeenCalledWith('movie');
  });

  it('syncs with the cloud once per session and uploads local-only items', async () => {
    const cloudItem = { ...mockProgress, id: 'cloud-1', hiddenFromContinue: true };
    const localOnly = { ...mockProgress, id: 'local-1' };
    (supabaseService.getUserKey as jest.Mock).mockReturnValue('key');
    (supabaseService.fetchWatchProgressList as jest.Mock).mockResolvedValueOnce([cloudItem]);
    (storageService.getAllWatchProgress as jest.Mock).mockReturnValue([localOnly]);

    renderHook(() => useWatchHistory());
    renderHook(() => useWatchHistory());

    await waitFor(() => {
      expect(supabaseService.upsertWatchProgressBatch).toHaveBeenCalledWith('key', [localOnly]);
    });
    expect(supabaseService.fetchWatchProgressList).toHaveBeenCalledTimes(1);
    expect(storageService.saveWatchProgress).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cloud-1', hiddenFromContinue: true })
    );

    (storageService.getAllWatchProgress as jest.Mock).mockReturnValue([]);
  });

  it('applies a cloud hide made on another device to the same local progress', async () => {
    const local = { ...mockProgress };
    const cloud = { ...mockProgress, hiddenFromContinue: true };
    (supabaseService.getUserKey as jest.Mock).mockReturnValue('key');
    (supabaseService.fetchWatchProgressList as jest.Mock).mockResolvedValueOnce([cloud]);
    (storageService.getWatchProgress as jest.Mock).mockReturnValueOnce(local);

    renderHook(() => useWatchHistory());

    await waitFor(() => {
      expect(storageService.saveWatchProgress).toHaveBeenCalledWith(
        expect.objectContaining({ id: local.id, hiddenFromContinue: true, streamUrl: local.streamUrl })
      );
    });
  });
});
