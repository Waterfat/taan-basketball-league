import { describe, it, expect } from 'vitest';
import { hasStaff } from '../../src/lib/schedule-utils';
import { mockFinishedGame } from '../fixtures/schedule';

describe('staff display logic (U-2)', () => {
  it('沒有 staff 資料 → toggle 不應該顯示', () => {
    const game = mockFinishedGame('紅', '白', 34, 22, 1, {});
    expect(hasStaff(game.staff)).toBe(false);
  });

  it('有 staff 資料（裁判 + 場務）→ toggle 應顯示', () => {
    const game = mockFinishedGame('紅', '白', 34, 22, 1, {
      裁判: ['李昊明(黑)'],
      場務: ['林毅豐(黑)'],
    });
    expect(hasStaff(game.staff)).toBe(true);
  });

  it('staff 物件存在但所有 key 都是空陣列 → toggle 不應顯示', () => {
    const game = mockFinishedGame('紅', '白', 34, 22, 1, {
      裁判: [],
      場務: [],
    });
    expect(hasStaff(game.staff)).toBe(false);
  });
});
