/** aikatsu-card-data の v/*.json に入っているカード1件（使う項目のみ） */
export interface RawCard {
  version_id: string;
  series_title: string;
  card_id: string;
  name: string;
  type?: string | null;
  rarity?: string | null;
  rarity_code?: string | null;
  category?: string | null;
  brand?: string | null;
  idol?: string | null;
  appeal_point?: number | null;
  image_card?: string | null;
  is_parallel?: boolean | null;
}

export interface VersionFile {
  version_id: string;
  work: string;
  series_title: string;
  count: number;
  cards: RawCard[];
}

export interface IndexFileEntry {
  path: string;
  kind: string;
  version_id?: string;
  work?: string;
  series_title?: string;
  count?: number;
  hash: string;
  updated_at: string;
}

export interface IndexJson {
  generated_at: string;
  works: { work: string; versions: string[] }[];
  files: IndexFileEntry[];
}

/** アプリ内で扱うカード */
export interface Card {
  /** 所持データのキー: `${versionId}:${cardId}` */
  key: string;
  versionId: string;
  cardId: string;
  name: string;
  rarityName: string | null;
  rarityAbbr: string;
  rarityTier: number;
  category: string | null;
  brand: string | null;
  idol: string | null;
  image: string | null;
}

export interface VersionMeta {
  versionId: string;
  work: string;
  title: string;
  count: number;
  hash: string;
  /** プロモ・特別弾以外 */
  isRegular: boolean;
}

export interface WorkMeta {
  work: string;
  versions: VersionMeta[];
}

/** ユーザーが入力する1カード分の数 */
export interface Entry {
  own: number;
  give: number;
  want: number;
}

export type OwnedFilter = 'all' | 'owned' | 'missing' | 'want' | 'give';
export type SortKey = 'id-asc' | 'id-desc' | 'rarity-asc' | 'rarity-desc';

export interface CardFilter {
  categories: string[];
  rarities: string[];
  query: string;
  owned: OwnedFilter;
  sort: SortKey;
}
