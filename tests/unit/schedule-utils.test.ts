import { describe, it, expect } from 'vitest';
import {
  getCurrentWeek,
  findPreviousWeekWithData,
  getWinner,
  isSuspended,
  hasStaff,
} from '../../src/lib/schedule-utils';
import {
  mockFullSchedule,
  mockEmptySchedule,
  mockFirstWeekOnly,
  mockGameWeek,
  mockSuspendedWeek,
  mockFinishedGame,
} from '../fixtures/schedule';

describe('schedule-utils', () => {
  // Covers: U-4 getCurrentWeek 邏輯
  describe('getCurrentWeek', () => {
    it('回傳 currentWeek 對應的 week 物件', () => {
      const data = mockFullSchedule(); // currentWeek = 5
      const week = getCurrentWeek(data);
      expect(week).not.toBeNull();
      expect(week?.type).toBe('game');
      if (week?.type === 'game') expect(week.week).toBe(5);
    });

    it('currentWeek 找不到對應 week → 回傳 null', () => {
      const data = { season: 25, currentWeek: 99, allWeeks: [mockGameWeek(1, '2026/1/10')] };
      expect(getCurrentWeek(data)).toBeNull();
    });

    it('allWeeks 為空 → 回傳 null', () => {
      expect(getCurrentWeek(mockEmptySchedule())).toBeNull();
    });
  });

  // Covers: U-3 找上一個有資料週的邏輯
  describe('findPreviousWeekWithData', () => {
    it('從 W6 往回找，跳過 suspended → 回傳 W5', () => {
      const data = mockFullSchedule();
      const prev = findPreviousWeekWithData(data, 6);
      expect(prev?.type).toBe('game');
      if (prev?.type === 'game') expect(prev.week).toBe(5);
    });

    it('第 1 週往回找 → 回傳 null', () => {
      const data = mockFirstWeekOnly();
      expect(findPreviousWeekWithData(data, 1)).toBeNull();
    });

    it('完全沒有 game 週 → 回傳 null', () => {
      const data = { season: 25, currentWeek: 1, allWeeks: [mockSuspendedWeek('2026/1/1', 'X')] };
      expect(findPreviousWeekWithData(data, 1)).toBeNull();
    });
  });

  // Covers: U-1 平手場次處理 + U-5 比分判斷
  describe('getWinner', () => {
    it('home 比分高 → home', () => {
      const game = mockFinishedGame('紅', '白', 34, 22);
      expect(getWinner(game)).toBe('home');
    });

    it('away 比分高 → away', () => {
      const game = mockFinishedGame('紅', '白', 22, 34);
      expect(getWinner(game)).toBe('away');
    });

    it('比分相同 → tie', () => {
      const game = mockFinishedGame('紅', '白', 22, 22);
      expect(getWinner(game)).toBe('tie');
    });

    it('未完賽（比分 null）→ none', () => {
      const game = {
        num: 1,
        time: '',
        home: '紅',
        away: '白',
        homeScore: null,
        awayScore: null,
        status: 'upcoming' as const,
        staff: {},
      };
      expect(getWinner(game)).toBe('none');
    });
  });

  // Covers: U-6 suspended week 偵測
  describe('isSuspended', () => {
    it('suspended week → true', () => {
      expect(isSuspended(mockSuspendedWeek('2026/2/14', '過年'))).toBe(true);
    });

    it('game week → false', () => {
      expect(isSuspended(mockGameWeek(1, '2026/1/10'))).toBe(false);
    });
  });

  // Covers: U-2 無 staff 資料時 toggle 邏輯（先放這裡，Task 5 也會引用）
  describe('hasStaff', () => {
    it('staff 物件有任一非空陣列 → true', () => {
      expect(hasStaff({ 裁判: ['李昊明(黑)'], 場務: [] })).toBe(true);
    });

    it('staff 物件全空 → false', () => {
      expect(hasStaff({ 裁判: [], 場務: [] })).toBe(false);
    });

    it('staff 為空物件 → false', () => {
      expect(hasStaff({})).toBe(false);
    });
  });
});
