import { useState, useCallback, useEffect } from 'react';
import { IFavoriteItem, IFavoritesSyncState } from '../@types/storage';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { getActiveProfileCloudKey } from '../services/profileService';
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

function updateSyncState(change: (state: IFavoritesSyncState) => IFavoritesSyncState) {
  try {
    storageService.saveFavoritesSyncState(change(storageService.getFavoritesSyncState()));
  } catch {
    // ignore
  }
}

// Guarda a remoção até a nuvem confirmar, para ela não voltar na próxima sincronização
function trackLocalChange(id: string, isFavorite: boolean) {
  const itemId = String(id);
  updateSyncState((state) => ({
    // Só volta a contar como sincronizado quando a nuvem confirmar o envio
    syncedIds: state.syncedIds ? state.syncedIds.filter((syncedId) => syncedId !== itemId) : null,
    removedIds: isFavorite
      ? state.removedIds.filter((removedId) => removedId !== itemId)
      : Array.from(new Set([...state.removedIds, itemId])),
  }));
}

function uploadFavorite(userKey: string, item: IFavoriteItem) {
  supabaseService.upsertFavorite(userKey, item).then((saved) => {
    if (!saved) return;
    const itemId = String(item.id);
    // Já está na nuvem: se sumir de lá, foi removido em outro aparelho
    updateSyncState((state) =>
      state.syncedIds && !state.syncedIds.includes(itemId)
        ? { ...state, syncedIds: [...state.syncedIds, itemId] }
        : state
    );
  });
}

/**
 * Junta os favoritos do aparelho com os da nuvem respeitando remoções:
 * - item que estava na nuvem na última sincronização e sumiu foi removido em outro aparelho;
 * - item removido aqui continua sendo apagado da nuvem até ela confirmar;
 * - item que só existe aqui e nunca chegou à nuvem é enviado.
 */
async function syncCloudFavorites(userKey: string) {
  const cloudFavs = await supabaseService.fetchFavoritesList(userKey);
  if (!cloudFavs) {
    throw new Error('Favoritos da nuvem indisponíveis');
  }

  const { syncedIds, removedIds } = storageService.getFavoritesSyncState();
  const synced = syncedIds ? new Set(syncedIds) : null;
  const removed = new Set(removedIds);
  const cloudIds = new Set(cloudFavs.map((item) => String(item.id)));
  const local = storageService.getFavorites();
  const localIds = new Set(local.map((item) => String(item.id)));

  // Na primeira sincronização deste aparelho não há como saber o que foi removido em outro, então mantém
  const kept = local.filter((item) => cloudIds.has(String(item.id)) || !synced?.has(String(item.id)));
  const addedElsewhere = cloudFavs.filter(
    (item) => !localIds.has(String(item.id)) && !removed.has(String(item.id))
  );

  const merged = [...kept, ...addedElsewhere];
  if (addedElsewhere.length > 0 || kept.length !== local.length) {
    storageService.saveFavorites(merged);
    notifyFavoriteListeners();
  }

  storageService.saveFavoritesSyncState({
    syncedIds: merged.map((item) => String(item.id)).filter((id) => cloudIds.has(id)),
    removedIds: removedIds.filter((id) => cloudIds.has(id)),
  });

  for (const cloudItem of cloudFavs) {
    if (removed.has(String(cloudItem.id))) {
      supabaseService.removeFavorite(userKey, cloudItem.id);
    }
  }
  for (const localItem of kept) {
    if (!cloudIds.has(String(localItem.id))) {
      uploadFavorite(userKey, localItem);
    }
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

    syncCloudFavorites(userKey).catch(() => releaseSessionSync(syncKey));
  }, []);

  const toggleFavorite = useCallback(
    (item: IFavoriteItem): boolean => {
      const isFav = storageService.toggleFavorite(item);
      trackLocalChange(item.id, isFav);
      notifyFavoriteListeners();

      try {
        const userKey = getActiveProfileCloudKey();
        if (userKey && userKey !== 'guest') {
          if (isFav) {
            uploadFavorite(userKey, item);
          } else {
            supabaseService.removeFavorite(userKey, item.id);
          }
        }
      } catch {
        // ignore
      }
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
      trackLocalChange(id, false);
      notifyFavoriteListeners();

      try {
        const userKey = getActiveProfileCloudKey();
        if (userKey && userKey !== 'guest') {
          supabaseService.removeFavorite(userKey, id);
        }
      } catch {
        // ignore
      }
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
