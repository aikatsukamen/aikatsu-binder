import { useEffect, useSyncExternalStore } from 'react';
import { normalizeCards } from '../domain/cards';
import type { Card, IndexJson, VersionFile, WorkMeta } from '../domain/types';
import { buildWorks } from '../domain/versions';

export const DATA_BASE = 'https://aikatsukamen.github.io/aikatsu-card-data/';

type Resource<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: Error };

const resources = new Map<string, Resource<unknown>>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

function load<T>(key: string, loader: () => Promise<T>) {
  const cur = resources.get(key);
  if (cur && cur.status !== 'error') return;
  resources.set(key, { status: 'loading' });
  emit();
  loader().then(
    (data) => {
      resources.set(key, { status: 'ready', data });
      emit();
    },
    (error: unknown) => {
      resources.set(key, {
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      emit();
    },
  );
}

const LOADING: Resource<never> = { status: 'loading' };

function useResource<T>(key: string | null, loader: () => Promise<T>): Resource<T> {
  const res = useSyncExternalStore(subscribe, () =>
    key ? ((resources.get(key) as Resource<T> | undefined) ?? LOADING) : LOADING,
  );
  useEffect(() => {
    if (key) load(key, loader);
    // loader は key に対して一意なので依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return res;
}

async function fetchJson<T>(path: string, cache: RequestCache = 'default'): Promise<T> {
  const res = await fetch(DATA_BASE + path, { cache });
  if (!res.ok) throw new Error(`${path} の取得に失敗しました (${res.status})`);
  return (await res.json()) as T;
}

let indexCache: { index: IndexJson; works: WorkMeta[] } | null = null;

async function loadIndex() {
  const index = await fetchJson<IndexJson>('index.json', 'no-cache');
  indexCache = { index, works: buildWorks(index) };
  return indexCache;
}

export const useIndex = () => useResource('index', loadIndex);

const hashOf = (versionId: string) =>
  indexCache?.index.files.find((f) => f.version_id === versionId)?.hash ?? '';

/** hash をクエリに付けて、更新があったときだけ取り直す */
const loadVersion = async (versionId: string) => {
  const file = await fetchJson<VersionFile>(`v/${versionId}.json?h=${hashOf(versionId)}`);
  return normalizeCards(file.cards);
};

export const useVersionCards = (versionId: string | null) =>
  useResource<Card[]>(versionId && indexCache ? `v:${versionId}` : null, () =>
    loadVersion(versionId!),
  );

/** 複数弾をまとめて読む（交換画面用） */
export function useManyVersionCards(versionIds: string[]): Map<string, Resource<Card[]>> {
  const joined = versionIds.join(',');
  const snapshot = useSyncExternalStore(subscribe, () => {
    const parts = versionIds.map((id) => resources.get(`v:${id}`)?.status ?? 'none');
    return parts.join(',');
  });
  useEffect(() => {
    if (!indexCache) return;
    for (const id of joined ? joined.split(',') : []) load(`v:${id}`, () => loadVersion(id));
  }, [joined]);
  void snapshot;
  return new Map(
    versionIds.map((id) => [id, (resources.get(`v:${id}`) as Resource<Card[]>) ?? LOADING]),
  );
}

/** マスターデータを取り直す */
export function reloadMaster() {
  resources.clear();
  indexCache = null;
  emit();
}
