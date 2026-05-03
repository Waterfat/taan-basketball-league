// tests/unit/roster-utils.test.ts
// Covers: U-1, U-2, U-3, U-4, U-5, U-6, U-7

import { describe, it, expect } from 'vitest';
import {
  getAttClass,
  getAttBgStyle,
  isAboveThreshold,
  formatPlayoff,
  computeAttendanceSummary,
} from '../../src/lib/roster-utils';
import type { AttValue } from '../../src/types/roster';

describe('getAttClass', () => {
  it('U-1/U-7: att=1 → contains att-present class', () => {
    expect(getAttClass(1)).toContain('att-present');
  });
  it('U-2/U-7: att=0 → contains att-absent class', () => {
    expect(getAttClass(0)).toContain('att-absent');
  });
  it('U-3/U-7: att="x" → contains att-excuse class', () => {
    expect(getAttClass('x')).toContain('att-excuse');
  });
  it('U-4/U-7: att="?" → contains att-unknown class', () => {
    expect(getAttClass('?')).toContain('att-unknown');
  });
});

describe('isAboveThreshold', () => {
  it('U-5: total > threshold → true', () => {
    expect(isAboveThreshold(37, 36)).toBe(true);
  });
  it('U-5: total === threshold → false（平民線含邊界）', () => {
    expect(isAboveThreshold(36, 36)).toBe(false);
  });
  it('U-5: total < threshold → false', () => {
    expect(isAboveThreshold(10, 36)).toBe(false);
  });
});

describe('formatPlayoff', () => {
  it('U-6: playoff=null → "—"', () => {
    expect(formatPlayoff(null)).toBe('—');
  });
  it('U-6: playoff=5 → "5"', () => {
    expect(formatPlayoff(5)).toBe('5');
  });
  it('U-6: playoff=0 → "0"', () => {
    expect(formatPlayoff(0)).toBe('0');
  });
});

describe('computeAttendanceSummary', () => {
  it('U-501a: att 全 1（共 6 場）→ rate=100, played=6, total=6', () => {
    const att: AttValue[] = [1, 1, 1, 1, 1, 1, '?', '?', '?', '?'];
    const result = computeAttendanceSummary(att);
    expect(result.played).toBe(6);
    expect(result.total).toBe(6);
    expect(result.rate).toBe(100);
  });

  it('U-501b: att=[1,0,1,1,1,1,?,?,?,?]（含 0）→ rate=83, played=5, total=6', () => {
    const att: AttValue[] = [1, 0, 1, 1, 1, 1, '?', '?', '?', '?'];
    const result = computeAttendanceSummary(att);
    expect(result.played).toBe(5);
    expect(result.total).toBe(6);
    expect(result.rate).toBe(83);
  });

  it('U-501c: att=[0,1,1,1,0,x,?,?,?,?]（含 x，x 計入 total 不計 played）→ rate=50, played=3, total=6', () => {
    const att: AttValue[] = [0, 1, 1, 1, 0, 'x', '?', '?', '?', '?'];
    const result = computeAttendanceSummary(att);
    expect(result.played).toBe(3);
    expect(result.total).toBe(6);
    expect(result.rate).toBe(50);
  });

  it('U-501d: att 全 ?（賽季尚未開始）→ rate=0, played=0, total=0', () => {
    const att: AttValue[] = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?'];
    const result = computeAttendanceSummary(att);
    expect(result.played).toBe(0);
    expect(result.total).toBe(0);
    expect(result.rate).toBe(0);
  });
});

describe('getAttBgStyle（隊伍主色）', () => {
  it('att=1 → returns team color CSS value', () => {
    const style = getAttBgStyle(1, '#e53935');
    expect(style.backgroundColor).toBe('#e53935');
  });
  it('att=0 → fixed red regardless of teamColor', () => {
    // 使用綠隊色，確認 att=0 不回傳 teamColor
    const style = getAttBgStyle(0, '#2e7d32');
    expect(style.backgroundColor).not.toBe('#2e7d32');
    expect(style.backgroundColor).toBeDefined();
  });
  it('att="?" → returns empty style（無 backgroundColor）', () => {
    const style = getAttBgStyle('?', '#e53935');
    expect(style.backgroundColor).toBeUndefined();
  });
});
