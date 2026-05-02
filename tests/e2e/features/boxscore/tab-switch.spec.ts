/**
 * /boxscore 頁面 — Sub-tab 切換 E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-11（切換 tab → URL 變更 + reload 仍停留）
 *   AC-13（?tab=leaders 直接進入）
 *   AC-13b（?tab=boxscore 直接進入）
 *   AC-14（無 query 進入 → 預設 leaders tab）
 *
 * 測試資料策略：mockBoxscoreAndLeaders() 攔截 Sheets API + GAS stats
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Sub-tab Switch @boxscore', () => {
  // ────── AC-14: 預設 leaders tab ──────
  test('AC-14: 無 query 進入 → 預設 leaders tab active', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore');

    const leadersTab = page.locator('[data-testid="sub-tab"][data-tab="leaders"]');
    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    await expect(leadersTab).toHaveAttribute('data-active', 'true');
    await expect(boxscoreTab).toHaveAttribute('data-active', 'false');
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
  });

  // ────── AC-13: ?tab=leaders 直接進入 ──────
  test('AC-13: /boxscore?tab=leaders 直接進入 → leaders tab', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="leaders"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
  });

  // ────── AC-13b: ?tab=boxscore 直接進入 ──────
  test('AC-13b: /boxscore?tab=boxscore 直接進入 → boxscore tab', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="boxscore-panel"]')).toBeVisible();
  });

  // ────── AC-11: 切換 tab 更新 URL + reload 仍停留 ──────
  test('AC-11: 切換 tab → URL 變更 + reload 仍停留', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore'); // leaders 預設

    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    await expect(async () => {
      await boxscoreTab.click();
      await expect(page).toHaveURL(/[?&]tab=boxscore(&|$)/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });

    // reload 仍在 boxscore
    await page.reload();
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');
  });
});
