import { storageService } from '../storageService';
import { ICustomCategoryFolder } from '../../@types/storage';

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
