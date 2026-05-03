// src/lib/leaders-format.ts
import type { LeaderCategory, LeaderData, LeaderEntry } from '../types/leaders';

export { LEADER_CATEGORIES_ORDERED } from '../types/leaders';

/**
 * 11 類個人領先榜中文標題（single source of truth）。
 * LeaderCard / LeadersPanel 統一引用此字典；不再 hardcode。
 *
 * Covers U-301
 */
export const CATEGORY_TITLES: Record<LeaderCategory, string> = {
  scoring: '得分王',
  rebound: '籃板王',
  assist: '助攻王',
  steal: '抄截王',
  block: '阻攻王',
  eff: '效率王',
  turnover: '失誤王',
  foul: '犯規王',
  p2pct: '2P%',
  p3pct: '3P%',
  ftpct: 'FT%',
};

/**
 * scoring 進階指標：「2P 55.6% / 3P 20.0% / FT 57.5%」
 * 缺值 → 「—」
 *
 * Covers U-6
 */
export function formatScoringAdvanced(e: LeaderEntry): string {
  const p2 = e.p2 ?? '—';
  const p3 = e.p3 ?? '—';
  const ft = e.ft ?? '—';
  return `2P ${p2} / 3P ${p3} / FT ${ft}`;
}

/**
 * rebound 進階指標：「OREB 2.5 / DREB 5.9」
 * 缺值 → 「—」
 *
 * Covers U-6
 */
export function formatReboundAdvanced(e: LeaderEntry): string {
  const off = e.off ?? '—';
  const def = e.def ?? '—';
  return `OREB ${off} / DREB ${def}`;
}

/**
 * 從 LeaderData 取最新賽季 key（數字最大）
 *
 * Covers U-6
 */
export function getCurrentSeasonKey(data: LeaderData): string | null {
  const keys = Object.keys(data);
  if (keys.length === 0) return null;
  const sorted = keys
    .map((k) => ({ k, n: Number(k) }))
    .filter((x) => Number.isFinite(x.n))
    .sort((a, b) => b.n - a.n);
  return sorted.length > 0 ? sorted[0].k : keys[0];
}

/**
 * 百分率類個人 leader 的 val 顯示格式：48.5 → 「48.5%」。
 * 用於 p2pct / p3pct / ftpct 三類，其他類沿用 toFixed(2)。
 *
 * Covers U-401
 */
export function formatPercentageVal(val: number): string {
  return `${val.toFixed(1)}%`;
}

/**
 * 判斷類別是否為百分率類（影響 val 顯示格式）。
 *
 * Covers U-401
 */
export function isPercentageCategory(cat: LeaderCategory): boolean {
  return cat === 'p2pct' || cat === 'p3pct' || cat === 'ftpct';
}
