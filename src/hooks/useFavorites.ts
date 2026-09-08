import { useState, useCallback, useEffect } from 'react';
import { IFavoriteItem } from '../@types/storage';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';

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

  // Cloud sync on mount
  useEffect(() => {
    let isMounted = true;

    async function syncCloudFavorites() {
      try {
        const account = storageService.getAccount();
        if (!account) return;
        const userKey = supabaseService.getUserKey(account);
        if (!userKey || userKey === 'guest') return;

        const cloudFavs = await supabaseService.fetchFavoritesList(userKey);
        if (!isMounted || !cloudFavs) return;

        const currentLocal = storageService.getFavorites();
        let changed = false;

        // Merge cloud favorites into local storage
        for (const cloudItem of cloudFavs) {
          const existsLocally = currentLocal.some(
            (local) => String(local.id) === String(cloudItem.id)
          );
          if (!existsLocally) {
            currentLocal.push(cloudItem);
            changed = true;
          }
        }

        if (changed) {
          storageService.saveFavorites(currentLocal);
          if (isMounted) {
            reload();
            notifyFavoriteListeners();
          }
        }

        // Upload any local favorites not yet present in the cloud
        for (const localItem of currentLocal) {
          const inCloud = cloudFavs.some(
            (cf) => String(cf.id) === String(localItem.id)
          );
          if (!inCloud) {
            supabaseService.upsertFavorite(userKey, localItem);
          }
        }
      } catch {
        // ignore
      }
    }

    syncCloudFavorites();

    return () => {
      isMounted = false;
    };
  }, [reload]);

  const toggleFavorite = useCallback(
    (item: IFavoriteItem): boolean => {
      const isFav = storageService.toggleFavorite(item);
      notifyFavoriteListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
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
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
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
