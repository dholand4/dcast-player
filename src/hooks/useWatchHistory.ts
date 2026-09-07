import { useState, useCallback, useEffect } from 'react';
import { IWatchProgress } from '../@types/storage';
import { storageService } from '../services/storageService';

export function useWatchHistory() {
  const [continueWatching, setContinueWatching] = useState<IWatchProgress[]>(() => {
    try {
      return storageService.getContinueWatching();
    } catch {
      return [];
    }
  });

  const reload = useCallback(() => {
    try {
      const items = storageService.getContinueWatching();
      setContinueWatching(items);
    } catch {
      // ignore
    }
  }, []);

  const saveProgress = useCallback(
    (progress: IWatchProgress) => {
      storageService.saveWatchProgress(progress);
      reload();
    },
    [reload]
  );

  const getProgress = useCallback((contentId: string): IWatchProgress | null => {
    return storageService.getWatchProgress(contentId);
  }, []);

  const getAllWatchProgress = useCallback((): IWatchProgress[] => {
    try {
      return storageService.getAllWatchProgress();
    } catch {
      return [];
    }
  }, []);

  const removeProgress = useCallback(
    (contentId: string) => {
      storageService.removeWatchProgress(contentId);
      reload();
    },
    [reload]
  );

  return {
    continueWatching,
    saveProgress,
    getProgress,
    getAllWatchProgress,
    removeProgress,
    reload,
  };
}

