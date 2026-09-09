import { IAccountCredentials, IXtreamUserInfo } from '../@types/xtream';
import { IWatchProgress, IFavoriteItem, ContentType } from '../@types/storage';
import { cleanEpisodeDisplayTitle } from '../utils/formatters';

interface IStorageLike {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  getAllKeys: () => string[];
}

const memoryStore = new Map<string, string>();

const isLocalStorageAvailable =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage: IStorageLike = {
  getString: (key: string): string | undefined => {
    if (isLocalStorageAvailable) {
      try {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : undefined;
      } catch {
        return memoryStore.get(key);
      }
    }
    return memoryStore.get(key);
  },
  set: (key: string, value: string): void => {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        memoryStore.set(key, value);
      }
    } else {
      memoryStore.set(key, value);
    }
  },
  delete: (key: string): void => {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        memoryStore.delete(key);
      }
    } else {
      memoryStore.delete(key);
    }
  },
  getAllKeys: (): string[] => {
    if (isLocalStorageAvailable) {
      try {
        return Object.keys(window.localStorage);
      } catch {
        return Array.from(memoryStore.keys());
      }
    }
    return Array.from(memoryStore.keys());
  },
};

const KEYS = {
  ACCOUNT: 'user_account',
  USER_INFO: 'user_info',
  FAVORITES: 'user_favorites',
  HISTORY_PREFIX: 'history_',
};

