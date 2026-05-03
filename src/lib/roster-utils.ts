import type { AttValue, RosterTab } from '../types/roster';

export interface AttendanceSummary {
  played: number;
  total: number;
  rate: number; // 0-100，整數
}

/**
 * 出席率計算：
 *  - played = att 中值為 1 的場次數
 *  - total = att 中值為 1 / 0 / 'x' 的場次數（已舉行的場次）
 *  - rate = round(played / total * 100)，total = 0 時 rate = 0
 *  - '?' 不計入（尚未舉行）
 */
export function computeAttendanceSummary(att: AttValue[]): AttendanceSummary {
  let played = 0;
  let total = 0;
  for (const v of att) {
    if (v === '?') continue;
    total++;
    if (v === 1) played++;
  }
  const rate = total === 0 ? 0 : Math.round((played / total) * 100);
  return { played, total, rate };
}

export function getAttClass(att: AttValue): string {
  switch (att) {
    case 1:   return 'att-present';
    case 0:   return 'att-absent';
    case 'x': return 'att-excuse';
    case '?': return 'att-unknown';
  }
}

export function getAttBgStyle(att: AttValue, teamColor: string): { backgroundColor?: string } {
  switch (att) {
    case 1:   return { backgroundColor: teamColor };
    case 0:   return { backgroundColor: '#e53935' };
    case 'x': return { backgroundColor: '#f9a825' };
    case '?': return {};
  }
}

export function isAboveThreshold(total: number, threshold: number): boolean {
  return total > threshold;
}

export function formatPlayoff(playoff: number | null): string {
  return playoff === null ? '—' : String(playoff);
}

export function parseRosterQuery(search: string): { tab: RosterTab | null; team: string | null } {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const tabRaw = params.get('tab');
  const tab: RosterTab | null =
    tabRaw === 'roster' || tabRaw === 'dragon' ? (tabRaw as RosterTab) : null;
  const team = params.get('team') ?? null;
  return { tab, team };
}

export function resolveRosterTab(tab: RosterTab | null): RosterTab {
  return tab ?? 'roster';
}
