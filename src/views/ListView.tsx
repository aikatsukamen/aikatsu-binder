import { useState } from 'react';
import { CardImage } from '../components/CardImage';
import { CardSheet } from '../components/CardSheet';
import { Stepper } from '../components/Stepper';
import { reloadMaster } from '../data/master';
import type { Card, WorkMeta } from '../domain/types';
import { updateEntry, useEntry } from '../store/collection';
import { EmptyFilter, LoadError, Loading } from './Status';
import { useVersionView } from './useVersionView';
import { VersionHeader } from './VersionHeader';

interface Props {
  works: WorkMeta[];
  versionId: string;
  onSelectVersion: (id: string) => void;
}

export function ListView({ works, versionId, onSelectVersion }: Props) {
  const v = useVersionView(versionId);
  const [editing, setEditing] = useState<number | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VersionHeader
        works={works}
        versionId={versionId}
        onSelectVersion={onSelectVersion}
        total={v.cards.length}
        owned={v.ownedCount}
        visible={v.visible.length}
        filter={v.filter}
        categories={v.categories}
        rarities={v.rarities}
      />
      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-2 md:px-5">
        {v.res.status === 'loading' && <Loading />}
        {v.res.status === 'error' && <LoadError error={v.res.error} onRetry={reloadMaster} />}
        {v.res.status === 'ready' && v.visible.length === 0 && <EmptyFilter />}
        <ul className="mx-auto max-w-4xl divide-y-2 divide-dashed divide-dash/50 rounded-3xl bg-cream text-page-ink">
          {v.visible.map((c, i) => (
            <Row key={c.key} card={c} onOpen={() => setEditing(i)} />
          ))}
        </ul>
      </main>
      <CardSheet cards={v.visible} index={editing} onIndexChange={setEditing} />
    </div>
  );
}

function Row({ card, onOpen }: { card: Card; onOpen: () => void }) {
  const e = useEntry(card.key);
  const set = (field: 'own' | 'give' | 'want') => (n: number) =>
    updateEntry(card.key, () => ({ [field]: n }));
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 md:flex-nowrap">
      <button
        type="button"
        onClick={onOpen}
        className={`flex min-w-0 flex-1 items-center gap-3 text-left ${e.own ? '' : 'opacity-60'}`}
      >
        <CardImage card={card} className="aspect-[5/7] w-11 shrink-0 text-[10px]" />
        <span className="min-w-0">
          <span className="block text-sm font-extrabold text-pink">
            {card.cardId} {card.rarityAbbr}
          </span>
          <span className="block truncate">{card.name}</span>
          <span className="block truncate text-xs opacity-70">{card.category}</span>
        </span>
      </button>
      <div className="flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-4">
        {(
          [
            ['own', '所持', 999],
            ['give', '出', e.own],
            ['want', '求', 999],
          ] as const
        ).map(([field, label, max]) => (
          <div key={field} className="flex items-center gap-1">
            <span className="text-xs whitespace-nowrap opacity-70">{label}</span>
            <Stepper label={label} value={e[field]} max={max} onChange={set(field)} size="sm" />
          </div>
        ))}
      </div>
    </li>
  );
}
