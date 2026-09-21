import { resolveRarity } from './rarity';
import type { Card, CardFilter, Entry, RawCard } from './types';

export const cardKey = (versionId: string, cardId: string) => `${versionId}:${cardId}`;

/** 同じ弾内の同一 card_id は1枚として扱う（先勝ち） */
export function normalizeCards(raw: RawCard[]): Card[] {
  const seen = new Set<string>();
  const cards: Card[] = [];
  for (const c of raw) {
    if (seen.has(c.card_id)) continue;
    seen.add(c.card_id);
    const r = resolveRarity(c.rarity, c.rarity_code);
    cards.push({
      key: cardKey(c.version_id, c.card_id),
      versionId: c.version_id,
      cardId: c.card_id,
      name: c.name,
      rarityName: c.rarity ?? null,
      rarityAbbr: r.abbr,
      rarityTier: r.tier,
      category: c.category ?? null,
      brand: c.brand ?? null,
      idol: c.idol ?? null,
      image: c.image_card ?? null,
    });
  }
  return cards;
}

const idCollator = new Intl.Collator('ja', { numeric: true });
export const compareId = (a: Card, b: Card) => idCollator.compare(a.cardId, b.cardId);

export function sortCards(cards: Card[], sort: CardFilter['sort']): Card[] {
  const list = [...cards];
  switch (sort) {
    case 'id-asc':
      return list.sort(compareId);
    case 'id-desc':
      return list.sort((a, b) => compareId(b, a));
    case 'rarity-asc':
      return list.sort((a, b) => a.rarityTier - b.rarityTier || compareId(a, b));
    case 'rarity-desc':
      return list.sort((a, b) => b.rarityTier - a.rarityTier || compareId(a, b));
  }
}

export function filterCards(
  cards: Card[],
  filter: CardFilter,
  entryOf: (key: string) => Entry | undefined,
): Card[] {
  const q = filter.query.trim().toLowerCase();
  return cards.filter((c) => {
    if (filter.categories.length && !filter.categories.includes(c.category ?? '')) return false;
    if (filter.rarities.length && !filter.rarities.includes(c.rarityAbbr)) return false;
    if (q && !c.name.toLowerCase().includes(q) && !c.cardId.toLowerCase().includes(q)) return false;
    const e = entryOf(c.key);
    switch (filter.owned) {
      case 'owned':
        return (e?.own ?? 0) > 0;
      case 'missing':
        return (e?.own ?? 0) === 0;
      case 'want':
        return (e?.want ?? 0) > 0;
      case 'give':
        return (e?.give ?? 0) > 0;
      default:
        return true;
    }
  });
}

export const isFilterActive = (f: CardFilter) =>
  f.categories.length > 0 || f.rarities.length > 0 || f.query.trim() !== '' || f.owned !== 'all';

export const DEFAULT_FILTER: CardFilter = {
  categories: [],
  rarities: [],
  query: '',
  owned: 'all',
  sort: 'id-asc',
};

/** 部位の表示順 */
export const CATEGORY_ORDER = [
  'トップス',
  'ボトムス',
  'トップス＆ボトムス',
  'シューズ',
  'アクセサリー',
  'フルコーデ',
];
