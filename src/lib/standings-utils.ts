import type { HistoryResult, StreakType, TeamStanding } from '../types/standings';
import { TEAM_CONFIG } from '../config/teams';

const GREY = '#999999';

export function formatPct(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return '—';
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export interface StreakStyle {
  colorClass: string;
  arrow: '↑' | '↓' | '';
}

export function getStreakClasses(type: StreakType): StreakStyle {
  if (type === 'win') return { colorClass: 'text-orange', arrow: '↑' };
  if (type === 'lose') return { colorClass: 'text-red-600', arrow: '↓' };
  return { colorClass: 'text-txt-mid', arrow: '' };
}

export function getHistoryDotColor(result: HistoryResult, teamId: string): string {
  if (result === 'L') return GREY;
  const team = TEAM_CONFIG[teamId];
  return team?.color ?? GREY;
}

/** 不重排，identity — 防止未來誤加排序 */
export function sortStandings(teams: TeamStanding[]): TeamStanding[] {
  return [...teams];
}

export function buildRosterLink(teamId: string): string {
  const team = TEAM_CONFIG[teamId];
  if (!team) return '/roster';
  return `/roster?team=${team.id}`;
}
