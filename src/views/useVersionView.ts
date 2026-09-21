import { useMemo } from 'react';
import { CATEGORY_ORDER, filterCards, sortCards } from '../domain/cards';
import type { Card } from '../domain/types';
import { useVersionCards } from '../data/master';
import { useCollection } from '../store/collection';
import { useSettings } from '../store/settings';

/** 弾のカード・絞り込み結果・集計をまとめて返す */
export function useVersionView(versionId: string | null) {
  const res = useVersionCards(versionId);
  const collection = useCollection();
  const filter = useSettings((s) => s.filter);
  const cards: Card[] = useMemo(() => (res.status === 'ready' ? res.data : []), [res]);

  const visible = useMemo(
    () =>
      sortCards(
        filterCards(cards, filter, (k) => collection[k]),
        filter.sort,
      ),
    [cards, filter, collection],
  );

  const ownedCount = useMemo(
    () => cards.filter((c) => (collection[c.key]?.own ?? 0) > 0).length,
    [cards, collection],
  );

  const categories = useMemo(() => {
    const set = new Set(cards.map((c) => c.category ?? ''));
    set.delete('');
    const order = (c: string) => {
      const i = CATEGORY_ORDER.indexOf(c);
      return i < 0 ? 99 : i;
    };
    return [...set].sort((a, b) => order(a) - order(b));
  }, [cards]);

  const rarities = useMemo(() => {
    const m = new Map<string, number>();
    cards.forEach((c) => c.rarityAbbr && m.set(c.rarityAbbr, c.rarityTier));
    return [...m.entries()].sort((a, b) => a[1] - b[1]).map(([r]) => r);
  }, [cards]);

  return { res, cards, visible, ownedCount, categories, rarities, filter };
}
