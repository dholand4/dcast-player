import { useState, useCallback, useEffect } from 'react';
import { IWatchProgress, ContentType } from '../@types/storage';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { getActiveProfileCloudKey } from '../services/profileService';
import { claimSessionSync, releaseSessionSync } from '../utils/sessionSync';

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

const CLOUD_HISTORY_LIMIT = 100;

function uploadToCloud(items: IWatchProgress[]) {
  if (items.length === 0) return;
  try {
    const userKey = getActiveProfileCloudKey();
    if (userKey && userKey !== 'guest') {
      supabaseService.upsertWatchProgressBatch(userKey, items);
    }
  } catch {
    // ignore
  }
}

function isNewer(candidate: IWatchProgress, current?: IWatchProgress | null): boolean {
  if (!current) return true;
  if (candidate.updatedAt !== current.updatedAt) return candidate.updatedAt > current.updatedAt;
  // Mesmo progresso, mas removido do "Continuar Assistindo" em outro aparelho
  return Boolean(candidate.hiddenFromContinue) && !current.hiddenFromContinue;
}

async function syncCloudHistory(userKey: string) {
  const cloudItems = await supabaseService.fetchWatchProgressList(userKey);
  const cloudById = new Map(cloudItems.map((item) => [String(item.id), item]));

  let changed = false;
  for (const cloudItem of cloudItems) {
    const localItem = storageService.getWatchProgress(cloudItem.id);
    if (isNewer(cloudItem, localItem)) {
      // A URL do stream não vai para a nuvem; mantém a local se existir
      storageService.saveWatchProgress({ ...cloudItem, streamUrl: localItem?.streamUrl });
      changed = true;
    }
  }
  if (changed) {
    notifyHistoryListeners();
  }

  // Envia o que só existe (ou está mais novo) neste aparelho
  const localRecent = storageService.getAllWatchProgress().slice(0, CLOUD_HISTORY_LIMIT);
  const pending = localRecent.filter((local) => isNewer(local, cloudById.get(String(local.id))));
  if (pending.length > 0) {
    await supabaseService.upsertWatchProgressBatch(userKey, pending);
  }
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

  // Sincroniza com a nuvem uma vez por sessão (várias telas usam este hook)
  useEffect(() => {
    const userKey = getActiveProfileCloudKey();
    if (!userKey || userKey === 'guest') return;
    const syncKey = `history:${userKey}`;
    if (!claimSessionSync(syncKey)) return;

    syncCloudHistory(userKey).catch(() => releaseSessionSync(syncKey));
  }, []);

  const saveProgress = useCallback(
    (progress: IWatchProgress) => {
      storageService.saveWatchProgress(progress);
      reload();
      notifyHistoryListeners();
      uploadToCloud([progress]);
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

  const hideFromContinueWatching = useCallback(
    (contentId: string, seriesId?: string) => {
      const changed = storageService.hideFromContinueWatching(contentId, seriesId);
      reload();
      notifyHistoryListeners();
      uploadToCloud(changed);
    },
    [reload]
  );

  const hideAllFromContinueWatching = useCallback(
    (type?: ContentType) => {
      const changed = storageService.hideAllFromContinueWatching(type);
      reload();
      notifyHistoryListeners();
      uploadToCloud(changed);
    },
    [reload]
  );

  /** Marca como assistidos; o último da lista fica como o mais recente da série */
  const markAsWatched = useCallback(
    (items: IWatchProgress[]) => {
      const now = Date.now();
      const saved = items.map((item, index) => ({
        ...item,
        currentTime: item.duration > 0 ? item.duration : 1,
        percentage: 100,
        hiddenFromContinue: false,
        updatedAt: now - (items.length - 1 - index),
      }));
      saved.forEach((item) => storageService.saveWatchProgress(item));
      reload();
      notifyHistoryListeners();
      uploadToCloud(saved);
    },
    [reload]
  );

  // Zera o progresso sem apagar o registro, para a mudança sincronizar entre aparelhos
  const markAsUnwatched = useCallback(
    (items: IWatchProgress[]) => {
      const now = Date.now();
      const saved = items.map((item) => ({
        ...item,
        currentTime: 0,
        percentage: 0,
        hiddenFromContinue: true,
        updatedAt: now,
      }));
      saved.forEach((item) => storageService.saveWatchProgress(item));
      reload();
      notifyHistoryListeners();
      uploadToCloud(saved);
    },
    [reload]
  );

  return {
    continueWatching,
    markAsWatched,
    markAsUnwatched,
    saveProgress,
    getProgress,
    getAllWatchProgress,
    hideFromContinueWatching,
    hideAllFromContinueWatching,
    reload,
  };
}

