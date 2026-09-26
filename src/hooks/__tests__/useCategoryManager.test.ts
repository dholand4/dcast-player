import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCategoryManager } from '../useCategoryManager';
import { storageService } from '../../services/storageService';
import { supabaseService } from '../../services/supabaseService';
import { resetSessionSyncs } from '../../utils/sessionSync';
import { ICustomCategoryFolder } from '../../@types/storage';

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getUserKey: jest.fn(() => 'hashed_key'),
    fetchCustomFoldersList: jest.fn(async () => []),
    upsertCustomFolder: jest.fn(),
    fetchHiddenItems: jest.fn(async () => null),
    upsertHiddenItems: jest.fn(),
  },
}));

jest.mock('../../services/storageService', () => ({
  storageService: {
    getAccount: jest.fn(() => null),
    setHiddenCategories: jest.fn(),
    setHiddenStreams: jest.fn(),
    setCustomFolders: jest.fn(),
    getHiddenCategories: jest.fn(() => []),
    toggleHideCategory: jest.fn(() => true),
    getHiddenStreams: jest.fn(() => []),
    toggleHideStream: jest.fn(() => true),
    getCustomFolders: jest.fn(() => []),
    saveCustomFolder: jest.fn(),
    deleteCustomFolder: jest.fn(),
    toggleStreamInCustomFolder: jest.fn(() => true),
  },
}));

describe('useCategoryManager hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionSyncs();
  });

  it('uploads local hidden items when the cloud has none, only once per session', async () => {
    (storageService.getAccount as jest.Mock).mockReturnValue({ username: 'u', password: 'p' });
    (storageService.getHiddenCategories as jest.Mock).mockReturnValue(['adult']);

    renderHook(() => useCategoryManager('live'));
    renderHook(() => useCategoryManager('live'));

    await waitFor(() => {
      expect(supabaseService.upsertHiddenItems).toHaveBeenCalledWith('hashed_key', 'live', ['adult'], []);
    });
    expect(supabaseService.fetchHiddenItems).toHaveBeenCalledTimes(1);

    (storageService.getAccount as jest.Mock).mockReturnValue(null);
    (storageService.getHiddenCategories as jest.Mock).mockReturnValue([]);
  });

  const mockFolder: ICustomCategoryFolder = {
    id: 'custom_1',
    name: 'Canais Abertos',
    type: 'live',
    streamIds: ['10', '20'],
    createdAt: 1700000000,
  };

  it('loads initial hidden categories and custom folders', () => {
    (storageService.getHiddenCategories as jest.Mock).mockReturnValue(['cat_adult']);
    (storageService.getCustomFolders as jest.Mock).mockReturnValue([mockFolder]);

    const { result } = renderHook(() => useCategoryManager('live'));

    expect(result.current.hiddenCategories).toContain('cat_adult');
    expect(result.current.isCategoryHidden('cat_adult')).toBe(true);
    expect(result.current.customFolders).toHaveLength(1);
    expect(result.current.customFolders[0].name).toBe('Canais Abertos');
  });

  it('toggles category visibility', () => {
    const { result } = renderHook(() => useCategoryManager('live'));

    act(() => {
      const isHidden = result.current.toggleHideCategory('cat_123');
      expect(isHidden).toBe(true);
    });

    expect(storageService.toggleHideCategory).toHaveBeenCalledWith('live', 'cat_123');
  });

  it('toggles stream visibility', () => {
    const { result } = renderHook(() => useCategoryManager('live'));

    act(() => {
      const isHidden = result.current.toggleHideStream('stream_99');
      expect(isHidden).toBe(true);
    });

    expect(storageService.toggleHideStream).toHaveBeenCalledWith('live', 'stream_99');
  });

  it('saves and deletes custom folders', () => {
    const { result } = renderHook(() => useCategoryManager('live'));

    act(() => {
      result.current.saveFolder(mockFolder);
    });
    expect(storageService.saveCustomFolder).toHaveBeenCalledWith(mockFolder);

    act(() => {
      result.current.deleteFolder('custom_1');
    });
    expect(storageService.deleteCustomFolder).toHaveBeenCalledWith('live', 'custom_1');
  });

  it('toggles stream in folder', () => {
    const { result } = renderHook(() => useCategoryManager('live'));

    act(() => {
      const included = result.current.toggleStreamInFolder('custom_1', '10');
      expect(included).toBe(true);
    });

    expect(storageService.toggleStreamInCustomFolder).toHaveBeenCalledWith('live', 'custom_1', '10');
  });
});
