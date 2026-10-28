import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const PREFIX = 'cartable:';

/** Ce dont le stockage a besoin du support persistant (AsyncStorage dans l'app, un faux dans les tests). */
export type StorageBackend = {
  getAllKeys(): Promise<readonly string[]>;
  multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

/**
 * Stockage clé-valeur de l'app. Tout est chargé en mémoire au démarrage (`load`), puis lu
 * sans attendre ; chaque écriture met à jour la mémoire tout de suite et le téléphone en arrière-plan.
 */
export function createStore(backend: StorageBackend) {
  const cache = new Map<string, unknown>();
  const listeners = new Set<() => void>();
  let version = 0;

  const changed = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };

  return {
    async load(): Promise<void> {
      const keys = (await backend.getAllKeys()).filter((key) => key.startsWith(PREFIX));
      for (const [key, raw] of await backend.multiGet(keys)) {
        if (raw === null) {
          continue;
        }
        try {
          cache.set(key.slice(PREFIX.length), JSON.parse(raw));
        } catch {
          // Une valeur illisible est ignorée : l'app repart comme si elle n'existait pas.
        }
      }
      changed();
    },
    get<T>(key: string): T | undefined {
      return cache.get(key) as T | undefined;
    },
    set<T>(key: string, value: T): void {
      cache.set(key, value);
      changed();
      backend.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
    },
    remove(key: string): void {
      cache.delete(key);
      changed();
      backend.removeItem(PREFIX + key).catch(() => {});
    },
    keys(): string[] {
      return [...cache.keys()];
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    version(): number {
      return version;
    },
  };
}

export type Store = ReturnType<typeof createStore>;

export const storage = createStore(AsyncStorage);

/**
 * Valeur stockée, et nouveau rendu du composant quand elle change. La valeur doit venir de
 * `useSyncExternalStore` lui-même : lue à côté, le React Compiler la mémoriserait et elle resterait figée.
 */
export function useStored<T>(key: string): T | undefined {
  const read = () => storage.get<T>(key);
  return useSyncExternalStore(storage.subscribe, read, read);
}
