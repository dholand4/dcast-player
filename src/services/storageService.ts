import { Paths, File } from 'expo-file-system';
import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { createStorageService, IStorageLike } from './storageCore';

export { DEFAULT_PROFILE_ID } from './storageCore';

const memoryStore = new Map<string, string>();

async function persistMemoryStoreAsync() {
  try {
    if (!Paths.document) return;
    const obj: Record<string, string> = {};
    memoryStore.forEach((v, k) => {
      obj[k] = v;
    });
    const file = new File(Paths.document, 'dcast_storage.json');
    if (!file.exists) {
      file.create();
    }
    file.write(JSON.stringify(obj));
  } catch {
    // ignore
  }
}

async function hydrateMemoryStoreAsync() {
  try {
    if (!Paths.document) return;
    const file = new File(Paths.document, 'dcast_storage.json');
    if (file.exists) {
      const content = await file.text();
      const obj = JSON.parse(content);
      Object.keys(obj).forEach((k) => {
        memoryStore.set(k, obj[k]);
      });
    }
  } catch {
    // ignore
  }
}

// Hydrate on module load
hydrateMemoryStoreAsync();

let storageImpl: IStorageLike;

const ENCRYPTION_KEY_NAME = 'dcast_storage_key';
const KEY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateEncryptionKey(): string {
  // MMKV aceita chaves de até 16 bytes
  return Array.from(Crypto.getRandomBytes(16), (byte) => KEY_ALPHABET[byte % KEY_ALPHABET.length]).join('');
}

// Credenciais e histórico ficam criptografados no aparelho; a chave fica no Keystore/Keychain
function createEncryptedStorage(): MMKV {
  let existingKey: string | null = null;
  try {
    existingKey = SecureStore.getItem(ENCRYPTION_KEY_NAME);
  } catch {
    // Keystore indisponível: segue sem criptografia
    return new MMKV();
  }
  if (existingKey) {
    return new MMKV({ id: 'mmkv.default', encryptionKey: existingKey });
  }

  // Primeira execução com criptografia: criptografa os dados já existentes
  const instance = new MMKV();
  try {
    const newKey = generateEncryptionKey();
    SecureStore.setItem(ENCRYPTION_KEY_NAME, newKey);
    instance.recrypt(newKey);
  } catch {
    SecureStore.deleteItemAsync(ENCRYPTION_KEY_NAME).catch(() => {});
  }
  return instance;
}

try {
  storageImpl = createEncryptedStorage();
} catch {
  // Fallback when running inside Expo Go without prebuilt native binaries
  storageImpl = {
    getString: (key) => memoryStore.get(key),
    set: (key, value) => {
      memoryStore.set(key, value);
      persistMemoryStoreAsync();
    },
    delete: (key) => {
      memoryStore.delete(key);
      persistMemoryStoreAsync();
    },
    getAllKeys: () => Array.from(memoryStore.keys()),
  };
}

export const storage = storageImpl;

export const storageService = createStorageService(storage);
