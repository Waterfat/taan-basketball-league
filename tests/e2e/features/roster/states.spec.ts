/**
 * /roster 頁面 — Three-State（Loading / Error / Empty）E2E
 *
 * @tag @roster
 * Coverage:
 *   AC-15（資料載入中 → skeleton 可見，載入後消失）
 *   AC-16（GAS + JSON 均失敗 → 「無法載入球員資料」+ 重試按鈕）
 *   AC-17（roster 資料為空 → 「賽季尚未開始 ⛹️」訊息）
 *
 * 測試資料策略：
 *   skeleton：mockRosterAndDragon + delayMs=1500 模擬慢速載入
 *   error：allFail: true
 *   empty：mockEmptyRoster()（teams=[]）
 */

import { test, expect } from '@playwright/test';
import { mockFullRoster, mockEmptyRoster } from '../../../fixtures/roster';
import { mockFullDragonboard, mockEmptyDragonboard } from '../../../fixtures/dragon';
import { mockRosterAndDragon } from '../../../helpers/mock-api';

test.describe('Roster Three-State (Loading / Error / Empty) @roster', () => {
  // ────── AC-15: skeleton ──────
  test('AC-15: 資料載入中 → skeleton 可見；載入後 skeleton 消失', async ({ page }) => {
    await mockRosterAndDragon(
      page,
      { roster: mockFullRoster(), dragon: mockFullDragonboard() },
      { delayMs: 1500 },
    );
    await page.goto('roster');

    await expect(page.locator('[data-testid="roster-skeleton"]')).toBeVisible();

    // 載入後 skeleton 消失
    await expect(page.locator('[data-testid="roster-team-section"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="roster-skeleton"]')).toHaveCount(0);
  });

  // ────── AC-16: error state ──────
  test('AC-16: GAS + JSON 均失敗 → 「無法載入球員資料」+ 重試按鈕', async ({ page }) => {
    await mockRosterAndDragon(
      page,
      { roster: null, dragon: null },
      { allFail: true },
    );
    await page.goto('roster');

    const errorEl = page.locator('[data-testid="roster-error"]');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('無法載入球員資料');

    const retryBtn = page.locator('[data-testid="roster-retry"]');
    await expect(retryBtn).toBeVisible();
  });

  // ────── AC-17: empty state ──────
  test('AC-17: roster 資料為空（teams=[]）→ 「賽季尚未開始 ⛹️」訊息', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockEmptyRoster(), dragon: mockEmptyDragonboard() });
    await page.goto('roster');

    await expect(page.locator('[data-testid="roster-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="roster-empty"]')).toContainText('賽季尚未開始');
  });
});
