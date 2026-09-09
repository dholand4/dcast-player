import { useState, useCallback, useEffect } from 'react';
import { ContentType, ICustomCategoryFolder } from '../@types/storage';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';

type CategoryManagerListener = () => void;
const listeners = new Set<CategoryManagerListener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore
    }
  });
}

export function useCategoryManager(type: ContentType = 'live') {
  const [hiddenCategories, setHiddenCategoriesState] = useState<string[]>(() => {
    try {
      return storageService.getHiddenCategories(type);
    } catch {
      return [];
    }
  });

  const [hiddenStreams, setHiddenStreamsState] = useState<string[]>(() => {
    try {
      return storageService.getHiddenStreams(type);
    } catch {
      return [];
    }
  });

  const [customFolders, setCustomFoldersState] = useState<ICustomCategoryFolder[]>(() => {
    try {
      return storageService.getCustomFolders(type);
    } catch {
      return [];
    }
  });

  const reload = useCallback(() => {
    try {
      setHiddenCategoriesState(storageService.getHiddenCategories(type));
      setHiddenStreamsState(storageService.getHiddenStreams(type));
      setCustomFoldersState(storageService.getCustomFolders(type));
    } catch {
      // ignore
    }
  }, [type]);

  useEffect(() => {
    reload();
  }, [reload, type]);

  useEffect(() => {
    const onUpdate = () => {
      reload();
    };
    listeners.add(onUpdate);
    return () => {
      listeners.delete(onUpdate);
    };
  }, [reload]);

  // Cloud sync on mount
  useEffect(() => {
    let isMounted = true;

    async function syncCloudCategoryData() {
      try {
        const account = storageService.getAccount();
        if (!account) return;
        const userKey = supabaseService.getUserKey(account);
        if (!userKey || userKey === 'guest') return;

        // 1. Sync Custom Folders
        const cloudFolders = await supabaseService.fetchCustomFoldersList(userKey, type);
        if (isMounted && cloudFolders) {
          const localFolders = storageService.getCustomFolders(type);
          let foldersChanged = false;

          for (const cf of cloudFolders) {
            const existingIdx = localFolders.findIndex((lf) => lf.id === cf.id);
            if (existingIdx === -1) {
              localFolders.push(cf);
              foldersChanged = true;
            } else if (cf.createdAt > (localFolders[existingIdx].createdAt || 0)) {
              localFolders[existingIdx] = cf;
              foldersChanged = true;
            }
          }

          if (foldersChanged) {
            storageService.setCustomFolders(type, localFolders);
            if (isMounted) {
              reload();
              notifyListeners();
            }
          }

          // Upload any local folders not yet in cloud
          for (const lf of localFolders) {
            const inCloud = cloudFolders.some((cf) => cf.id === lf.id);
            if (!inCloud) {
              supabaseService.upsertCustomFolder(userKey, lf);
            }
          }
        }

        // 2. Sync Hidden Categories & Streams
        const cloudHidden = await supabaseService.fetchHiddenItems(userKey, type);
        if (isMounted && cloudHidden) {
          const localCats = storageService.getHiddenCategories(type);
          const localStreams = storageService.getHiddenStreams(type);
          let hiddenChanged = false;

          const mergedCats = Array.from(new Set([...localCats, ...cloudHidden.hiddenCategories]));
          if (mergedCats.length !== localCats.length) {
            storageService.setHiddenCategories(type, mergedCats);
            hiddenChanged = true;
          }

          const mergedStreams = Array.from(new Set([...localStreams, ...cloudHidden.hiddenStreams]));
          if (mergedStreams.length !== localStreams.length) {
            storageService.setHiddenStreams(type, mergedStreams);
            hiddenChanged = true;
          }

          if (hiddenChanged && isMounted) {
            reload();
            notifyListeners();
          }
        }
      } catch {
        // ignore network error
      }
    }

    syncCloudCategoryData();

    return () => {
      isMounted = false;
    };
  }, [type, reload]);

  const toggleHideCategory = useCallback(
    (categoryId: string) => {
      const isHidden = storageService.toggleHideCategory(type, categoryId);
      notifyListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
        if (userKey && userKey !== 'guest') {
          const updatedCats = storageService.getHiddenCategories(type);
          const currentStreams = storageService.getHiddenStreams(type);
          supabaseService.upsertHiddenItems(userKey, type, updatedCats, currentStreams);
        }
      } catch {
        // ignore
      }
      return isHidden;
    },
    [type]
  );

  const isCategoryHidden = useCallback(
    (categoryId: string) => {
      return hiddenCategories.includes(String(categoryId));
    },
    [hiddenCategories]
  );

  const toggleHideStream = useCallback(
    (streamId: string) => {
      const isHidden = storageService.toggleHideStream(type, streamId);
      notifyListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
        if (userKey && userKey !== 'guest') {
          const currentCats = storageService.getHiddenCategories(type);
          const updatedStreams = storageService.getHiddenStreams(type);
          supabaseService.upsertHiddenItems(userKey, type, currentCats, updatedStreams);
        }
      } catch {
        // ignore
      }
      return isHidden;
    },
    [type]
  );

  const isStreamHidden = useCallback(
    (streamId: string) => {
      return hiddenStreams.includes(String(streamId));
    },
    [hiddenStreams]
  );

  const saveFolder = useCallback(
    (folder: ICustomCategoryFolder) => {
      storageService.saveCustomFolder(folder);
      notifyListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
        if (userKey && userKey !== 'guest') {
          supabaseService.upsertCustomFolder(userKey, folder);
        }
      } catch {
        // ignore
      }
    },
    []
  );

  const deleteFolder = useCallback(
    (folderId: string) => {
      storageService.deleteCustomFolder(type, folderId);
      notifyListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
        if (userKey && userKey !== 'guest') {
          supabaseService.removeCustomFolder(userKey, folderId);
        }
      } catch {
        // ignore
      }
    },
    [type]
  );

  const toggleStreamInFolder = useCallback(
    (folderId: string, streamId: string) => {
      const res = storageService.toggleStreamInCustomFolder(type, folderId, streamId);
      notifyListeners();

      try {
        const account = storageService.getAccount();
        const userKey = supabaseService.getUserKey(account);
        if (userKey && userKey !== 'guest') {
          const updatedFolder = storageService.getCustomFolders(type).find((f) => f.id === folderId);
          if (updatedFolder) {
            supabaseService.upsertCustomFolder(userKey, updatedFolder);
          }
        }
      } catch {
        // ignore
      }
      return res;
    },
    [type]
  );

  return {
    hiddenCategories,
    hiddenStreams,
    customFolders,
    toggleHideCategory,
    isCategoryHidden,
    toggleHideStream,
    isStreamHidden,
    saveFolder,
    deleteFolder,
    toggleStreamInFolder,
    reload,
  };
}
