import { IAccountCredentials, IXtreamUserInfo } from '../@types/xtream';
import {
  IWatchProgress,
  IFavoriteItem,
  ContentType,
  ICustomCategoryFolder,
  IProfile,
} from '../@types/storage';
import { cleanEpisodeDisplayTitle } from '../utils/formatters';
import { getAccountScope } from '../utils/accountIdentity';

export interface IStorageLike {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  getAllKeys: () => string[];
}

const KEYS = {
  ACCOUNT: 'user_account',
  SAVED_ACCOUNTS: 'saved_accounts',
  USER_INFO: 'user_info',
  FAVORITES: 'user_favorites',
  HISTORY_PREFIX: 'history_',
  HIDDEN_CATEGORIES_PREFIX: 'hidden_categories_',
  HIDDEN_STREAMS_PREFIX: 'hidden_streams_',
  CUSTOM_FOLDERS_PREFIX: 'custom_folders_',
  ACTIVE_CAST_MEDIA: 'active_cast_media',
  PROFILES: 'profiles',
  SERIES_EPISODES_PREFIX: 'series_episodes_',
  SERIES_TRACKING_PREFIX: 'series_tracking_',
  NEW_EPISODES_INBOX: 'new_episodes_inbox',
  SCOPE_MIGRATED: 'storage_scope_v1_migrated',
};

export const DEFAULT_PROFILE_ID = 'default';

// Chaves antigas (sem conta/perfil) que migram para a conta ativa na primeira execução
const LEGACY_PROFILE_KEYS = [KEYS.HISTORY_PREFIX, KEYS.FAVORITES];
const LEGACY_ACCOUNT_KEYS = [
  KEYS.HIDDEN_CATEGORIES_PREFIX,
  KEYS.HIDDEN_STREAMS_PREFIX,
  KEYS.CUSTOM_FOLDERS_PREFIX,
];

