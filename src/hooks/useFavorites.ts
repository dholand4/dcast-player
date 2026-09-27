import { useState, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { IFavoriteItem } from '../@types/storage';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { getActiveProfileCloudKey } from '../services/profileService';
import { mergeFavorites } from '../utils/favoritesMerge';
import { claimSessionSync, releaseSessionSync } from '../utils/sessionSync';

type FavoriteListener = () => void;
const favoriteListeners = new Set<FavoriteListener>();

function notifyFavoriteListeners() {
  favoriteListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore
    }
  });
}

// Evita sincronizações simultâneas e repetidas ao voltar para o app
const FOREGROUND_SYNC_INTERVAL_MS = 30000;
const inFlightSyncs = new Map<string, Promise<void>>();
const lastSyncAt = new Map<string, number>();

function isStillActiveProfile(userKey: string): boolean {
  return getActiveProfileCloudKey() === userKey;
}

async function syncCloudFavorites(userKey: string) {
  const cloudFavs = await supabaseService.fetchFavoritesList(userKey);
  // Falha de rede: não mexe em nada (senão pareceria que tudo foi removido)
  if (cloudFavs === null) throw new Error('favorites fetch failed');
  if (!isStillActiveProfile(userKey)) return;

  const currentLocal = storageService.getFavorites();
  const { merged, toUpload, toDelete } = mergeFavorites(
    currentLocal,
    cloudFavs,
    storageService.getFavoritesSyncedIds()
  );

  const localIds = currentLocal.map((item) => String(item.id)).sort().join('|');
  const mergedIds = merged.map((item) => String(item.id)).sort().join('|');
  if (localIds !== mergedIds) {
    storageService.saveFavorites(merged);
    notifyFavoriteListeners();
  }

  const cloudIds = new Set(cloudFavs.map((item) => String(item.id)));
  const syncedIds = new Set(merged.map((item) => String(item.id)).filter((id) => cloudIds.has(id)));

  await Promise.all([
    ...toUpload.map(async (item) => {
      if (await supabaseService.upsertFavorite(userKey, item)) syncedIds.add(String(item.id));
    }),
    // Se a remoção falhar, o ID continua na referência para tentar de novo na próxima vez
    ...toDelete.map(async (id) => {
      if (!(await supabaseService.removeFavorite(userKey, id))) syncedIds.add(id);
    }),
  ]);

  if (isStillActiveProfile(userKey)) {
    storageService.saveFavoritesSyncedIds(Array.from(syncedIds));
    lastSyncAt.set(userKey, Date.now());
  }
}

function requestFavoritesSync(userKey: string): Promise<void> {
  const running = inFlightSyncs.get(userKey);
  if (running) return running;
  const promise = syncCloudFavorites(userKey).finally(() => inFlightSyncs.delete(userKey));
  inFlightSyncs.set(userKey, promise);
  return promise;
}

/** Atualiza a referência de sincronização depois que a nuvem confirmou a mudança */
function markSynced(userKey: string, id: string, present: boolean) {
  if (!isStillActiveProfile(userKey)) return;
  const current = storageService.getFavoritesSyncedIds();
  if (current === null) return;
  const next = current.filter((existing) => existing !== String(id));
  if (present) next.push(String(id));
  storageService.saveFavoritesSyncedIds(next);
}

function pushFavoriteChange(item: Pick<IFavoriteItem, 'id'> & Partial<IFavoriteItem>, isFav: boolean) {
  try {
    const userKey = getActiveProfileCloudKey();
    if (!userKey || userKey === 'guest') return;
    const request = isFav
      ? supabaseService.upsertFavorite(userKey, item as IFavoriteItem)
      : supabaseService.removeFavorite(userKey, String(item.id));
    request
      .then((ok) => {
        if (ok) markSynced(userKey, String(item.id), isFav);
      })
      .catch(() => {});
  } catch {
    // ignore
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<IFavoriteItem[]>(() => {
    try {
      return storageService.getFavorites();
    } catch {
      return [];
    }
  });

  const reload = useCallback(() => {
    try {
      const list = storageService.getFavorites();
      setFavorites(list);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onUpdate = () => {
      reload();
    };
    favoriteListeners.add(onUpdate);
    return () => {
      favoriteListeners.delete(onUpdate);
    };
  }, [reload]);

  // Sincroniza com a nuvem uma vez por sessão (várias telas usam este hook)
  useEffect(() => {
    const userKey = getActiveProfileCloudKey();
    if (!userKey || userKey === 'guest') return;
    const syncKey = `favorites:${userKey}`;
    if (!claimSessionSync(syncKey)) return;

    requestFavoritesSync(userKey).catch(() => releaseSessionSync(syncKey));
  }, []);

  // Ao voltar para o app, busca de novo (outro aparelho pode ter mudado os favoritos)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const userKey = getActiveProfileCloudKey();
      if (!userKey || userKey === 'guest') return;
      if (Date.now() - (lastSyncAt.get(userKey) || 0) < FOREGROUND_SYNC_INTERVAL_MS) return;
      requestFavoritesSync(userKey).catch(() => {});
    });
    return () => subscription.remove();
  }, []);

  const toggleFavorite = useCallback(
    (item: IFavoriteItem): boolean => {
      const isFav = storageService.toggleFavorite(item);
      notifyFavoriteListeners();
      pushFavoriteChange(item, isFav);
      return isFav;
    },
    []
  );

  const isFavorite = useCallback(
    (id: string): boolean => {
      return favorites.some((item) => String(item.id) === String(id));
    },
    [favorites]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      storageService.removeFavorite(id);
      notifyFavoriteListeners();
      pushFavoriteChange({ id }, false);
    },
    []
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    reload,
  };
}
