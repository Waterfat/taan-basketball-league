import { describe, it, expect } from 'vitest';
import {
  parseBoxscoreQuery,
  buildBoxscoreUrl,
  resolveDefaultTab,
  type BoxscoreUrlState,
} from '../../src/lib/boxscore-deep-link';

describe('parseBoxscoreQuery', () => {
  // Covers: U-3
  it('U-3a: 空 query → tab=null, week=null, game=null', () => {
    expect(parseBoxscoreQuery('')).toEqual({ tab: null, week: null, game: null });
  });

  // Covers: U-3
  it('U-3b: ?tab=leaders → 解析 tab', () => {
    expect(parseBoxscoreQuery('?tab=leaders')).toEqual({ tab: 'leaders', week: null, game: null });
  });

  // Covers: U-3
  it('U-3c: ?tab=boxscore&week=5&game=1 → 三欄都解析', () => {
    expect(parseBoxscoreQuery('?tab=boxscore&week=5&game=1')).toEqual({ tab: 'boxscore', week: 5, game: 1 });
  });

  // Covers: U-3
  it('U-3d: ?week=5&game=2（無 tab）→ tab=null, week=5, game=2', () => {
    expect(parseBoxscoreQuery('?week=5&game=2')).toEqual({ tab: null, week: 5, game: 2 });
  });

  // Covers: U-3
  it('U-3e: 不合法的 tab 值 → tab=null', () => {
    expect(parseBoxscoreQuery('?tab=invalid')).toEqual({ tab: null, week: null, game: null });
  });

  // Covers: U-3
  it('U-3f: 不合法的 week/game 數字 → 該欄 null', () => {
    expect(parseBoxscoreQuery('?week=abc&game=xyz')).toEqual({ tab: null, week: null, game: null });
  });
});

describe('resolveDefaultTab', () => {
  // Covers: U-5
  it('U-5a: 無 query → leaders（預設）', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery(''))).toBe('leaders');
  });

  // Covers: U-5
  it('U-5b: ?tab=leaders → leaders', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery('?tab=leaders'))).toBe('leaders');
  });

  // Covers: U-5
  it('U-5c: ?tab=boxscore → boxscore', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery('?tab=boxscore'))).toBe('boxscore');
  });

  // Covers: U-5
  it('U-5d: ?week=N&game=M（無 tab） → boxscore（隱含切到逐場）', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery('?week=5&game=1'))).toBe('boxscore');
  });

  // Covers: U-5
  it('U-5e: ?week=N（只有 week 沒 game） → boxscore（仍切到逐場）', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery('?week=5'))).toBe('boxscore');
  });
});

describe('buildBoxscoreUrl', () => {
  const base = '/boxscore';

  // Covers: U-4
  it('U-4a: leaders tab → 不帶任何 query', () => {
    const state: BoxscoreUrlState = { tab: 'leaders', week: null, game: null };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore');
  });

  // Covers: U-4
  it('U-4b: boxscore tab 無 week/game → ?tab=boxscore', () => {
    const state: BoxscoreUrlState = { tab: 'boxscore', week: null, game: null };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore?tab=boxscore');
  });

  // Covers: U-4
  it('U-4c: boxscore tab + week=5 → ?tab=boxscore&week=5', () => {
    const state: BoxscoreUrlState = { tab: 'boxscore', week: 5, game: null };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore?tab=boxscore&week=5');
  });

  // Covers: U-4
  it('U-4d: boxscore tab + week=5 + game=1 → ?tab=boxscore&week=5&game=1', () => {
    const state: BoxscoreUrlState = { tab: 'boxscore', week: 5, game: 1 };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore?tab=boxscore&week=5&game=1');
  });

  // Covers: U-4 / B-22
  it('U-4e: 從 boxscore 切回 leaders → 同時清除 week/game query', () => {
    const state: BoxscoreUrlState = { tab: 'leaders', week: 5, game: 1 };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore');
  });

  // Covers: U-4
  it('U-4f: baseUrl 帶尾斜線 → 不重複斜線', () => {
    const state: BoxscoreUrlState = { tab: 'boxscore', week: null, game: null };
    expect(buildBoxscoreUrl('/boxscore/', state)).toBe('/boxscore/?tab=boxscore');
  });
});
