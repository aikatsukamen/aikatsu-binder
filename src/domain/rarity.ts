/**
 * レアリティの段（数値が大きいほど高い）
 * N < R = FR = CP < PR = BFR < JLR = SPR = LPR = SEC = ER
 */
const RARITY_TABLE: Record<string, { abbr: string; tier: number }> = {
  ノーマル: { abbr: 'N', tier: 0 },
  レア: { abbr: 'R', tier: 1 },
  フレンズレア: { abbr: 'FR', tier: 1 },
  キャンペーンレア: { abbr: 'CP', tier: 1 },
  プレミアムレア: { abbr: 'PR', tier: 2 },
  ベストフレンズレア: { abbr: 'BFR', tier: 2 },
  ジュエリングレア: { abbr: 'JLR', tier: 3 },
  スタープレミアムレア: { abbr: 'SPR', tier: 3 },
  レジェンドプレミアムレア: { abbr: 'LPR', tier: 3 },
  シークレットプレミアムレア: { abbr: 'SEC', tier: 3 },
  アンコールレア: { abbr: 'ER', tier: 3 },
};

/** レアリティ不明。最下位扱い */
export const UNKNOWN_TIER = -1;

export function resolveRarity(
  name: string | null | undefined,
  code: string | null | undefined,
): { abbr: string; tier: number } {
  const hit = name ? RARITY_TABLE[name] : undefined;
  if (hit) return hit;
  if (code) {
    const byCode = Object.values(RARITY_TABLE).find((r) => r.abbr === code);
    return { abbr: code, tier: byCode?.tier ?? UNKNOWN_TIER };
  }
  return { abbr: name ?? '', tier: UNKNOWN_TIER };
}
