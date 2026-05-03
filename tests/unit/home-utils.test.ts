import { describe, it, expect } from 'vitest';
import { getStreakStyle, limitTop, pickMiniStandings } from '../../src/lib/home-utils';
import type { HomeStandingTeam } from '../../src/types/home';

describe('getStreakStyle', () => {
  it('win → 橙色 class + ↑ arrow', () => {
    const result = getStreakStyle('win');
    expect(result.arrow).toBe('↑');
    expect(result.colorClass).toContain('orange');
  });

  it('lose → 紅色 class + ↓ arrow', () => {
    const result = getStreakStyle('lose');
    expect(result.arrow).toBe('↓');
    expect(result.colorClass).toContain('red');
  });

  it('null → arrow 為空字串（不顯示 icon）', () => {
    const result = getStreakStyle(null);
    expect(result.arrow).toBe('');
  });

  it('null → colorClass 不含 orange 也不含 red', () => {
    const result = getStreakStyle(null);
    expect(result.colorClass).not.toContain('orange');
    expect(result.colorClass).not.toContain('red');
  });
});

describe('limitTop', () => {
  it('超過指定數量時 slice', () => {
    expect(limitTop([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });

  it('剛好 n 筆不截斷', () => {
    expect(limitTop([1, 2, 3], 3)).toEqual([1, 2, 3]);
  });

  it('少於 n 筆時回傳現有，不報錯', () => {
    expect(limitTop([1], 3)).toEqual([1]);
  });

  it('空陣列回傳空陣列，不報錯', () => {
    expect(limitTop([], 5)).toEqual([]);
  });

  it('支援 object 型別', () => {
    const items = [{ name: 'A' }, { name: 'B' }];
    expect(limitTop(items, 5)).toHaveLength(2);
  });
});

/**
 * Issue #17 Task 4 — pickMiniStandings 排序工具
 *
 * Covers: U-2（B-19）— home-utils 從 composite shape 提取 miniStandings 排序
 */
describe('pickMiniStandings (Issue #17, Covers: U-2)', () => {
  it('取 top n 並依 rank 排序', () => {
    const full: HomeStandingTeam[] = [
      { rank: 3, name: '黑隊', team: '黑', record: '11-9', pct: '55.0%', history: [], streak: '', streakType: null },
      { rank: 1, name: '綠隊', team: '綠', record: '16-4', pct: '80.0%', history: [], streak: '2連勝', streakType: 'win' },
      { rank: 2, name: '紅隊', team: '紅', record: '15-5', pct: '75.0%', history: [], streak: '8連勝', streakType: 'win' },
    ];
    const result = pickMiniStandings(full, 2);
    expect(result.map((t) => t.rank)).toEqual([1, 2]);
  });

  it('n 大於陣列長度 → 全回傳（依 rank 排序）', () => {
    const full: HomeStandingTeam[] = [
      { rank: 2, name: 'B', team: 'B', record: '', pct: '', history: [], streak: '', streakType: null },
      { rank: 1, name: 'A', team: 'A', record: '', pct: '', history: [], streak: '', streakType: null },
    ];
    const result = pickMiniStandings(full, 10);
    expect(result.map((t) => t.rank)).toEqual([1, 2]);
  });

  it('空陣列 → 空陣列', () => {
    expect(pickMiniStandings([], 5)).toEqual([]);
  });

  it('不 mutate 原陣列', () => {
    const full: HomeStandingTeam[] = [
      { rank: 2, name: 'B', team: 'B', record: '', pct: '', history: [], streak: '', streakType: null },
      { rank: 1, name: 'A', team: 'A', record: '', pct: '', history: [], streak: '', streakType: null },
    ];
    const original = [...full];
    pickMiniStandings(full, 2);
    expect(full).toEqual(original);
  });
});
