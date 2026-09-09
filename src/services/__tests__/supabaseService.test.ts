import {
  supabaseService,
  getUserKey,
  upsertWatchProgress,
  fetchWatchProgressList,
  removeWatchProgress,
  upsertFavorite,
  removeFavorite,
  fetchFavoritesList,
  upsertCustomFolder,
  removeCustomFolder,
  fetchCustomFoldersList,
  upsertHiddenItems,
  fetchHiddenItems,
} from '../supabaseService';
import { IWatchProgress, IFavoriteItem, ICustomCategoryFolder } from '../../@types/storage';
import { IAccountCredentials } from '../../@types/xtream';

global.fetch = jest.fn();

describe('supabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserKey', () => {
    it('returns "guest" when account is null or missing username', () => {
      expect(getUserKey(null)).toBe('guest');
      expect(getUserKey(undefined)).toBe('guest');
      expect(getUserKey({ username: '' } as IAccountCredentials)).toBe('guest');
    });

    it('formats a clean identifier from username and serverUrl', () => {
      const acc: IAccountCredentials = {
        username: 'User.Name#1',
        serverUrl: 'http://iptv-server.net:8080/live',
        password: 'pass',
        label: 'My Account',
      };
      const key = getUserKey(acc);
      expect(key).toBe('user_name_1_iptv_server_net');
    });
  });

  describe('upsertWatchProgress', () => {
    it('sends POST request with resolution=merge-duplicates', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const progress: IWatchProgress = {
        id: '100',
        title: 'Filme Legal',
        posterUrl: 'http://cover.jpg',
        type: 'movie',
        currentTime: 120,
        duration: 3600,
        percentage: 3,
        updatedAt: 1700000000,
      };

      await upsertWatchProgress('user_1', progress);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/dcast_watch_progress'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Prefer: 'resolution=merge-duplicates',
          }),
        })
      );
    });

    it('handles network error without throwing', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(
        upsertWatchProgress('user_1', { id: '1' } as IWatchProgress)
      ).resolves.not.toThrow();
    });
  });

  describe('fetchWatchProgressList', () => {
    it('returns parsed list of IWatchProgress', async () => {
      const mockRows = [
        {
          content_id: '100',
          title: 'Matrix',
          poster_url: 'http://img.jpg',
          content_type: 'movie',
          current_position: 500,
          duration: 7200,
          percentage: 7,
          updated_at: 1700000000,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRows,
      });

      const list = await fetchWatchProgressList('user_1');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('100');
      expect(list[0].title).toBe('Matrix');
      expect(list[0].currentTime).toBe(500);
    });

    it('returns empty array on failure', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));
      const list = await fetchWatchProgressList('user_1');
      expect(list).toEqual([]);
    });
  });

  describe('removeWatchProgress', () => {
    it('sends DELETE request with user_key and content_id', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await removeWatchProgress('user_1', '100');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/dcast_watch_progress?user_key=eq.user_1&content_id=eq.100'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('clearWatchProgress', () => {
    it('sends DELETE request with user_key', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await supabaseService.clearWatchProgress('user_1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/dcast_watch_progress?user_key=eq.user_1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('upsertFavorite and fetchFavoritesList', () => {
    it('sends POST request for favorite', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const fav: IFavoriteItem = {
        id: '99',
        name: 'HBO',
        posterUrl: 'http://hbo.png',
        type: 'live',
        categoryId: '1',
        addedAt: 1700000000,
      };

      await upsertFavorite('user_1', fav);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/dcast_favorites'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Prefer: 'resolution=merge-duplicates',
          }),
        })
      );
    });

    it('fetches and maps favorites correctly', async () => {
      const mockRows = [
        {
          item_id: '99',
          name: 'HBO',
          poster_url: 'http://hbo.png',
          content_type: 'live',
          category_id: '1',
          added_at: 1700000000,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRows,
      });

      const list = await fetchFavoritesList('user_1');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('99');
      expect(list[0].name).toBe('HBO');
    });

    it('sends DELETE request on removeFavorite', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await removeFavorite('user_1', '99');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/dcast_favorites?id=eq.user_1_99'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('custom folders', () => {
    it('sends POST request to dcast_custom_folders on upsertCustomFolder', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      const folder: ICustomCategoryFolder = {
        id: 'c1',
        name: 'Pastas TV',
        type: 'live',
        streamIds: ['10', '20'],
        createdAt: 1700000000,
      };

      await upsertCustomFolder('user_1', folder);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/dcast_custom_folders'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('sends DELETE request to dcast_custom_folders on removeCustomFolder', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await removeCustomFolder('user_1', 'c1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/dcast_custom_folders?id=eq.user_1_c1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('fetches and parses custom folders list', async () => {
      const mockFolders = [
        {
          folder_id: 'c1',
          name: 'Pastas TV',
          content_type: 'live',
          stream_ids: ['10', '20'],
          created_at: 1700000000,
        },
      ];
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockFolders });

      const list = await fetchCustomFoldersList('user_1', 'live');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('c1');
      expect(list[0].name).toBe('Pastas TV');
      expect(list[0].streamIds).toEqual(['10', '20']);
    });
  });

  describe('hidden items', () => {
    it('sends POST to dcast_hidden_items on upsertHiddenItems', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await upsertHiddenItems('user_1', 'live', ['cat1'], ['stream1']);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/dcast_hidden_items'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('fetches and parses hidden items', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            hidden_categories: ['cat1'],
            hidden_streams: ['stream1'],
          },
        ],
      });

      const res = await fetchHiddenItems('user_1', 'live');
      expect(res).not.toBeNull();
      expect(res?.hiddenCategories).toEqual(['cat1']);
      expect(res?.hiddenStreams).toEqual(['stream1']);
    });
  });
});
