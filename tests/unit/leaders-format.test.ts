import { describe, it, expect } from 'vitest';
import {
  formatScoringAdvanced,
  formatReboundAdvanced,
  getCurrentSeasonKey,
} from '../../src/lib/leaders-format';
import { mockLeaderEntry, mockFullLeaders, mockEmptyLeaders } from '../fixtures/leaders';

describe('formatScoringAdvanced', () => {
  // Covers: U-6
  it('U-6a: scoring entry 含 p2/p3/ft → 回傳「2P 55.6% / 3P 20.0% / FT 57.5%」格式', () => {
    const e = mockLeaderEntry('Alice', '紅', 9.55, { p2: '55.6%', p3: '20.0%', ft: '57.5%' });
    const formatted = formatScoringAdvanced(e);
    expect(formatted).toContain('2P');
    expect(formatted).toContain('55.6%');
    expect(formatted).toContain('3P');
    expect(formatted).toContain('20.0%');
    expect(formatted).toContain('FT');
    expect(formatted).toContain('57.5%');
  });

  // Covers: U-6
  it('U-6b: 缺欄位 → 缺的部分以「—」呈現或省略，不噴錯', () => {
    const e = mockLeaderEntry('Bob', '黑', 7);
    expect(() => formatScoringAdvanced(e)).not.toThrow();
    const formatted = formatScoringAdvanced(e);
    expect(typeof formatted).toBe('string');
  });
});

describe('formatReboundAdvanced', () => {
  // Covers: U-6
  it('U-6c: rebound entry 含 off/def → 回傳「OREB 2.5 / DREB 5.9」格式', () => {
    const e = mockLeaderEntry('Charlie', '藍', 8.4, { off: 2.5, def: 5.9 });
    const formatted = formatReboundAdvanced(e);
    expect(formatted).toContain('2.5');
    expect(formatted).toContain('5.9');
  });

  // Covers: U-6
  it('U-6d: 缺 off/def → 不噴錯', () => {
    const e = mockLeaderEntry('Dave', '黃', 7);
    expect(() => formatReboundAdvanced(e)).not.toThrow();
  });
});

describe('getCurrentSeasonKey', () => {
  it('U-6e: full leaders → 回傳最新賽季 key（"25"）', () => {
    expect(getCurrentSeasonKey(mockFullLeaders())).toBe('25');
  });

  it('U-6f: 空 LeaderData → null', () => {
    expect(getCurrentSeasonKey({})).toBeNull();
  });

  it('U-6g: 多賽季 → 回傳數字最大的 key', () => {
    const data = { '24': mockEmptyLeaders()['25'], '25': mockEmptyLeaders()['25'], '23': mockEmptyLeaders()['25'] };
    expect(getCurrentSeasonKey(data)).toBe('25');
  });
});
