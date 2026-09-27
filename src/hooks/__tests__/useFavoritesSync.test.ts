import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFavorites } from '../useFavorites';
import { storageService } from '../../services/storageService';
import { supabaseService } from '../../services/supabaseService';
import { resetSessionSyncs } from '../../utils/sessionSync';
import { IFavoriteItem } from '../../@types/storage';

jest.mock('../../services/storageService', () => {
  const { createStorageService } = jest.requireActual('../../services/storageCore');
  const memory = new Map<string, string>();
  return {
    memory,
    storageService: createStorageService({
      getString: (key: string) => memory.get(key),
      set: (key: string, value: string) => {
        memory.set(key, value);
      },
      delete: (key: string) => {
        memory.delete(key);
      },
      getAllKeys: () => Array.from(memory.keys()),
    }),
  };
});

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    fetchFavoritesList: jest.fn(),
    upsertFavorite: jest.fn(async () => true),
    removeFavorite: jest.fn(async () => {}),
  },
}));

jest.mock('../../services/profileService', () => ({
  getActiveProfileCloudKey: () => 'cloud-key',
}));

const memory: Map<string, string> = jest.requireMock('../../services/storageService').memory;
const fetchFavoritesList = supabaseService.fetchFavoritesList as jest.Mock;

const fav = (id: string): IFavoriteItem => ({
  id,
  name: `Série ${id}`,
  posterUrl: '',
  type: 'series',
  categoryId: '1',
  addedAt: Number(id),
});

const localIds = () => storageService.getFavorites().map((item) => item.id).sort();

async function renderAndSync() {
  const hook = renderHook(() => useFavorites());
  await waitFor(() => expect(fetchFavoritesList).toHaveBeenCalled());
  await act(async () => {});
  return hook;
}

describe('useFavorites cloud sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memory.clear();
    resetSessionSyncs();
  });

  it('removes a favorite that was deleted on another device', async () => {
    storageService.saveFavorites([fav('1'), fav('2')]);
    storageService.saveFavoritesSyncState({ syncedIds: ['1', '2'], removedIds: [] });
    fetchFavoritesList.mockResolvedValue([fav('1')]);

    const { result } = await renderAndSync();

    expect(localIds()).toEqual(['1']);
    expect(result.current.favorites.map((item) => item.id)).toEqual(['1']);
    expect(supabaseService.upsertFavorite).not.toHaveBeenCalled();
  });

  it('does not bring back a favorite removed here while the cloud still has it', async () => {
    storageService.saveFavorites([fav('1')]);
    storageService.saveFavoritesSyncState({ syncedIds: ['1', '2'], removedIds: ['2'] });
    fetchFavoritesList.mockResolvedValue([fav('1'), fav('2')]);

    await renderAndSync();

    expect(localIds()).toEqual(['1']);
    expect(supabaseService.removeFavorite).toHaveBeenCalledWith('cloud-key', '2');
    expect(storageService.getFavoritesSyncState().removedIds).toEqual(['2']);
  });

  it('forgets a removal once the cloud no longer has the item', async () => {
    storageService.saveFavorites([fav('1')]);
    storageService.saveFavoritesSyncState({ syncedIds: ['1'], removedIds: ['2'] });
    fetchFavoritesList.mockResolvedValue([fav('1')]);

    await renderAndSync();

    expect(storageService.getFavoritesSyncState().removedIds).toEqual([]);
    expect(supabaseService.removeFavorite).not.toHaveBeenCalled();
  });

  it('uploads a favorite added here that never reached the cloud', async () => {
    storageService.saveFavorites([fav('1'), fav('3')]);
    storageService.saveFavoritesSyncState({ syncedIds: ['1'], removedIds: [] });
    fetchFavoritesList.mockResolvedValue([fav('1')]);

    await renderAndSync();

    expect(localIds()).toEqual(['1', '3']);
    expect(supabaseService.upsertFavorite).toHaveBeenCalledWith('cloud-key', expect.objectContaining({ id: '3' }));
    expect(storageService.getFavoritesSyncState().syncedIds?.sort()).toEqual(['1', '3']);
  });

  it('merges both sides on the first sync of this device', async () => {
    storageService.saveFavorites([fav('1'), fav('3')]);
    fetchFavoritesList.mockResolvedValue([fav('1'), fav('2')]);

    await renderAndSync();

    expect(localIds()).toEqual(['1', '2', '3']);
    expect(supabaseService.upsertFavorite).toHaveBeenCalledTimes(1);
    expect(storageService.getFavoritesSyncState().syncedIds?.sort()).toEqual(['1', '2', '3']);
  });

  it('keeps the local list untouched when the cloud cannot be reached', async () => {
    storageService.saveFavorites([fav('1'), fav('2')]);
    storageService.saveFavoritesSyncState({ syncedIds: ['1', '2', '5'], removedIds: [] });
    fetchFavoritesList.mockResolvedValue(null);

    await renderAndSync();

    expect(localIds()).toEqual(['1', '2']);
    expect(storageService.getFavoritesSyncState().syncedIds).toEqual(['1', '2', '5']);
  });

  it('remembers a removal made here until the cloud confirms it', async () => {
    storageService.saveFavorites([fav('1')]);
    storageService.saveFavoritesSyncState({ syncedIds: ['1'], removedIds: [] });
    fetchFavoritesList.mockResolvedValue([fav('1')]);
    const { result } = await renderAndSync();

    act(() => {
      result.current.toggleFavorite(fav('1'));
    });

    expect(localIds()).toEqual([]);
    expect(storageService.getFavoritesSyncState()).toEqual({ syncedIds: [], removedIds: ['1'] });
    expect(supabaseService.removeFavorite).toHaveBeenCalledWith('cloud-key', '1');
  });
});
