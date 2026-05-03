/**
 * matchups-toggle-utils
 *
 * 共用「對戰組合 / 賽程順序」toggle 的工具函式。
 * 供 Issue #14 B1（home page MatchupsBlock）+ B7（schedule page）共用同一份邏輯。
 *
 * 提供：
 *  - resolveDefaultView：依 weekMatchups.games 智慧決定預設視圖
 *  - parseViewQuery：解析 URL `?view=combo|order`
 *  - updateViewQuery：寫回 URL（不重整頁面，SSR 安全）
 */

import type { WeekMatchups } from '../types/home';

export type MatchupView = 'combo' | 'order';

/**
 * 智慧預設邏輯：
 *  - weekMatchups 為 undefined → 'combo'（保底）
 *  - games[] 任一筆 home/away 非空 → 'order'
 *  - games[] 全部 home/away 為空 → 'combo'
 */
export function resolveDefaultView(weekMatchups: WeekMatchups | undefined): MatchupView {
  if (!weekMatchups) return 'combo';
  const anyPublished = weekMatchups.games.some((g) => g.home || g.away);
  return anyPublished ? 'order' : 'combo';
}

/**
 * 解析 URL query → MatchupView。
 * 無效值（含空字串、非 combo/order）回 null，呼叫端決定 fallback。
 */
export function parseViewQuery(search: string): MatchupView | null {
  const params = new URLSearchParams(search);
  const v = params.get('view');
  return v === 'combo' || v === 'order' ? v : null;
}

/**
 * 寫入 URL `?view=...`，不重整頁面。
 * SSR 環境（typeof window === 'undefined'）no-op，避免 ReferenceError。
 */
export function updateViewQuery(view: MatchupView): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('view', view);
  window.history.replaceState(null, '', url.toString());
}
