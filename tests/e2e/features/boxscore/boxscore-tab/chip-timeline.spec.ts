/**
 * /boxscore 頁面 — Boxscore Tab：Chip Timeline E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-2（進入 boxscore tab → chip timeline 顯示，預設當前週 active）
 *   AC-3（點另一週 chip → 顯示該週 6 場比賽）
 *
 * 資料說明：ALL_BOX_GAMES 涵蓋 W1/W5/W6，fetchBoxscore 解析後 currentWeek = max = 6
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Tab — Chip Timeline @boxscore', () => {
  // ────── AC-2: chip timeline 切週 + 預設當前週 ──────
  test('AC-2: 進入 boxscore tab → chip timeline 顯示，預設當前週 active', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const activeChip = page.locator('[data-testid="bs-week-chip"][data-active="true"]');
    // fetchBoxscore 解析後 currentWeek = max(weeks)，ALL_BOX_GAMES 涵蓋 W1/W5/W6 → 預設 W6 active
    await expect(activeChip).toContainText(/6/);
  });

  // ────── AC-3: 切換 chip → 該週 6 場 ──────
  test('AC-3: 點另一週 chip → 顯示該週 6 場比賽', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    await page.locator('[data-testid="bs-week-chip"][data-week="1"]').click();
    const cards = page.locator('[data-testid="bs-game-card"]');
    await expect(cards).toHaveCount(6);
  });
});
