import { useState, useCallback, useEffect } from 'react';
import { IFavoriteItem } from '../@types/storage';
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

async function syncCloudFavorites(userKey: string) {
  const cloudFavs = await supabaseService.fetchFavoritesList(userKey);
  const currentLocal = storageService.getFavorites();
  let changed = false;

  // Merge cloud favorites into local storage
  for (const cloudItem of cloudFavs) {
    const existsLocally = currentLocal.some((local) => String(local.id) === String(cloudItem.id));
    if (!existsLocally) {
      currentLocal.push(cloudItem);
      changed = true;
    }
  }

  if (changed) {
    storageService.saveFavorites(currentLocal);
    notifyFavoriteListeners();
  }

  // Upload any local favorites not yet present in the cloud
  for (const localItem of currentLocal) {
    const inCloud = cloudFavs.some((cf) => String(cf.id) === String(localItem.id));
    if (!inCloud) {
      supabaseService.upsertFavorite(userKey, localItem);
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
      notifyFavoriteListeners();

      try {
        const userKey = getActiveProfileCloudKey();
        if (userKey && userKey !== 'guest') {
          if (isFav) {
            supabaseService.upsertFavorite(userKey, item);
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
