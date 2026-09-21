import type { Entry } from '../domain/types';
import { createPersistentStore, useStore } from './createStore';

export type Collection = Record<string, Entry>;

const STORAGE_KEY = 'aikatsu-binder:collection:v1';
export const EXPORT_SCHEMA = 1;
const EMPTY: Entry = { own: 0, give: 0, want: 0 };

const toInt = (v: unknown) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 999) : 0;
};

/** 値を整える。全部 0 なら undefined（保存しない） */
export function normalizeEntry(e: Partial<Entry>): Entry | undefined {
  const own = toInt(e.own);
  const give = Math.min(toInt(e.give), own);
  const want = toInt(e.want);
  return own || give || want ? { own, give, want } : undefined;
}

function reviveCollection(raw: unknown): Collection {
  const out: Collection = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, Partial<Entry>>)) {
      const e = normalizeEntry(v ?? {});
      if (e) out[k] = e;
    }
  }
  return out;
}

export const collectionStore = createPersistentStore<Collection>(STORAGE_KEY, {}, reviveCollection);

export const useEntry = (key: string): Entry => useStore(collectionStore, (s) => s[key]) ?? EMPTY;

export const useCollection = () => useStore(collectionStore, (s) => s);

export function updateEntry(key: string, patch: (prev: Entry) => Partial<Entry>) {
  collectionStore.set((prev) => {
    const cur = prev[key] ?? EMPTY;
    const next = normalizeEntry({ ...cur, ...patch(cur) });
    const copy = { ...prev };
    if (next) copy[key] = next;
    else delete copy[key];
    return copy;
  });
  requestPersist();
}

/** iOS Safari 等でストレージが消されにくくする（1回だけ） */
let persistRequested = false;
function requestPersist() {
  if (persistRequested) return;
  persistRequested = true;
  void navigator.storage?.persist?.();
}

export interface ExportFile {
  app: 'aikatsu-binder';
  schema: number;
  exportedAt: string;
  entries: Collection;
}

export function buildExport(): ExportFile {
  return {
    app: 'aikatsu-binder',
    schema: EXPORT_SCHEMA,
    exportedAt: new Date().toISOString(),
    entries: collectionStore.get(),
  };
}

export function parseImport(text: string): Collection {
  const json = JSON.parse(text) as Partial<ExportFile>;
  if (json.app !== 'aikatsu-binder' || typeof json.entries !== 'object' || !json.entries) {
    throw new Error('このアプリで書き出したファイルではありません');
  }
  if ((json.schema ?? 0) > EXPORT_SCHEMA) {
    throw new Error('新しいバージョンで書き出されたファイルです。ページを再読み込みしてください');
  }
  return reviveCollection(json.entries);
}

export type ImportMode = 'overwrite' | 'merge';

export function applyImport(data: Collection, mode: ImportMode) {
  if (mode === 'overwrite') {
    collectionStore.set(data);
    return;
  }
  collectionStore.set((prev) => {
    const out = { ...prev };
    for (const [k, v] of Object.entries(data)) {
      const cur = out[k] ?? EMPTY;
      const merged = normalizeEntry({
        own: Math.max(cur.own, v.own),
        give: Math.max(cur.give, v.give),
        want: Math.max(cur.want, v.want),
      });
      if (merged) out[k] = merged;
    }
    return out;
  });
}
