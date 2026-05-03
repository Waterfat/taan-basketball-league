/**
 * Unit tests — standings-matrix-utils
 *
 * Coverage:
 *  - U-201：matrix cell 正/負/零/null 分類（getCellSign）+ 顯示文字（formatCellText）
 *  - U-202：cell sign → CSS class mapping（getCellClass）
 *
 * 不依賴 DOM；純函式單元測試。
 */

import { describe, it, expect } from 'vitest';
import {
  getCellSign,
  getCellClass,
  formatCellText,
} from '../../src/lib/standings-matrix-utils';
import { mockMatrix6x6 } from '../fixtures/standings';

describe('standings-matrix-utils — U-201 cell sign + formatCellText', () => {
  it('null cell → self / 「—」', () => {
    expect(getCellSign(null)).toBe('self');
    expect(formatCellText(null)).toBe('—');
  });

  it('正數 cell → positive / 帶 + 號', () => {
    expect(getCellSign(5)).toBe('positive');
    expect(getCellSign(1)).toBe('positive');
    expect(formatCellText(5)).toBe('+5');
    expect(formatCellText(15)).toBe('+15');
  });

  it('負數 cell → negative / 直接顯示負號', () => {
    expect(getCellSign(-3)).toBe('negative');
    expect(getCellSign(-1)).toBe('negative');
    expect(formatCellText(-8)).toBe('-8');
    expect(formatCellText(-15)).toBe('-15');
  });

  it('零 cell → zero / 顯示 「0」', () => {
    expect(getCellSign(0)).toBe('zero');
    expect(formatCellText(0)).toBe('0');
  });

  it('mockMatrix6x6 對角線 6 個 cell 全為 self', () => {
    const matrix = mockMatrix6x6();
    for (let i = 0; i < 6; i++) {
      expect(getCellSign(matrix.results[i]![i])).toBe('self');
    }
  });

  it('mockMatrix6x6 中至少含 1 個 positive、1 個 negative、1 個 zero', () => {
    const matrix = mockMatrix6x6();
    const flat = matrix.results.flat();
    expect(flat.some((c) => getCellSign(c) === 'positive')).toBe(true);
    expect(flat.some((c) => getCellSign(c) === 'negative')).toBe(true);
    expect(flat.some((c) => getCellSign(c) === 'zero')).toBe(true);
  });
});

describe('standings-matrix-utils — U-202 getCellClass mapping', () => {
  it('null → matrix-cell--self', () => {
    expect(getCellClass(null)).toBe('matrix-cell--self');
  });

  it('正數 → matrix-cell--positive', () => {
    expect(getCellClass(7)).toBe('matrix-cell--positive');
  });

  it('負數 → matrix-cell--negative', () => {
    expect(getCellClass(-4)).toBe('matrix-cell--negative');
  });

  it('零 → matrix-cell--zero', () => {
    expect(getCellClass(0)).toBe('matrix-cell--zero');
  });

  it('class 不互相重疊（同 cell 永遠單一 class）', () => {
    const cases: Array<{ cell: number | null; expected: string }> = [
      { cell: null, expected: 'matrix-cell--self' },
      { cell: 5, expected: 'matrix-cell--positive' },
      { cell: -5, expected: 'matrix-cell--negative' },
      { cell: 0, expected: 'matrix-cell--zero' },
    ];
    for (const { cell, expected } of cases) {
      const cls = getCellClass(cell);
      expect(cls).toBe(expected);
      expect(cls.split(' ')).toHaveLength(1);
    }
  });
});
