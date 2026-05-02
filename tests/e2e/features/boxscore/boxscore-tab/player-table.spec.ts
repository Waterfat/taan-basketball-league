/**
 * /boxscore 頁面 — Boxscore Tab：Player Table E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-5（球員表格含 11 欄）
 *   AC-6（球員表格末尾顯示合計 row）
 *   AC-6b（DNP 球員不計入合計 row）[qa-v2 補充]
 *   AC-7（DNP 球員顯示灰色 + 「(未出賽)」標籤）
 *   AC-8（球員 row 不可點擊）
 *
 * DNP 合計驗證策略：
 *   AC-6b 使用單場含 DNP 的 fixture，確保合計只算出賽球員
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
  mockBoxscoreGame,
} from '../../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
  mockBoxscoreSheetsAPI,
  mockLeadersAPI,
} from '../../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Tab — Player Table @boxscore', () => {
  // ────── AC-5: 球員表格 11 欄 ──────
  test('AC-5: 球員表格含 11 欄（name/pts/fg2/fg3/ft/treb/ast/stl/blk/tov/pf）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstTable = page.locator('[data-testid="bs-team-table"]').first();
    const headers = firstTable.locator('thead th');
    await expect(headers).toHaveCount(11);
  });

  // ────── AC-6: 表格末尾合計 row ──────
  test('AC-6: 球員表格末尾顯示合計 row', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstTable = page.locator('[data-testid="bs-team-table"]').first();
    const totalsRow = firstTable.locator('[data-testid="bs-totals-row"]');
    await expect(totalsRow).toBeVisible();
    await expect(totalsRow).toContainText(/合計/);
  });

  // ────── [qa-v2 補充] DNP 球員不計入合計 ──────
  test('[qa-v2 補充] AC-6b: DNP 球員不計入合計 row', async ({ page }) => {
    // 使用單場 with DNP，確保合計只算出賽 5 名球員
    const game = mockBoxscoreGame(5, 1, { homeTeam: '紅', awayTeam: '白', homeScore: 34, awayScore: 22, withDnp: true });
    await mockBoxscoreSheetsAPI(page, [game]);
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore&week=5&game=1');

    const card = page.locator('[data-testid="bs-game-card"][data-game="1"]');
    const homeTable = card.locator('[data-testid="bs-team-table"][data-team="紅"]');
    const totalsRow = homeTable.locator('[data-testid="bs-totals-row"]');

    // 合計 pts 應等於 fixture 中 home.totals.pts
    await expect(totalsRow).toContainText(String(game.home.totals.pts));
  });

  // ────── AC-7: DNP 球員視覺處理 ──────
  test('AC-7: DNP 球員顯示灰色 + 「(未出賽)」標籤', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const dnpRow = page.locator('[data-testid="bs-player-row"][data-dnp="true"]').first();
    await expect(dnpRow).toBeVisible();
    await expect(dnpRow).toContainText(/未出賽|DNP/);
  });

  // ────── AC-8: 球員不可點 ──────
  test('AC-8: 球員 row 不可點擊（無連結，cursor 非 pointer）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const playerRow = page.locator('[data-testid="bs-player-row"][data-dnp="false"]').first();
    const cursor = await playerRow.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).not.toBe('pointer');

    // 不應該是 anchor
    const tagName = await playerRow.evaluate((el) => el.tagName);
    expect(tagName.toLowerCase()).not.toBe('a');
  });
});
