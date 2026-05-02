/**
 * /boxscore 頁面 — Boxscore Tab：Game Cards E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-4（每場標題 + 雙隊表格 + 工作人員 collapsible 預設摺疊）
 *   AC-4b（點工作人員箭頭 → 展開/收起）
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

test.describe('Boxscore Tab — Game Cards @boxscore', () => {
  // ────── AC-4: 每場顯示標題 + 雙隊表格 + 工作人員 collapsible ──────
  test('AC-4: 每場標題 + 雙隊表格 + 工作人員 collapsible（預設摺疊）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstCard = page.locator('[data-testid="bs-game-card"]').first();
    await expect(firstCard.locator('[data-testid="bs-game-title"]')).toBeVisible();

    // 雙隊表格
    await expect(firstCard.locator('[data-testid="bs-team-table"]')).toHaveCount(2);

    // 工作人員預設摺疊
    const staffPanel = firstCard.locator('[data-testid="bs-staff-panel"]');
    await expect(staffPanel).toBeHidden();
    const toggle = firstCard.locator('[data-testid="bs-staff-toggle"]');
    await expect(toggle).toBeVisible();
  });

  // ────── AC-4b: 點 toggle 展開工作人員 ──────
  test('AC-4b: 點工作人員箭頭 → 展開/收起', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const card = page.locator('[data-testid="bs-game-card"]').first();
    const toggle = card.locator('[data-testid="bs-staff-toggle"]');
    const panel = card.locator('[data-testid="bs-staff-panel"]');

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/裁判/);

    await toggle.click();
    await expect(panel).toBeHidden();
  });
});
