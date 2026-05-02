// tests/unit/roster-components.test.ts
// Covers: E-1（sub-tab aria-selected 驗收）

import { describe, it, expect } from 'vitest';
import { parseRosterQuery, resolveRosterTab } from '../../src/lib/roster-utils';

describe('resolveRosterTab', () => {
  it('無 tab param → "roster"（預設球員名單）', () => {
    expect(resolveRosterTab(null)).toBe('roster');
  });
  it('tab=dragon → "dragon"', () => {
    expect(resolveRosterTab('dragon')).toBe('dragon');
  });
});

describe('parseRosterQuery', () => {
  it('?tab=dragon → { tab: "dragon", team: null }', () => {
    expect(parseRosterQuery('?tab=dragon')).toEqual({ tab: 'dragon', team: null });
  });
  it('?team=red → { tab: null, team: "red" }', () => {
    expect(parseRosterQuery('?team=red')).toEqual({ tab: null, team: 'red' });
  });
  it('?tab=invalid → { tab: null, team: null }', () => {
    expect(parseRosterQuery('?tab=invalid')).toEqual({ tab: null, team: null });
  });
  it('空字串 → { tab: null, team: null }', () => {
    expect(parseRosterQuery('')).toEqual({ tab: null, team: null });
  });
});
