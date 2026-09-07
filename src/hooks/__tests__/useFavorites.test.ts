import { renderHook, act } from '@testing-library/react-native';
import { useFavorites } from '../useFavorites';
import { storageService } from '../../services/storageService';
import { IFavoriteItem } from '../../@types/storage';

jest.mock('../../services/storageService', () => ({
  storageService: {
    getFavorites: jest.fn(() => []),
    isFavorite: jest.fn(() => false),
    toggleFavorite: jest.fn(() => true),
    removeFavorite: jest.fn(),
  },
}));

describe('useFavorites hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockItem: IFavoriteItem = {
    id: '123',
    name: 'HBO HD',
    posterUrl: 'http://example.com/logo.png',
    type: 'live',
    categoryId: '1',
    addedAt: 1600000000,
  };

  it('loads initial favorites on mount', () => {
    (storageService.getFavorites as jest.Mock).mockReturnValueOnce([mockItem]);
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].name).toBe('HBO HD');
  });

  it('toggles favorite status and updates list', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      const added = result.current.toggleFavorite(mockItem);
      expect(added).toBe(true);
    });

    expect(storageService.toggleFavorite).toHaveBeenCalledWith(mockItem);
  });

  it('removes favorite item', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.removeFavorite('123');
    });

    expect(storageService.removeFavorite).toHaveBeenCalledWith('123');
  });
});
