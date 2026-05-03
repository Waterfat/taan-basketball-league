import { describe, it, expect } from 'vitest';
import {
  CATEGORY_TITLES,
  LEADER_CATEGORIES_ORDERED,
  formatPercentageVal,
  formatScoringAdvanced,
  formatReboundAdvanced,
  getCurrentSeasonKey,
  isPercentageCategory,
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

describe('CATEGORY_TITLES + LEADER_CATEGORIES_ORDERED', () => {
  // Covers: U-301
  it('U-301a: LEADER_CATEGORIES_ORDERED 共 11 類，順序為既有 6 + 新 5', () => {
    expect(LEADER_CATEGORIES_ORDERED).toHaveLength(11);
    expect(LEADER_CATEGORIES_ORDERED).toEqual([
      'scoring', 'rebound', 'assist', 'steal', 'block', 'eff',
      'turnover', 'foul', 'p2pct', 'p3pct', 'ftpct',
    ]);
  });

  // Covers: U-301
  it('U-301b: 每一類 category 都有對應的 CATEGORY_TITLES 標題（非空字串）', () => {
    for (const cat of LEADER_CATEGORIES_ORDERED) {
      const title = CATEGORY_TITLES[cat];
      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);
    }
  });

  // Covers: U-301
  it('U-301c: 11 類 titles 對齊預期值', () => {
    expect(CATEGORY_TITLES.scoring).toBe('得分王');
    expect(CATEGORY_TITLES.rebound).toBe('籃板王');
    expect(CATEGORY_TITLES.assist).toBe('助攻王');
    expect(CATEGORY_TITLES.steal).toBe('抄截王');
    expect(CATEGORY_TITLES.block).toBe('阻攻王');
    expect(CATEGORY_TITLES.eff).toBe('效率王');
    expect(CATEGORY_TITLES.turnover).toBe('失誤王');
    expect(CATEGORY_TITLES.foul).toBe('犯規王');
    expect(CATEGORY_TITLES.p2pct).toBe('2P%');
    expect(CATEGORY_TITLES.p3pct).toBe('3P%');
    expect(CATEGORY_TITLES.ftpct).toBe('FT%');
  });
});

describe('formatPercentageVal + isPercentageCategory', () => {
  // Covers: U-401
  it('U-401a: formatPercentageVal(48.5) → "48.5%"', () => {
    expect(formatPercentageVal(48.5)).toBe('48.5%');
  });

  // Covers: U-401
  it('U-401b: formatPercentageVal 取小數一位（四捨五入）', () => {
    expect(formatPercentageVal(55)).toBe('55.0%');
    expect(formatPercentageVal(33.333)).toBe('33.3%');
    expect(formatPercentageVal(0)).toBe('0.0%');
    expect(formatPercentageVal(100)).toBe('100.0%');
  });

  // Covers: U-401
  it('U-401c: isPercentageCategory 僅對 p2pct / p3pct / ftpct 為 true', () => {
    expect(isPercentageCategory('p2pct')).toBe(true);
    expect(isPercentageCategory('p3pct')).toBe(true);
    expect(isPercentageCategory('ftpct')).toBe(true);
    expect(isPercentageCategory('scoring')).toBe(false);
    expect(isPercentageCategory('rebound')).toBe(false);
    expect(isPercentageCategory('assist')).toBe(false);
    expect(isPercentageCategory('steal')).toBe(false);
    expect(isPercentageCategory('block')).toBe(false);
    expect(isPercentageCategory('eff')).toBe(false);
    expect(isPercentageCategory('turnover')).toBe(false);
    expect(isPercentageCategory('foul')).toBe(false);
  });
});
