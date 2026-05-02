import type { HomeStreakType } from '../types/home';

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
