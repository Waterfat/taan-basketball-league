/**
 * matchups-toggle-utils unit test
 *
 * 涵蓋 Issue #14 AC：
 *  - U-101：parseViewQuery 解析 URL query 字串
 *  - U-102：resolveDefaultView 智慧預設（games 全空 / games 有 / weekMatchups undefined）
 */

import { describe, it, expect } from 'vitest';
import { resolveDefaultView, parseViewQuery } from '../../src/lib/matchups-toggle-utils';
import { mockHomeWithWeekMatchups } from '../fixtures/home';

describe('matchups-toggle-utils', () => {
  it('U-102: games 全空 → combo', () => {
    const data = mockHomeWithWeekMatchups({ gamesPublished: false });
    expect(resolveDefaultView(data.weekMatchups)).toBe('combo');
  });

  it('U-102: games 有 home/away → order', () => {
    const data = mockHomeWithWeekMatchups({ gamesPublished: true });
    expect(resolveDefaultView(data.weekMatchups)).toBe('order');
  });

  it('U-102: weekMatchups undefined → combo（保底）', () => {
    expect(resolveDefaultView(undefined)).toBe('combo');
  });

  it('U-101: parseViewQuery 解析 ?view=combo / ?view=order / 無效 / 空字串', () => {
    expect(parseViewQuery('?view=combo')).toBe('combo');
    expect(parseViewQuery('?view=order')).toBe('order');
    expect(parseViewQuery('?view=invalid')).toBeNull();
    expect(parseViewQuery('')).toBeNull();
  });
});
