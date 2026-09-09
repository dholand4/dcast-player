import { useState, useCallback, useEffect } from 'react';
import { ContentType, ICustomCategoryFolder } from '../@types/storage';
import { storageService } from '../services/storageService';

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

  const toggleHideCategory = useCallback(
    (categoryId: string) => {
      const isHidden = storageService.toggleHideCategory(type, categoryId);
      notifyListeners();
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
    },
    []
  );

  const deleteFolder = useCallback(
    (folderId: string) => {
      storageService.deleteCustomFolder(type, folderId);
      notifyListeners();
    },
    [type]
  );

  const toggleStreamInFolder = useCallback(
    (folderId: string, streamId: string) => {
      const res = storageService.toggleStreamInCustomFolder(type, folderId, streamId);
      notifyListeners();
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
