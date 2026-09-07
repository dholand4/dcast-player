import { renderHook, act } from '@testing-library/react-native';
import { useXtream, clearXtreamCache } from '../useXtream';
import { xtreamService } from '../../services/xtreamService';
import { IAccountCredentials } from '../../@types/xtream';

jest.mock('../../services/xtreamService', () => ({
  xtreamService: {
    getLiveCategories: jest.fn(),
    getVodCategories: jest.fn(),
    getSeriesCategories: jest.fn(),
    getLiveStreams: jest.fn(),
    getVodStreams: jest.fn(),
    getSeries: jest.fn(),
    getSeriesInfo: jest.fn(),
  },
}));

const mockAccount: IAccountCredentials = {
  serverUrl: 'http://xtream.test',
  username: 'testuser',
  password: 'testpassword',
  label: 'Test Account',
};

describe('useXtream hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearXtreamCache();
  });

  it('returns empty array if no account is provided', async () => {
    const { result } = renderHook(() => useXtream(null));

    let categories: unknown;
    await act(async () => {
      categories = await result.current.fetchCategories('live');
    });

    expect(categories).toEqual([]);
    expect(xtreamService.getLiveCategories).not.toHaveBeenCalled();
  });

  it('fetches categories and caches them in memory', async () => {
    const mockCategories = [
      { category_id: '1', category_name: 'Esportes', parent_id: 0 },
      { category_id: '2', category_name: 'Filmes', parent_id: 0 },
    ];

    (xtreamService.getLiveCategories as jest.Mock).mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useXtream(mockAccount));

    await act(async () => {
      await result.current.fetchCategories('live');
    });

    expect(result.current.categories).toEqual(mockCategories);
    expect(xtreamService.getLiveCategories).toHaveBeenCalledTimes(1);

    // Second call should return from memory cache immediately without calling service again
    await act(async () => {
      await result.current.fetchCategories('live');
    });

    expect(xtreamService.getLiveCategories).toHaveBeenCalledTimes(1);
  });

  it('fetches streams and filters from memory cache on category switch', async () => {
    const mockLiveStreams = [
      {
        num: 1,
        name: 'ESPN Brasil',
        stream_id: 101,
        stream_icon: '',
        category_id: '1',
      },
      {
        num: 2,
        name: 'HBO Max Channel',
        stream_id: 102,
        stream_icon: '',
        category_id: '2',
      },
    ];

    (xtreamService.getLiveStreams as jest.Mock).mockResolvedValueOnce(mockLiveStreams);

    const { result } = renderHook(() => useXtream(mockAccount));

    // Initial fetch of all streams
    await act(async () => {
      await result.current.fetchStreams('live');
    });

    expect(result.current.items).toEqual(mockLiveStreams);
    expect(xtreamService.getLiveStreams).toHaveBeenCalledTimes(1);

    // Category filter should filter from memory cache without network call
    await act(async () => {
      await result.current.fetchStreams('live', '1');
    });

    expect(result.current.items).toEqual([mockLiveStreams[0]]);
    expect(xtreamService.getLiveStreams).toHaveBeenCalledTimes(1);
  });
});
