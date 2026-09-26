import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';
import { storageService } from '../storageService';
import { ICustomCategoryFolder, IWatchProgress } from '../../@types/storage';

describe('storageService encryption', () => {
  it('encrypts existing data with a 16-char key saved in the secure store on first run', () => {
    const instance = (MMKV as unknown as jest.Mock).mock.results[0].value;
    const savedKey = (SecureStore.setItem as jest.Mock).mock.calls[0];

    expect(savedKey[0]).toBe('dcast_storage_key');
    expect(savedKey[1]).toHaveLength(16);
    expect(instance.recrypt).toHaveBeenCalledWith(savedKey[1]);
  });
});

describe('storageService continue watching', () => {
  const base: IWatchProgress = {
    id: 'ep-1',
    seriesId: 'series-9',
    title: 'Série - T1E1: Piloto',
    posterUrl: '',
    type: 'series',
    currentTime: 300,
    duration: 1800,
    percentage: 16,
    updatedAt: 1000,
  };

  beforeEach(() => {
    storageService.clearWatchHistory();
  });

  it('hides the whole series from continue watching but keeps its episodes progress', () => {
    storageService.saveWatchProgress(base);
    storageService.saveWatchProgress({ ...base, id: 'ep-2', updatedAt: 2000 });
    storageService.saveWatchProgress({ ...base, id: 'movie-1', seriesId: undefined, type: 'movie', title: 'Filme' });

    const changed = storageService.hideFromContinueWatching('ep-2', 'series-9');

    expect(changed.map((item) => item.id).sort()).toEqual(['ep-1', 'ep-2']);
    expect(storageService.getContinueWatching().map((item) => item.id)).toEqual(['movie-1']);
    expect(storageService.getWatchProgress('ep-1')).toEqual(
      expect.objectContaining({ currentTime: 300, hiddenFromContinue: true })
    );
  });

  it('shows the item again when it is watched after being hidden', () => {
    storageService.saveWatchProgress(base);
    storageService.hideAllFromContinueWatching('series');
    expect(storageService.getContinueWatching()).toHaveLength(0);

    storageService.saveWatchProgress({ ...base, currentTime: 400, updatedAt: 3000 });

    expect(storageService.getContinueWatching().map((item) => item.id)).toEqual(['ep-1']);
  });
});

describe('storageService category manager methods', () => {
  beforeEach(() => {
    storageService.setHiddenCategories('live', []);
    storageService.setHiddenStreams('live', []);
  });

  it('toggles hidden categories', () => {
    expect(storageService.getHiddenCategories('live')).toEqual([]);

    const isHidden1 = storageService.toggleHideCategory('live', 'cat_1');
    expect(isHidden1).toBe(true);
    expect(storageService.getHiddenCategories('live')).toContain('cat_1');

    const isHidden2 = storageService.toggleHideCategory('live', 'cat_1');
    expect(isHidden2).toBe(false);
    expect(storageService.getHiddenCategories('live')).not.toContain('cat_1');
  });

  it('toggles hidden streams', () => {
    expect(storageService.getHiddenStreams('live')).toEqual([]);

    const isHidden1 = storageService.toggleHideStream('live', '101');
    expect(isHidden1).toBe(true);
    expect(storageService.getHiddenStreams('live')).toContain('101');

    const isHidden2 = storageService.toggleHideStream('live', '101');
    expect(isHidden2).toBe(false);
    expect(storageService.getHiddenStreams('live')).not.toContain('101');
  });

  it('manages custom folders and stream associations', () => {
    const folder: ICustomCategoryFolder = {
      id: 'custom_abertos',
      name: 'Canais Abertos',
      type: 'live',
      streamIds: ['1', '2'],
      createdAt: Date.now(),
    };

    storageService.saveCustomFolder(folder);
    const folders = storageService.getCustomFolders('live');
    expect(folders.some((f) => f.id === 'custom_abertos')).toBe(true);

    // Toggle stream inside folder
    const added = storageService.toggleStreamInCustomFolder('live', 'custom_abertos', '3');
    expect(added).toBe(true);
    const updated = storageService.getCustomFolders('live').find((f) => f.id === 'custom_abertos');
    expect(updated?.streamIds).toContain('3');

    // Remove stream from folder
    const removed = storageService.toggleStreamInCustomFolder('live', 'custom_abertos', '3');
    expect(removed).toBe(false);
    const updated2 = storageService.getCustomFolders('live').find((f) => f.id === 'custom_abertos');
    expect(updated2?.streamIds).not.toContain('3');

    // Delete folder
    storageService.deleteCustomFolder('live', 'custom_abertos');
    const finalFolders = storageService.getCustomFolders('live');
    expect(finalFolders.some((f) => f.id === 'custom_abertos')).toBe(false);
  });
});