export function createStorageService(storage: IStorageLike) {
  let activeProfileId = DEFAULT_PROFILE_ID;
  let cachedAccountRaw: string | undefined;
  let cachedAccountScope = '';

  function migrateLegacyKeys(scope: string) {
    if (storage.getString(KEYS.SCOPE_MIGRATED)) return;
    const accountPrefix = `acc:${scope}:`;
    const profilePrefix = `${accountPrefix}prof:${DEFAULT_PROFILE_ID}:`;
    for (const key of storage.getAllKeys()) {
      const target = LEGACY_PROFILE_KEYS.some((legacy) => key.startsWith(legacy))
        ? profilePrefix
        : LEGACY_ACCOUNT_KEYS.some((legacy) => key.startsWith(legacy))
          ? accountPrefix
          : null;
      const value = target ? storage.getString(key) : undefined;
      if (target && value !== undefined) {
        storage.set(`${target}${key}`, value);
        storage.delete(key);
      }
    }
    storage.set(KEYS.SCOPE_MIGRATED, '1');
  }

  // Os dados de histórico, favoritos e pastas ficam separados por lista IPTV
  function getAccountScopeCached(): string {
    const raw = storage.getString(KEYS.ACCOUNT);
    if (raw !== cachedAccountRaw) {
      cachedAccountRaw = raw;
      try {
        cachedAccountScope = raw ? getAccountScope(JSON.parse(raw) as IAccountCredentials) : '';
      } catch {
        cachedAccountScope = '';
      }
      if (cachedAccountScope) {
        migrateLegacyKeys(cachedAccountScope);
      }
    }
    return cachedAccountScope;
  }

  function accountKey(key: string): string {
    const scope = getAccountScopeCached();
    return scope ? `acc:${scope}:${key}` : key;
  }

  // Histórico e favoritos ficam separados por perfil dentro da conta
  function profileKey(key: string, profileId: string = activeProfileId): string {
    const scope = getAccountScopeCached();
    return scope ? `acc:${scope}:prof:${profileId}:${key}` : key;
  }

  return {
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
        // Fallback: se houver uma conta ativa, inicializa com ela
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

  // --- Active Cast Media Persistence (Seamless Reconnection) ---
  getActiveCastMedia(): any | null {
    try {
      const raw = storage.getString(KEYS.ACTIVE_CAST_MEDIA);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveActiveCastMedia(media: any): void {
    try {
      if (!media) {
        storage.delete(KEYS.ACTIVE_CAST_MEDIA);
      } else {
        storage.set(KEYS.ACTIVE_CAST_MEDIA, JSON.stringify(media));
      }
    } catch {}
  },

  clearActiveCastMedia(): void {
    try {
      storage.delete(KEYS.ACTIVE_CAST_MEDIA);
    } catch {}
  },


  // --- Watch Progress / History ---
  saveWatchProgress(progress: IWatchProgress): void {
    const itemToSave =
      progress.type === 'series' && progress.title
        ? { ...progress, title: cleanEpisodeDisplayTitle(progress.title) }
        : progress;
    const key = profileKey(`${KEYS.HISTORY_PREFIX}${itemToSave.id}`);
    storage.set(key, JSON.stringify(itemToSave));
  },

  getWatchProgress(contentId: string): IWatchProgress | null {
    try {
      const key = profileKey(`${KEYS.HISTORY_PREFIX}${contentId}`);
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
    storage.delete(profileKey(`${KEYS.HISTORY_PREFIX}${contentId}`));
    if (seriesId) {
      storage.delete(profileKey(`${KEYS.HISTORY_PREFIX}${seriesId}`));
    }

    const historyPrefix = profileKey(KEYS.HISTORY_PREFIX);
    const allKeys = storage.getAllKeys();
    const historyKeys = allKeys.filter((k) => k.startsWith(historyPrefix));
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
    const historyPrefix = profileKey(KEYS.HISTORY_PREFIX);
    const allKeys = storage.getAllKeys();
    const historyKeys = allKeys.filter((k) => k.startsWith(historyPrefix));
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
          // ignore corrupted entry
        }
      }
    }

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getContinueWatching(): IWatchProgress[] {
    const all = this.getAllWatchProgress();
    return all.filter(
      (item) =>
        !item.hiddenFromContinue &&
        (item.currentTime > 0 || item.percentage > 0 || item.updatedAt > 0) &&
        item.percentage < 98
    );
  },

  /**
   * Tira o item (e os episódios da mesma série) do "Continuar Assistindo" sem apagar
   * o progresso, para que a lista de episódios continue mostrando o que foi assistido.
   * Retorna os itens alterados.
   */
  hideFromContinueWatching(contentId: string, seriesId?: string): IWatchProgress[] {
    const ids = [String(contentId), ...(seriesId ? [String(seriesId)] : [])];
    const matches = (item: IWatchProgress) =>
      ids.includes(String(item.id)) || (item.seriesId != null && ids.includes(String(item.seriesId)));
    return this.markHiddenFromContinue(matches);
  },

  hideAllFromContinueWatching(type?: ContentType): IWatchProgress[] {
    return this.markHiddenFromContinue((item) => !type || item.type === type);
  },

  markHiddenFromContinue(predicate: (item: IWatchProgress) => boolean): IWatchProgress[] {
    const changed: IWatchProgress[] = [];
    for (const item of this.getAllWatchProgress()) {
      if (!item.hiddenFromContinue && predicate(item)) {
        const hidden = { ...item, hiddenFromContinue: true };
        this.saveWatchProgress(hidden);
        changed.push(hidden);
      }
    }
    return changed;
  },

  clearWatchHistory(type?: ContentType): void {
    const historyPrefix = profileKey(KEYS.HISTORY_PREFIX);
    const allKeys = storage.getAllKeys();
    const historyKeys = allKeys.filter((k) => k.startsWith(historyPrefix));
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

  // --- Profiles ---
  getActiveProfileId(): string {
    return activeProfileId;
  },

  setActiveProfileId(profileId: string): void {
    activeProfileId = profileId || DEFAULT_PROFILE_ID;
  },

  getProfiles(includeDeleted = false): IProfile[] {
    try {
      const raw = storage.getString(accountKey(KEYS.PROFILES));
      if (!raw) return [];
      const list = JSON.parse(raw) as IProfile[];
      const visible = includeDeleted ? list : list.filter((profile) => !profile.deleted);
      return visible.sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      return [];
    }
  },

  saveProfiles(profiles: IProfile[]): void {
    storage.set(accountKey(KEYS.PROFILES), JSON.stringify(profiles));
  },

  /** Apaga do aparelho o histórico e os favoritos de um perfil */
  deleteProfileData(profileId: string): void {
    if (!getAccountScopeCached()) return;
    const prefix = profileKey('', profileId);
    for (const key of storage.getAllKeys()) {
      if (key.startsWith(prefix)) {
        storage.delete(key);
      }
    }
  },

  // --- Cache do resumo de episódios por série (usado em "Novos episódios") ---
  getCachedSeriesSummary<T>(seriesId: string): { fetchedAt: number; data: T } | null {
    try {
      const raw = storage.getString(accountKey(`${KEYS.SERIES_EPISODES_PREFIX}${seriesId}`));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveCachedSeriesSummary<T>(seriesId: string, data: T): void {
    try {
      storage.set(
        accountKey(`${KEYS.SERIES_EPISODES_PREFIX}${seriesId}`),
        JSON.stringify({ fetchedAt: Date.now(), data })
      );
    } catch {
      // ignore
    }
  },

  // --- Acompanhamento de episódios novos por série (não expira) ---
  getSeriesTracking<T>(seriesId: string): T | null {
    try {
      const raw = storage.getString(accountKey(`${KEYS.SERIES_TRACKING_PREFIX}${seriesId}`));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  saveSeriesTracking<T>(seriesId: string, tracking: T): void {
    try {
      storage.set(accountKey(`${KEYS.SERIES_TRACKING_PREFIX}${seriesId}`), JSON.stringify(tracking));
    } catch {
      // ignore
    }
  },

  // --- Novidades: episódios novos já vistos no painel ou dispensados (por perfil) ---
  getNewEpisodesInbox(): { seen: string[]; dismissed: string[] } {
    try {
      const raw = storage.getString(profileKey(KEYS.NEW_EPISODES_INBOX));
      const parsed = raw ? JSON.parse(raw) : null;
      return { seen: parsed?.seen ?? [], dismissed: parsed?.dismissed ?? [] };
    } catch {
      return { seen: [], dismissed: [] };
    }
  },

  saveNewEpisodesInbox(inbox: { seen: string[]; dismissed: string[] }): void {
    storage.set(profileKey(KEYS.NEW_EPISODES_INBOX), JSON.stringify(inbox));
  },

  // --- Favorites ---
  getFavorites(): IFavoriteItem[] {
    try {
      const raw = storage.getString(profileKey(KEYS.FAVORITES));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as IFavoriteItem[];
      return parsed.sort((a, b) => b.addedAt - a.addedAt);
    } catch {
      return [];
    }
  },

  saveFavorites(favorites: IFavoriteItem[]): void {
    storage.set(profileKey(KEYS.FAVORITES), JSON.stringify(favorites));
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

    storage.set(profileKey(KEYS.FAVORITES), JSON.stringify(favorites));
    return isNowFavorite;
  },

  removeFavorite(contentId: string): void {
    const favorites = this.getFavorites().filter((item) => item.id !== contentId);
    storage.set(profileKey(KEYS.FAVORITES), JSON.stringify(favorites));
  },

  // --- Hidden Categories ---
  getHiddenCategories(type: ContentType): string[] {
    try {
      const raw = storage.getString(accountKey(`${KEYS.HIDDEN_CATEGORIES_PREFIX}${type}`));
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  },

  setHiddenCategories(type: ContentType, categoryIds: string[]): void {
    storage.set(accountKey(`${KEYS.HIDDEN_CATEGORIES_PREFIX}${type}`), JSON.stringify(categoryIds));
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
      const raw = storage.getString(accountKey(`${KEYS.HIDDEN_STREAMS_PREFIX}${type}`));
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  },

  setHiddenStreams(type: ContentType, streamIds: string[]): void {
    storage.set(accountKey(`${KEYS.HIDDEN_STREAMS_PREFIX}${type}`), JSON.stringify(streamIds));
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
      const raw = storage.getString(accountKey(`${KEYS.CUSTOM_FOLDERS_PREFIX}${type}`));
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
    storage.set(accountKey(`${KEYS.CUSTOM_FOLDERS_PREFIX}${folder.type}`), JSON.stringify(list));
  },

  setCustomFolders(type: ContentType, folders: ICustomCategoryFolder[]): void {
    storage.set(accountKey(`${KEYS.CUSTOM_FOLDERS_PREFIX}${type}`), JSON.stringify(folders));
  },

  deleteCustomFolder(type: ContentType, folderId: string): void {
    const list = this.getCustomFolders(type).filter((f) => f.id !== folderId);
    storage.set(accountKey(`${KEYS.CUSTOM_FOLDERS_PREFIX}${type}`), JSON.stringify(list));
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
    storage.set(accountKey(`${KEYS.CUSTOM_FOLDERS_PREFIX}${type}`), JSON.stringify(list));
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
        // Evitar estouro de limite de buffer no MMKV com listas massivas (> 5000 itens)
        return;
      }
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
}

export type StorageService = ReturnType<typeof createStorageService>;
