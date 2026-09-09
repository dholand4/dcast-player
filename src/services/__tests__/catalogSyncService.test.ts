import { catalogSyncService } from '../catalogSyncService';
import { xtreamService } from '../xtreamService';
import { storageService } from '../storageService';
import { IAccountCredentials } from '../../@types/xtream';

jest.mock('../xtreamService', () => ({
  xtreamService: {
    getLiveCategories: jest.fn(() => Promise.resolve([{ category_id: '1', category_name: 'Ao Vivo' }])),
    getLiveStreams: jest.fn(() => Promise.resolve([{ stream_id: 100, name: 'Globo SP HD' }])),
    getVodCategories: jest.fn(() => Promise.resolve([{ category_id: '2', category_name: 'Filmes' }])),
    getVodStreams: jest.fn(() => Promise.resolve([{ stream_id: 200, name: 'Filme Legal' }])),
    getSeriesCategories: jest.fn(() => Promise.resolve([{ category_id: '3', category_name: 'Séries' }])),
    getSeries: jest.fn(() => Promise.resolve([{ series_id: 300, name: 'Série Legal' }])),
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

  it('syncs series catalog and saves to storage and RAM', async () => {
    const result = await catalogSyncService.syncSeriesCatalog(mockAccount);

    expect(result).toBe(true);
    expect(xtreamService.getSeriesCategories).toHaveBeenCalledWith(mockAccount);
    expect(xtreamService.getSeries).toHaveBeenCalled();
    expect(storageService.saveCachedCategories).toHaveBeenCalled();
    expect(storageService.saveCachedStreams).toHaveBeenCalled();
  });

  it('syncs movie catalog and saves to storage and RAM', async () => {
    const result = await catalogSyncService.syncMovieCatalog(mockAccount);

    expect(result).toBe(true);
    expect(xtreamService.getVodCategories).toHaveBeenCalledWith(mockAccount);
    expect(xtreamService.getVodStreams).toHaveBeenCalled();
    expect(storageService.saveCachedCategories).toHaveBeenCalled();
    expect(storageService.saveCachedStreams).toHaveBeenCalled();
  });

  it('returns cleanup function when starting background queue', () => {
    const cleanup = catalogSyncService.startBackgroundQueue(mockAccount);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });
});
