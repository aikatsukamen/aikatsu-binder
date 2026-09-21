import { DEFAULT_FILTER } from '../domain/cards';
import type { CardFilter } from '../domain/types';
import { createPersistentStore, useStore } from './createStore';

export type ThemeSetting = 'auto' | 'light' | 'dark';
export type PerPage = 4 | 9;

export interface Settings {
  perPage: PerPage;
  theme: ThemeSetting;
  filter: CardFilter;
  lastVersion: string | null;
  recentVersions: string[];
  lastExportAt: string | null;
  registerMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  perPage: 4,
  theme: 'auto',
  filter: DEFAULT_FILTER,
  lastVersion: null,
  recentVersions: [],
  lastExportAt: null,
  registerMode: false,
};

export const SETTINGS_KEY = 'aikatsu-binder:settings:v1';

export const settingsStore = createPersistentStore<Settings>(
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  (raw) => {
    const s = (raw ?? {}) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...s,
      filter: { ...DEFAULT_FILTER, ...s.filter },
      perPage: s.perPage === 9 ? 9 : 4,
    };
  },
);

export const useSettings = <S>(selector: (s: Settings) => S) => useStore(settingsStore, selector);

export const patchSettings = (patch: Partial<Settings>) =>
  settingsStore.set((prev) => ({ ...prev, ...patch }));

export const patchFilter = (patch: Partial<CardFilter>) =>
  settingsStore.set((prev) => ({ ...prev, filter: { ...prev.filter, ...patch } }));

/** 開いた弾を記録（最近開いた弾 3件） */
export function rememberVersion(versionId: string) {
  settingsStore.set((prev) => {
    if (prev.lastVersion === versionId && prev.recentVersions[0] === versionId) return prev;
    return {
      ...prev,
      lastVersion: versionId,
      recentVersions: [versionId, ...prev.recentVersions.filter((v) => v !== versionId)].slice(
        0,
        3,
      ),
    };
  });
}
