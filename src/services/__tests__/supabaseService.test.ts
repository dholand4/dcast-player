import {
  supabaseService,
  getUserKey,
  upsertWatchProgress,
  fetchWatchProgressList,
  removeWatchProgress,
  upsertFavorite,
  removeFavorite,
  fetchFavoritesList,
} from '../supabaseService';
import { IWatchProgress, IFavoriteItem } from '../../@types/storage';
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
});
