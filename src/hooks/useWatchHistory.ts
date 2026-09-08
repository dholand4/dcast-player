import { useState, useCallback, useEffect } from 'react';
import { IWatchProgress, ContentType } from '../@types/storage';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';

type HistoryListener = () => void;
const historyListeners = new Set<HistoryListener>();

function notifyHistoryListeners() {
  historyListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore
    }
  });
}

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

  useEffect(() => {
    const onUpdate = () => {
      reload();
    };
    historyListeners.add(onUpdate);
    return () => {
      historyListeners.delete(onUpdate);
    };
  }, [reload]);

  // Cloud sync on mount
  useEffect(() => {
    let isMounted = true;

    async function syncCloudHistory() {
      try {
        const account = storageService.getAccount();
        if (!account) return;
        const userKey = supabaseService.getUserKey(account);
        if (!userKey || userKey === 'guest') return;

        const cloudItems = await supabaseService.fetchWatchProgressList(userKey);
        if (!isMounted || !cloudItems || cloudItems.length === 0) return;

        let changed = false;
        for (const cloudItem of cloudItems) {
          const localItem = storageService.getWatchProgress(cloudItem.id);
          if (!localItem || cloudItem.updatedAt > localItem.updatedAt) {
            storageService.saveWatchProgress(cloudItem);
            changed = true;
          }
        }

        if (changed && isMounted) {
          reload();
          notifyHistoryListeners();
        }
      } catch {
        // ignore
      }
    }

    syncCloudHistory();

    return () => {
      isMounted = false;
    };
  }, [reload]);

  const saveProgress = useCallback(
    (progress: IWatchProgress) => {
      storageService.saveWatchProgress(progress);
      reload();
      notifyHistoryListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
        if (userKey && userKey !== 'guest') {
          supabaseService.upsertWatchProgress(userKey, progress);
        }
      } catch {
        // ignore
      }
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
    (contentId: string, seriesId?: string) => {
      storageService.removeWatchProgress(contentId, seriesId);
      reload();
      notifyHistoryListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
        if (userKey && userKey !== 'guest') {
          supabaseService.removeWatchProgress(userKey, contentId, seriesId);
        }
      } catch {
        // ignore
      }
    },
    [reload]
  );

  const clearHistory = useCallback(
    (type?: ContentType) => {
      storageService.clearWatchHistory(type);
      reload();
      notifyHistoryListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
        if (userKey && userKey !== 'guest') {
          supabaseService.clearWatchProgress(userKey, type);
        }
      } catch {
        // ignore
      }
    },
    [reload]
  );

  return {
    continueWatching,
    saveProgress,
    getProgress,
    getAllWatchProgress,
    removeProgress,
    clearHistory,
    reload,
  };
}

