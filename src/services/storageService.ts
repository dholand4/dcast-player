import { Paths, File } from 'expo-file-system';
import { MMKV } from 'react-native-mmkv';
import { IAccountCredentials, IXtreamUserInfo } from '../@types/xtream';
import { IWatchProgress, IFavoriteItem } from '../@types/storage';

interface IStorageLike {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  getAllKeys: () => string[];
}

const memoryStore = new Map<string, string>();

async function persistMemoryStoreAsync() {
  try {
    if (!Paths.document) return;
    const obj: Record<string, string> = {};
    memoryStore.forEach((v, k) => {
      obj[k] = v;
    });
    const file = new File(Paths.document, 'dcast_storage.json');
    if (!file.exists) {
      file.create();
    }
    file.write(JSON.stringify(obj));
  } catch {
    // ignore
  }
}

async function hydrateMemoryStoreAsync() {
  try {
    if (!Paths.document) return;
    const file = new File(Paths.document, 'dcast_storage.json');
    if (file.exists) {
      const content = await file.text();
      const obj = JSON.parse(content);
      Object.keys(obj).forEach((k) => {
        memoryStore.set(k, obj[k]);
      });
    }
  } catch {
    // ignore
  }
}

// Hydrate on module load
hydrateMemoryStoreAsync();

let storageImpl: IStorageLike;

try {
  storageImpl = new MMKV();
} catch {
  // Fallback when running inside Expo Go without prebuilt native binaries
  storageImpl = {
    getString: (key) => memoryStore.get(key),
    set: (key, value) => {
      memoryStore.set(key, value);
      persistMemoryStoreAsync();
    },
    delete: (key) => {
      memoryStore.delete(key);
      persistMemoryStoreAsync();
    },
    getAllKeys: () => Array.from(memoryStore.keys()),
  };
}

export const storage = storageImpl;

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
    const key = `${KEYS.HISTORY_PREFIX}${progress.id}`;
    storage.set(key, JSON.stringify(progress));
  },

  getWatchProgress(contentId: string): IWatchProgress | null {
    try {
      const key = `${KEYS.HISTORY_PREFIX}${contentId}`;
      const raw = storage.getString(key);
      if (!raw) return null;
      return JSON.parse(raw) as IWatchProgress;
    } catch {
      return null;
    }
  },

  removeWatchProgress(contentId: string): void {
    const key = `${KEYS.HISTORY_PREFIX}${contentId}`;
    storage.delete(key);
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
          list.push(parsed);
        } catch {
          // ignore corrupted entry
        }
      }
    }

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getContinueWatching(): IWatchProgress[] {
    const all = this.getAllWatchProgress();
    // Rule: Percentage > 2% and < 95%
    return all.filter((item) => item.percentage > 2 && item.percentage < 95);
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
      storage.set(`streams_${key}`, JSON.stringify(data));
    } catch {
      // storage limit or ignore
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
