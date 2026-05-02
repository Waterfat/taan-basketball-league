import type { AttValue, RosterTab } from '../types/roster';

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
