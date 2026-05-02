import { describe, it, expect } from 'vitest';
import {
  formatPct,
  getStreakClasses,
  getHistoryDotColor,
  sortStandings,
  buildRosterLink,
} from '../../src/lib/standings-utils';
import { mockFullStandings, mockZeroRecordStandings } from '../fixtures/standings';

describe('standings-utils', () => {
  // Covers: U-1 formatPct
  describe('formatPct', () => {
    it('0勝 0敗 → 回傳 "—"（避免誤導為 0.0%）', () => {
      expect(formatPct(0, 0)).toBe('—');
    });

    it('4勝 2敗 → 回傳 "66.7%"', () => {
      expect(formatPct(4, 2)).toBe('66.7%');
    });

    it('1勝 5敗 → 回傳 "16.7%"', () => {
      expect(formatPct(1, 5)).toBe('16.7%');
    });

    it('3勝 3敗 → 回傳 "50.0%"', () => {
      expect(formatPct(3, 3)).toBe('50.0%');
    });
  });

  // Covers: U-2 getStreakClasses
  describe('getStreakClasses', () => {
    it('win → 含 orange 文字色 + ↑ 箭頭', () => {
      const result = getStreakClasses('win');
      expect(result.colorClass).toMatch(/orange/);
      expect(result.arrow).toBe('↑');
    });

    it('lose → 含 紅色文字色 + ↓ 箭頭', () => {
      const result = getStreakClasses('lose');
      expect(result.colorClass).toMatch(/red/);
      expect(result.arrow).toBe('↓');
    });

    it('none → 預設灰色、無箭頭', () => {
      const result = getStreakClasses('none');
      expect(result.colorClass).toMatch(/gray|txt-mid/);
      expect(result.arrow).toBe('');
    });
  });

  // Covers: U-3 getHistoryDotColor
  describe('getHistoryDotColor', () => {
    it('W + 綠 → 回傳隊伍綠色 hex', () => {
      // 綠隊主色 #2e7d32（src/config/teams.ts）
      expect(getHistoryDotColor('W', '綠')).toBe('#2e7d32');
    });

    it('L + 任何隊 → 回傳灰色（不是隊伍主色）', () => {
      const grey = getHistoryDotColor('L', '綠');
      expect(grey).not.toBe('#2e7d32');
      expect(grey.toLowerCase()).toMatch(/^#[9ab][9ab][9ab]/i); // 灰系 hex（如 #9e9e9e / #aaa）
    });

    it('未知隊伍 → fallback 到灰（不 throw）', () => {
      expect(() => getHistoryDotColor('W', '紫')).not.toThrow();
    });
  });

  // Covers: U-4 sortStandings（identity，前端不重排）
  describe('sortStandings', () => {
    it('回傳順序與輸入完全一致（rank 由後台決定）', () => {
      const data = mockFullStandings();
      const sorted = sortStandings(data.teams);
      expect(sorted.map((t) => t.team)).toEqual(data.teams.map((t) => t.team));
    });

    it('勝率相同 rank 不同 → 仍照 rank 順序（不重排）', () => {
      const data = mockFullStandings(); // rank 3,4,5 都是 50.0%
      const sorted = sortStandings(data.teams);
      const ties = sorted.filter((t) => t.pct === '50.0%').map((t) => t.team);
      expect(ties).toEqual(['黑', '黃', '白']);
    });
  });

  // Covers: U-5 buildRosterLink
  describe('buildRosterLink', () => {
    it('綠隊 → /roster?team=green', () => {
      expect(buildRosterLink('綠')).toBe('/roster?team=green');
    });

    it('紅隊 → /roster?team=red', () => {
      expect(buildRosterLink('紅')).toBe('/roster?team=red');
    });

    it('未知隊伍 → fallback 到 /roster（無 query）', () => {
      expect(buildRosterLink('紫')).toBe('/roster');
    });
  });

  // Covers: U-1 邊界（zero-record 整體一致性）
  it('mockZeroRecordStandings 的所有隊 pct 都應為 "—"', () => {
    const data = mockZeroRecordStandings();
    data.teams.forEach((t) => {
      expect(formatPct(t.wins, t.losses)).toBe('—');
    });
  });
});
