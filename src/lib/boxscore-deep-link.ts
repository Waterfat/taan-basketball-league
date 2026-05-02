export type BoxscoreTab = 'leaders' | 'boxscore';

export interface BoxscoreUrlState {
  tab: BoxscoreTab | null;
  week: number | null;
  game: number | null;
}

const VALID_TABS: ReadonlyArray<BoxscoreTab> = ['leaders', 'boxscore'];

function parsePositiveInt(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

/**
 * 從 location.search（或同等 query string）解析出 tab/week/game。
 * 不合法值 → null。
 *
 * Covers U-3
 */
export function parseBoxscoreQuery(search: string): BoxscoreUrlState {
  if (!search || (search === '?' )) return { tab: null, week: null, game: null };
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const tabRaw = params.get('tab');
  const tab = tabRaw && (VALID_TABS as ReadonlyArray<string>).includes(tabRaw) ? (tabRaw as BoxscoreTab) : null;

  const week = parsePositiveInt(params.get('week'));
  const game = parsePositiveInt(params.get('game'));

  // 若 tab 不合法，視同沒帶（保守策略）；但 week/game 仍可能單獨存在
  if (tabRaw !== null && tab === null) {
    return { tab: null, week: null, game: null };
  }

  return { tab, week, game };
}

/**
 * 由解析後 state 決定預設 active tab：
 *   - tab='leaders' → leaders
 *   - tab='boxscore' → boxscore
 *   - 無 tab 但有 week/game → boxscore（隱含切到逐場）
 *   - 都沒帶 → leaders（預設）
 *
 * Covers U-5, B-25, B-23, B-24
 */
export function resolveDefaultTab(state: BoxscoreUrlState): BoxscoreTab {
  if (state.tab) return state.tab;
  if (state.week !== null || state.game !== null) return 'boxscore';
  return 'leaders';
}

/**
 * 由 state 重建 URL（含 baseUrl）。
 * - leaders tab → 完全清除 query
 * - boxscore tab → 永遠帶 ?tab=boxscore；week/game 才帶該值
 *
 * Covers U-4, B-19, B-22
 */
export function buildBoxscoreUrl(baseUrl: string, state: BoxscoreUrlState): string {
  if (state.tab === 'leaders' || state.tab === null) {
    return baseUrl;
  }
  const params = new URLSearchParams();
  params.set('tab', 'boxscore');
  if (state.week !== null) params.set('week', String(state.week));
  if (state.game !== null) params.set('game', String(state.game));
  return `${baseUrl}?${params.toString()}`;
}
