import { createStorageService, IStorageLike } from './storageCore';

export { DEFAULT_PROFILE_ID } from './storageCore';

const memoryStore = new Map<string, string>();

const isLocalStorageAvailable =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage: IStorageLike = {
  getString: (key: string): string | undefined => {
    if (isLocalStorageAvailable) {
      try {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : undefined;
      } catch {
        return memoryStore.get(key);
      }
    }
    return memoryStore.get(key);
  },
  set: (key: string, value: string): void => {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        memoryStore.set(key, value);
      }
    } else {
      memoryStore.set(key, value);
    }
  },
  delete: (key: string): void => {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        memoryStore.delete(key);
      }
    } else {
      memoryStore.delete(key);
    }
  },
  getAllKeys: (): string[] => {
    if (isLocalStorageAvailable) {
      try {
        return Object.keys(window.localStorage);
      } catch {
        return Array.from(memoryStore.keys());
      }
    }
    return Array.from(memoryStore.keys());
  },
};

export const storageService = createStorageService(storage);
