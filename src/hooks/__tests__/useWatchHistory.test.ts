import { renderHook, act } from '@testing-library/react-native';
import { useWatchHistory } from '../useWatchHistory';
import { storageService } from '../../services/storageService';
import { IWatchProgress } from '../../@types/storage';

jest.mock('../../services/storageService', () => ({
  storageService: {
    getContinueWatching: jest.fn(() => []),
    getWatchProgress: jest.fn(() => null),
    getAllWatchProgress: jest.fn(() => []),
    saveWatchProgress: jest.fn(),
    removeWatchProgress: jest.fn(),
    clearWatchHistory: jest.fn(),
  },
}));

describe('useWatchHistory hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('clears watch history', () => {
    const { result } = renderHook(() => useWatchHistory());

    act(() => {
      result.current.clearHistory('movie');
    });

    expect(storageService.clearWatchHistory).toHaveBeenCalledWith('movie');
  });
});

