import { useMemo, useState } from 'react';
import { CardImage } from '../components/CardImage';
import { Icon } from '../components/Icon';
import { compareId } from '../domain/cards';
import type { Card, WorkMeta } from '../domain/types';
import { shortWork } from '../domain/versions';
import { useManyVersionCards } from '../data/master';
import { useCollection } from '../store/collection';

type Mode = 'want' | 'give';
const MODE_LABEL: Record<Mode, string> = { want: '求', give: '出' };

interface Group {
  versionId: string;
  work: string;
  title: string;
  items: { card: Card; count: number }[];
}

export function TradeView({ works }: { works: WorkMeta[] }) {
  const [mode, setMode] = useState<Mode>('want');
  const [copied, setCopied] = useState(false);
  const collection = useCollection();

  const counts = useMemo(() => {
    const c = { want: 0, give: 0 };
    for (const e of Object.values(collection)) {
      c.want += e.want;
      c.give += e.give;
    }
    return c;
  }, [collection]);

  // 対象の弾（新しい順）
  const order = useMemo(() => works.flatMap((w) => w.versions), [works]);
  const versionIds = useMemo(() => {
    const ids = new Set(
      Object.entries(collection)
        .filter(([, e]) => e[mode] > 0)
        .map(([k]) => k.split(':')[0]!),
    );
    return order.filter((v) => ids.has(v.versionId)).map((v) => v.versionId);
  }, [collection, mode, order]);

  const loaded = useManyVersionCards(versionIds);
  const loading = [...loaded.values()].some((r) => r.status === 'loading');

  const groups: Group[] = versionIds.flatMap((id) => {
    const r = loaded.get(id);
    if (r?.status !== 'ready') return [];
    const meta = order.find((v) => v.versionId === id)!;
    const items = r.data
      .filter((c) => (collection[c.key]?.[mode] ?? 0) > 0)
      .sort(compareId)
      .map((card) => ({ card, count: collection[card.key]![mode] }));
    return items.length ? [{ versionId: id, work: meta.work, title: meta.title, items }] : [];
  });

  const text = [
    `【${MODE_LABEL[mode]}】`,
    ...groups.flatMap((g) => [
      `■${g.work} ${g.title}`,
      ...g.items.map(
        ({ card, count }) => `${card.cardId} ${card.rarityAbbr} ${card.name} ×${count}`,
      ),
    ]),
  ].join('\n');

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 md:px-5">
        <div className="flex rounded-full bg-cream p-1" role="tablist" aria-label="表示する一覧">
          {(['want', 'give'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className="rounded-full px-5 py-1.5 font-extrabold text-page-ink aria-selected:bg-pink aria-selected:text-white"
            >
              {MODE_LABEL[m]} <span className="tabular-nums">{counts[m]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          disabled={!groups.length}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-pink px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40"
        >
          <Icon name="copy" className="size-4" />
          {copied ? 'コピーしました' : 'テキストをコピー'}
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 md:px-5">
        {loading && <p className="py-4 text-center opacity-70">読み込み中…</p>}
        {!loading && groups.length === 0 && (
          <p className="py-10 text-center opacity-80">
            {mode === 'want'
              ? 'ほしいカードはまだありません。カードをタップして「求める」を入れると、ここに並びます。'
              : '交換に出せるカードはまだありません。カードをタップして「うち出せる」を入れると、ここに並びます。'}
          </p>
        )}
        {groups.length > 0 && (
          <div className="mx-auto max-w-4xl rounded-3xl bg-cream p-4 text-page-ink">
            {groups.map((g) => (
              <section key={g.versionId} className="mb-5 last:mb-0">
                <h3 className="mb-2 font-extrabold text-pink-d">
                  {shortWork(g.work)} {g.title}
                </h3>
                <ul className="grid grid-cols-4 gap-2 text-[12px] sm:grid-cols-6 lg:grid-cols-8">
                  {g.items.map(({ card, count }) => (
                    <li key={card.key} className="relative">
                      <CardImage card={card} className="aspect-[5/7] w-full" />
                      <span
                        className={`glow-badge ${mode === 'want' ? 'is-want' : 'is-give'} absolute right-1 bottom-1 text-lg`}
                      >
                        ×{count}
                      </span>
                      <span className="mt-0.5 block truncate text-center font-extrabold text-pink">
                        {card.cardId}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <pre className="mt-4 border-t-2 border-dashed border-dash/60 pt-3 font-sans text-sm leading-relaxed whitespace-pre-wrap select-text">
              {text}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
