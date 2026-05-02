// tests/unit/roster-utils.test.ts
// Covers: U-1, U-2, U-3, U-4, U-5, U-6, U-7

import { describe, it, expect } from 'vitest';
import { getAttClass, getAttBgStyle, isAboveThreshold, formatPlayoff } from '../../src/lib/roster-utils';

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
