import { createStorageService, IStorageLike, DEFAULT_PROFILE_ID } from '../storageCore';
import { IWatchProgress, IFavoriteItem } from '../../@types/storage';
import { IAccountCredentials } from '../../@types/xtream';

function createMemoryStorage(): IStorageLike & { dump: () => Record<string, string> } {
  const map = new Map<string, string>();
  return {
    getString: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
    },
    delete: (key) => {
      map.delete(key);
    },
    getAllKeys: () => Array.from(map.keys()),
    dump: () => Object.fromEntries(map),
  };
}

const accountA: IAccountCredentials = { serverUrl: 'http://a.tv:8080', username: 'ana', password: '1', label: 'A' };
const accountB: IAccountCredentials = { serverUrl: 'http://b.tv', username: 'bia', password: '2', label: 'B' };

const progress = (id: string): IWatchProgress => ({
  id,
  title: `Filme ${id}`,
  posterUrl: '',
  type: 'movie',
  currentTime: 60,
  duration: 600,
  percentage: 10,
  updatedAt: Date.now(),
});

const favorite = (id: string): IFavoriteItem => ({
  id,
  name: `Canal ${id}`,
  posterUrl: '',
  type: 'live',
  categoryId: '1',
  addedAt: 1,
});

describe('storageCore scoping', () => {
  it('moves legacy data to the logged-in account default profile on first use', () => {
    const memory = createMemoryStorage();
    memory.set('history_10', JSON.stringify(progress('10')));
    memory.set('user_favorites', JSON.stringify([favorite('5')]));
    memory.set('hidden_categories_live', JSON.stringify(['adult']));
    memory.set('user_account', JSON.stringify(accountA));

    const service = createStorageService(memory);

    expect(service.getWatchProgress('10')?.title).toBe('Filme 10');
    expect(service.getFavorites().map((item) => item.id)).toEqual(['5']);
    expect(service.getHiddenCategories('live')).toEqual(['adult']);
    expect(Object.keys(memory.dump()).some((key) => key.startsWith('history_'))).toBe(false);
  });

  it('keeps each IPTV account data separate', () => {
    const service = createStorageService(createMemoryStorage());

    service.saveAccount(accountA);
    service.saveWatchProgress(progress('1'));
    service.setHiddenCategories('live', ['x']);

    service.saveAccount(accountB);
    expect(service.getAllWatchProgress()).toEqual([]);
    expect(service.getHiddenCategories('live')).toEqual([]);

    service.saveAccount(accountA);
    expect(service.getAllWatchProgress().map((item) => item.id)).toEqual(['1']);
  });

  it('separates history and favorites per profile but shares folders and hidden items', () => {
    const service = createStorageService(createMemoryStorage());
    service.saveAccount(accountA);

    service.setActiveProfileId(DEFAULT_PROFILE_ID);
    service.saveWatchProgress(progress('1'));
    service.saveFavorites([favorite('9')]);
    service.setHiddenStreams('live', ['99']);

    service.setActiveProfileId('kids');
    expect(service.getAllWatchProgress()).toEqual([]);
    expect(service.getFavorites()).toEqual([]);
    expect(service.getHiddenStreams('live')).toEqual(['99']);

    service.saveWatchProgress(progress('2'));
    service.setActiveProfileId(DEFAULT_PROFILE_ID);
    expect(service.getAllWatchProgress().map((item) => item.id)).toEqual(['1']);
  });

  it('deletes only the data of the removed profile', () => {
    const service = createStorageService(createMemoryStorage());
    service.saveAccount(accountA);
    service.setActiveProfileId('kids');
    service.saveWatchProgress(progress('2'));
    service.setActiveProfileId(DEFAULT_PROFILE_ID);
    service.saveWatchProgress(progress('1'));

    service.deleteProfileData('kids');

    expect(service.getAllWatchProgress().map((item) => item.id)).toEqual(['1']);
    service.setActiveProfileId('kids');
    expect(service.getAllWatchProgress()).toEqual([]);
  });

  it('stores profiles per account and hides deleted ones by default', () => {
    const service = createStorageService(createMemoryStorage());
    service.saveAccount(accountA);
    service.saveProfiles([
      { id: 'default', name: 'Principal', color: '#E50914', createdAt: 0, updatedAt: 0 },
      { id: 'old', name: 'Antigo', color: '#29B6F6', createdAt: 1, updatedAt: 2, deleted: true },
    ]);

    expect(service.getProfiles().map((profile) => profile.id)).toEqual(['default']);
    expect(service.getProfiles(true)).toHaveLength(2);

    service.saveAccount(accountB);
    expect(service.getProfiles()).toEqual([]);
  });
});