export const storageService = {
  // --- Account Credentials ---
  getAccount(): IAccountCredentials | null {
    try {
      const raw = storage.getString(KEYS.ACCOUNT);
      if (!raw) return null;
      return JSON.parse(raw) as IAccountCredentials;
    } catch {
      return null;
    }
  },

  saveAccount(credentials: IAccountCredentials): void {
    storage.set(KEYS.ACCOUNT, JSON.stringify(credentials));
  },

  getUserInfo(): IXtreamUserInfo | null {
    try {
      const raw = storage.getString(KEYS.USER_INFO);
      if (!raw) return null;
      return JSON.parse(raw) as IXtreamUserInfo;
    } catch {
      return null;
    }
  },

  saveUserInfo(userInfo: IXtreamUserInfo): void {
    storage.set(KEYS.USER_INFO, JSON.stringify(userInfo));
  },

  clearAccount(): void {
    storage.delete(KEYS.ACCOUNT);
    storage.delete(KEYS.USER_INFO);
  },

  // --- Watch Progress / History ---
  saveWatchProgress(progress: IWatchProgress): void {
    const itemToSave =
      progress.type === 'series' && progress.title
        ? { ...progress, title: cleanEpisodeDisplayTitle(progress.title) }
        : progress;
    const key = `${KEYS.HISTORY_PREFIX}${itemToSave.id}`;
    storage.set(key, JSON.stringify(itemToSave));
  },

  getWatchProgress(contentId: string): IWatchProgress | null {
    try {
      const key = `${KEYS.HISTORY_PREFIX}${contentId}`;
      const raw = storage.getString(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as IWatchProgress;
      if (parsed.type === 'series' && parsed.title) {
        parsed.title = cleanEpisodeDisplayTitle(parsed.title);
      }
      return parsed;
    } catch {
      return null;
    }
  },

  removeWatchProgress(contentId: string, seriesId?: string): void {
    storage.delete(`${KEYS.HISTORY_PREFIX}${contentId}`);
    if (seriesId) {
      storage.delete(`${KEYS.HISTORY_PREFIX}${seriesId}`);
    }

    const allKeys = storage.getAllKeys();
    const historyKeys = allKeys.filter((k) => k.startsWith(KEYS.HISTORY_PREFIX));
    for (const key of historyKeys) {
      const raw = storage.getString(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as IWatchProgress;
          if (
            String(parsed.id) === String(contentId) ||
            (parsed.seriesId && String(parsed.seriesId) === String(contentId)) ||
            (seriesId &&
              (String(parsed.id) === String(seriesId) ||
                (parsed.seriesId && String(parsed.seriesId) === String(seriesId))))
          ) {
            storage.delete(key);
          }
        } catch {
          // ignore
        }
      }
    }
  },

  getAllWatchProgress(): IWatchProgress[] {
    const allKeys = storage.getAllKeys();
    const historyKeys = allKeys.filter((k) => k.startsWith(KEYS.HISTORY_PREFIX));
    const list: IWatchProgress[] = [];

    for (const key of historyKeys) {
      const raw = storage.getString(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as IWatchProgress;
          if (parsed.type === 'series' && parsed.title) {
            parsed.title = cleanEpisodeDisplayTitle(parsed.title);
          }
          list.push(parsed);
        } catch {
          // ignore
        }
      }
    }

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getContinueWatching(): IWatchProgress[] {
    const all = this.getAllWatchProgress();
    return all.filter(
      (item) =>
        (item.currentTime > 0 || item.percentage > 0 || item.updatedAt > 0) &&
        item.percentage < 98
    );
  },

  clearWatchHistory(type?: ContentType): void {
    const allKeys = storage.getAllKeys();
    const historyKeys = allKeys.filter((k) => k.startsWith(KEYS.HISTORY_PREFIX));
    for (const key of historyKeys) {
      if (!type) {
        storage.delete(key);
      } else {
        const raw = storage.getString(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as IWatchProgress;
            if (parsed.type === type) {
              storage.delete(key);
            }
          } catch {
            storage.delete(key);
          }
        }
      }
    }
  },

  // --- Favorites ---
  getFavorites(): IFavoriteItem[] {
    try {
      const raw = storage.getString(KEYS.FAVORITES);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as IFavoriteItem[];
      return parsed.sort((a, b) => b.addedAt - a.addedAt);
    } catch {
      return [];
    }
  },

  saveFavorites(favorites: IFavoriteItem[]): void {
    storage.set(KEYS.FAVORITES, JSON.stringify(favorites));
  },

  isFavorite(contentId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some((item) => item.id === contentId);
  },

  toggleFavorite(item: IFavoriteItem): boolean {
    const favorites = this.getFavorites();
    const index = favorites.findIndex((fav) => fav.id === item.id);
    let isNowFavorite = false;

    if (index >= 0) {
      favorites.splice(index, 1);
      isNowFavorite = false;
    } else {
      favorites.unshift({ ...item, addedAt: Date.now() });
      isNowFavorite = true;
    }

    storage.set(KEYS.FAVORITES, JSON.stringify(favorites));
    return isNowFavorite;
  },

  removeFavorite(contentId: string): void {
    const favorites = this.getFavorites().filter((item) => item.id !== contentId);
    storage.set(KEYS.FAVORITES, JSON.stringify(favorites));
  },

  // --- Catalog Cache (Streams & Categories) ---
  getCachedStreams<T = unknown[]>(key: string): T | null {
    try {
      const raw = storage.getString(`streams_${key}`);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  saveCachedStreams<T = unknown[]>(key: string, data: T): void {
    try {
      if (Array.isArray(data) && data.length > 5000) {
        return;
      }
      storage.set(`streams_${key}`, JSON.stringify(data));
    } catch {
      // ignore
    }
  },

  getCachedCategories<T = unknown[]>(key: string): T | null {
    try {
      const raw = storage.getString(`categories_${key}`);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  saveCachedCategories<T = unknown[]>(key: string, data: T): void {
    try {
      storage.set(`categories_${key}`, JSON.stringify(data));
    } catch {
      // ignore
    }
  },

  clearCatalogCache(): void {
    const allKeys = storage.getAllKeys();
    for (const k of allKeys) {
      if (k.startsWith('streams_') || k.startsWith('categories_')) {
        storage.delete(k);
      }
    }
  },
};
