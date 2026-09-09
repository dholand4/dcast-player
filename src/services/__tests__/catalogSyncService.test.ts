import { catalogSyncService } from '../catalogSyncService';
import { xtreamService } from '../xtreamService';
import { storageService } from '../storageService';
import { IAccountCredentials } from '../../@types/xtream';

jest.mock('../xtreamService', () => ({
  xtreamService: {
    getLiveCategories: jest.fn(() => Promise.resolve([{ category_id: '1', category_name: 'Ao Vivo' }])),
    getLiveStreams: jest.fn(() => Promise.resolve([{ stream_id: 100, name: 'Globo SP HD' }])),
    getVodCategories: jest.fn(() => Promise.resolve([{ category_id: '2', category_name: 'Filmes' }])),
    getSeriesCategories: jest.fn(() => Promise.resolve([{ category_id: '3', category_name: 'Séries' }])),
  },
}));

jest.mock('../storageService', () => ({
  storageService: {
    saveCachedCategories: jest.fn(),
    saveCachedStreams: jest.fn(),
  },
}));

const mockAccount: IAccountCredentials = {
  serverUrl: 'http://test.com',
  username: 'user1',
  password: 'pw1',
  label: 'Account 1',
};

describe('catalogSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    catalogSyncService.resetThrottle();
  });

  it('syncs live catalog and saves to storage and RAM', async () => {
    const result = await catalogSyncService.syncLiveCatalog(mockAccount, true);

    expect(result).toBe(true);
    expect(xtreamService.getLiveCategories).toHaveBeenCalledWith(mockAccount);
    expect(xtreamService.getLiveStreams).toHaveBeenCalled();
    expect(storageService.saveCachedCategories).toHaveBeenCalled();
    expect(storageService.saveCachedStreams).toHaveBeenCalled();
  });

  it('syncs vod categories', async () => {
    const result = await catalogSyncService.syncVodCategories(mockAccount);

    expect(result).toBe(true);
    expect(xtreamService.getVodCategories).toHaveBeenCalledWith(mockAccount);
    expect(xtreamService.getSeriesCategories).toHaveBeenCalledWith(mockAccount);
  });

  it('returns cleanup function when starting background queue', () => {
    const cleanup = catalogSyncService.startBackgroundQueue(mockAccount);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });
});
