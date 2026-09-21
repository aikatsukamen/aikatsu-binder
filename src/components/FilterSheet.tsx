import { DEFAULT_FILTER } from '../domain/cards';
import type { CardFilter, OwnedFilter, SortKey } from '../domain/types';
import { patchFilter, settingsStore, useSettings } from '../store/settings';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  onClose: () => void;
  categories: string[];
  rarities: string[];
}

const OWNED: [OwnedFilter, string][] = [
  ['all', 'すべて'],
  ['owned', '所持'],
  ['missing', '未所持'],
  ['want', '求あり'],
  ['give', '出あり'],
];

const SORTS: [SortKey, string][] = [
  ['id-asc', 'ID 昇順'],
  ['id-desc', 'ID 降順'],
  ['rarity-desc', 'レアリティ 高い順'],
  ['rarity-asc', 'レアリティ 低い順'],
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full border-2 border-pink px-3.5 py-1.5 text-sm text-pink-d aria-pressed:bg-pink aria-pressed:text-white"
    >
      {children}
    </button>
  );
}

const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

export function FilterSheet({ open, onClose, categories, rarities }: Props) {
  const f = useSettings((s) => s.filter);
  const set = (patch: Partial<CardFilter>) => patchFilter(patch);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="絞り込み・並び替え"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-full border-2 border-pink py-2.5 font-extrabold text-pink-d"
            onClick={() =>
              settingsStore.set((s) => ({
                ...s,
                filter: { ...DEFAULT_FILTER, sort: s.filter.sort },
              }))
            }
          >
            条件をクリア
          </button>
          <button
            type="button"
            className="flex-1 rounded-full bg-pink py-2.5 font-extrabold text-white"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 font-extrabold">カード名・ID</h3>
          <input
            type="search"
            value={f.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="表示したいカード名など"
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-page-ink outline-none"
          />
        </section>
        <section>
          <h3 className="mb-2 font-extrabold">カード所持状態</h3>
          <div className="flex flex-wrap gap-2">
            {OWNED.map(([v, label]) => (
              <Chip key={v} active={f.owned === v} onClick={() => set({ owned: v })}>
                {label}
              </Chip>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-2 font-extrabold">部位</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip
                key={c}
                active={f.categories.includes(c)}
                onClick={() => set({ categories: toggle(f.categories, c) })}
              >
                {c}
              </Chip>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-2 font-extrabold">レアリティ</h3>
          <div className="flex flex-wrap gap-2">
            {rarities.map((r) => (
              <Chip
                key={r}
                active={f.rarities.includes(r)}
                onClick={() => set({ rarities: toggle(f.rarities, r) })}
              >
                {r}
              </Chip>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-2 font-extrabold">並び順</h3>
          <div className="flex flex-wrap gap-2">
            {SORTS.map(([v, label]) => (
              <Chip key={v} active={f.sort === v} onClick={() => set({ sort: v })}>
                {label}
              </Chip>
            ))}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
