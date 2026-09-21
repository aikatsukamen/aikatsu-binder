import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get: () => T;
  set: (updater: T | ((prev: T) => T)) => void;
  subscribe: (fn: () => void) => () => void;
}

/** localStorage に永続化する最小のストア */
export function createPersistentStore<T>(
  storageKey: string,
  initial: T,
  revive: (raw: unknown) => T = (raw) => raw as T,
): Store<T> {
  let state = initial;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) state = revive(JSON.parse(raw));
  } catch {
    // 壊れたデータは初期値で上書きする
  }
  const listeners = new Set<() => void>();

  const set: Store<T>['set'] = (updater) => {
    const next = typeof updater === 'function' ? (updater as (p: T) => T)(state) : updater;
    if (Object.is(next, state)) return;
    state = next;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.error('保存に失敗しました', e);
    }
    listeners.forEach((l) => l());
  };

  // 別タブでの変更を反映
  window.addEventListener('storage', (e) => {
    if (e.key !== storageKey || !e.newValue) return;
    try {
      state = revive(JSON.parse(e.newValue));
      listeners.forEach((l) => l());
    } catch {
      // 無視
    }
  });

  return {
    get: () => state,
    set,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function useStore<T, S>(store: Store<T>, selector: (s: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}
