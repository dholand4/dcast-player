import { useState, useCallback, useEffect } from 'react';
import { IFavoriteItem } from '../@types/storage';
import { storageService } from '../services/storageService';

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

  const toggleFavorite = useCallback(
    (item: IFavoriteItem): boolean => {
      const isFav = storageService.toggleFavorite(item);
      reload();
      return isFav;
    },
    [reload]
  );

  const isFavorite = useCallback((id: string): boolean => {
    return storageService.isFavorite(id);
  }, []);

  const removeFavorite = useCallback(
    (id: string) => {
      storageService.removeFavorite(id);
      reload();
    },
    [reload]
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    reload,
  };
}
