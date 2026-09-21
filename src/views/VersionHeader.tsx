import { useState, type ReactNode } from 'react';
import { FilterSheet } from '../components/FilterSheet';
import { Icon } from '../components/Icon';
import { VersionPicker } from '../components/VersionPicker';
import { DEFAULT_FILTER, isFilterActive } from '../domain/cards';
import type { CardFilter, WorkMeta } from '../domain/types';
import { patchFilter } from '../store/settings';

interface Props {
  works: WorkMeta[];
  versionId: string | null;
  onSelectVersion: (id: string) => void;
  total: number;
  owned: number;
  visible: number;
  filter: CardFilter;
  categories: string[];
  rarities: string[];
  extra?: ReactNode;
}

const OWNED_LABEL: Record<CardFilter['owned'], string> = {
  all: '',
  owned: '所持',
  missing: '未所持',
  want: '求あり',
  give: '出あり',
};

export function VersionHeader(p: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const meta = p.works.flatMap((w) => w.versions).find((v) => v.versionId === p.versionId);
  const f = p.filter;
  const active = isFilterActive(f);

  const chips: { label: string; clear: () => void }[] = [
    ...(f.query ? [{ label: `「${f.query}」`, clear: () => patchFilter({ query: '' }) }] : []),
    ...(f.owned !== 'all'
      ? [{ label: OWNED_LABEL[f.owned], clear: () => patchFilter({ owned: 'all' }) }]
      : []),
    ...f.categories.map((c) => ({
      label: c,
      clear: () => patchFilter({ categories: f.categories.filter((x) => x !== c) }),
    })),
    ...f.rarities.map((r) => ({
      label: r,
      clear: () => patchFilter({ rarities: f.rarities.filter((x) => x !== r) }),
    })),
  ];

  return (
    <header className="shrink-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1 md:px-5">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="min-w-0 flex-1 rounded-t-3xl bg-cream px-4 pt-2 pb-1 text-left"
          aria-haspopup="dialog"
        >
          <span className="block truncate text-xs text-pink-d">{meta?.work ?? '読み込み中'}</span>
          <span className="flex items-center gap-1">
            <span className="outline-title truncate text-2xl md:text-3xl">
              {meta?.title ?? '…'}
            </span>
            <Icon name="chevronDown" className="size-5 shrink-0 text-pink" />
          </span>
        </button>
        {p.extra}
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-tr-3xl rounded-b-3xl bg-pink px-3 py-2 text-sm text-white">
        <span className="rounded-lg bg-white/20 px-2.5 py-1 font-extrabold tabular-nums">
          {p.owned}/{p.total} 所持
        </span>
        {active && <span className="tabular-nums opacity-90">{p.visible}枚表示</span>}
        {chips.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={c.clear}
            className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-pink-d"
            aria-label={`${c.label} の条件を外す`}
          >
            {c.label}
            <Icon name="x" className="size-3.5" />
          </button>
        ))}
        {f.sort !== DEFAULT_FILTER.sort && (
          <span className="opacity-90">{f.sort.startsWith('rarity') ? 'レア順' : 'ID降順'}</span>
        )}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 font-extrabold hover:bg-white/20"
          aria-haspopup="dialog"
        >
          <Icon name="sliders" className="size-5" />
          <span className="hidden sm:inline">絞り込み</span>
        </button>
      </div>
      <VersionPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        works={p.works}
        current={p.versionId}
        onSelect={p.onSelectVersion}
      />
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={p.categories}
        rarities={p.rarities}
      />
    </header>
  );
}
