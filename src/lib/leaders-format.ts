// src/lib/leaders-format.ts
import type { LeaderData, LeaderEntry } from '../types/leaders';

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
