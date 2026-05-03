import type { HomeStandingTeam, HomeStreakType } from '../types/home';

export interface StreakStyle {
  colorClass: string;
  arrow: '' | '↑' | '↓';
}

export function getStreakStyle(type: HomeStreakType): StreakStyle {
  if (type === 'win') return { colorClass: 'text-orange', arrow: '↑' };
  if (type === 'lose') return { colorClass: 'text-red-600', arrow: '↓' };
  return { colorClass: 'text-txt-mid', arrow: '' };
}

/** slice 並在長度不足時安全回傳現有（不報錯，不補空白佔位） */
export function limitTop<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

/**
 * 從完整 standings 取 top n，依 rank 升冪排序（Issue #17 U-2）。
 *
 * 不 mutate 原陣列；rank 排序後 slice。
 */
export function pickMiniStandings(full: HomeStandingTeam[], n: number): HomeStandingTeam[] {
  return [...full].sort((a, b) => a.rank - b.rank).slice(0, n);
}
