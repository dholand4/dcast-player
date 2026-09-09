import { IAccountCredentials, IXtreamUserInfo } from '../@types/xtream';
import { IWatchProgress, IFavoriteItem, ContentType, ICustomCategoryFolder } from '../@types/storage';
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
  SAVED_ACCOUNTS: 'saved_accounts',
  USER_INFO: 'user_info',
  FAVORITES: 'user_favorites',
  HISTORY_PREFIX: 'history_',
  HIDDEN_CATEGORIES_PREFIX: 'hidden_categories_',
  HIDDEN_STREAMS_PREFIX: 'hidden_streams_',
  CUSTOM_FOLDERS_PREFIX: 'custom_folders_',
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
    this.saveAccountToSavedList(credentials);
  },

  getSavedAccounts(): IAccountCredentials[] {
    try {
      const raw = storage.getString(KEYS.SAVED_ACCOUNTS);
      if (!raw) {
        const current = this.getAccount();
        return current ? [current] : [];
      }
      return JSON.parse(raw) as IAccountCredentials[];
    } catch {
      return [];
    }
  },

  saveAccountToSavedList(credentials: IAccountCredentials): void {
    try {
      const accounts = this.getSavedAccounts();
      const existingIdx = accounts.findIndex(
        (a) =>
          a.serverUrl.toLowerCase() === credentials.serverUrl.toLowerCase() &&
          a.username.toLowerCase() === credentials.username.toLowerCase()
      );
      if (existingIdx >= 0) {
        accounts[existingIdx] = credentials;
      } else {
        accounts.unshift(credentials);
      }
      storage.set(KEYS.SAVED_ACCOUNTS, JSON.stringify(accounts.slice(0, 10)));
    } catch {
      // ignore
    }
  },

  removeSavedAccount(serverUrl: string, username: string): void {
    try {
      const accounts = this.getSavedAccounts();
      const filtered = accounts.filter(
        (a) =>
          !(
            a.serverUrl.toLowerCase() === serverUrl.toLowerCase() &&
            a.username.toLowerCase() === username.toLowerCase()
          )
      );
      storage.set(KEYS.SAVED_ACCOUNTS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
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

  // --- Hidden Categories ---
  getHiddenCategories(type: ContentType): string[] {
    try {
      const raw = storage.getString(`${KEYS.HIDDEN_CATEGORIES_PREFIX}${type}`);
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  },

  setHiddenCategories(type: ContentType, categoryIds: string[]): void {
    storage.set(`${KEYS.HIDDEN_CATEGORIES_PREFIX}${type}`, JSON.stringify(categoryIds));
  },

  toggleHideCategory(type: ContentType, categoryId: string): boolean {
    const list = this.getHiddenCategories(type);
    const id = String(categoryId);
    const index = list.indexOf(id);
    let isHidden = false;
    if (index >= 0) {
      list.splice(index, 1);
      isHidden = false;
    } else {
      list.push(id);
      isHidden = true;
    }
    this.setHiddenCategories(type, list);
    return isHidden;
  },

  // --- Hidden Streams (Canais / Filmes / Séries específicos) ---
  getHiddenStreams(type: ContentType): string[] {
    try {
      const raw = storage.getString(`${KEYS.HIDDEN_STREAMS_PREFIX}${type}`);
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  },

  setHiddenStreams(type: ContentType, streamIds: string[]): void {
    storage.set(`${KEYS.HIDDEN_STREAMS_PREFIX}${type}`, JSON.stringify(streamIds));
  },

  toggleHideStream(type: ContentType, streamId: string): boolean {
    const list = this.getHiddenStreams(type);
    const id = String(streamId);
    const index = list.indexOf(id);
    let isHidden = false;
    if (index >= 0) {
      list.splice(index, 1);
      isHidden = false;
    } else {
      list.push(id);
      isHidden = true;
    }
    this.setHiddenStreams(type, list);
    return isHidden;
  },

  // --- Custom Folders (ex: "Canais Abertos") ---
  getCustomFolders(type: ContentType): ICustomCategoryFolder[] {
    try {
      const raw = storage.getString(`${KEYS.CUSTOM_FOLDERS_PREFIX}${type}`);
      if (!raw) return [];
      const list = JSON.parse(raw) as ICustomCategoryFolder[];
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch {
      return [];
    }
  },

  saveCustomFolder(folder: ICustomCategoryFolder): void {
    const list = this.getCustomFolders(folder.type);
    const index = list.findIndex((f) => f.id === folder.id);
    if (index >= 0) {
      list[index] = folder;
    } else {
      list.push(folder);
    }
    storage.set(`${KEYS.CUSTOM_FOLDERS_PREFIX}${folder.type}`, JSON.stringify(list));
  },

  setCustomFolders(type: ContentType, folders: ICustomCategoryFolder[]): void {
    storage.set(`${KEYS.CUSTOM_FOLDERS_PREFIX}${type}`, JSON.stringify(folders));
  },

  deleteCustomFolder(type: ContentType, folderId: string): void {
    const list = this.getCustomFolders(type).filter((f) => f.id !== folderId);
    storage.set(`${KEYS.CUSTOM_FOLDERS_PREFIX}${type}`, JSON.stringify(list));
  },

  toggleStreamInCustomFolder(type: ContentType, folderId: string, streamId: string): boolean {
    const list = this.getCustomFolders(type);
    const folder = list.find((f) => f.id === folderId);
    if (!folder) return false;
    const sId = String(streamId);
    const sIndex = folder.streamIds.indexOf(sId);
    let included = false;
    if (sIndex >= 0) {
      folder.streamIds.splice(sIndex, 1);
      included = false;
    } else {
      folder.streamIds.push(sId);
      included = true;
    }
    storage.set(`${KEYS.CUSTOM_FOLDERS_PREFIX}${type}`, JSON.stringify(list));
    return included;
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
