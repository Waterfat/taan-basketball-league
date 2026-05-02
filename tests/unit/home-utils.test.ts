import { describe, it, expect } from 'vitest';
import { getStreakStyle, limitTop } from '../../src/lib/home-utils';

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
