/**
 * /boxscore 數據頁 P0 回歸 smoke
 *
 * Tag: @boxscore-regression
 * 沿用 Issue #1 結案建議升級為 regression spec
 *
 * 涵蓋核心未登入流程：
 *   - 頁面載入（Hero + tabs）
 *   - leaders 預設 + 切換 tab + 切回
 *   - deep link from /schedule
 *   - error / empty 限縮（不會整頁炸）
 *
 * 全部 mock 資料源，不打 prod。
 */

import { test, expect } from '@playwright/test';
import { mockBoxscoreWeek } from '../../fixtures/boxscore';
import { mockFullLeaders, mockEmptyLeaders } from '../../fixtures/leaders';
import { mockBoxscoreAndLeaders, mockBoxscoreSheetsAPI, mockLeadersAPI } from '../../helpers/mock-api';

const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
];

test.describe('Boxscore Regression @boxscore-regression', () => {
  test('R-1: 頁面載入 → Hero + 兩個 sub-tab 可見，預設 leaders active', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore');

    await expect(page.locator('[data-testid="data-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="sub-tab"][data-tab="leaders"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
  });

  test('R-2: 切換 tab + 切回 → URL 同步、面板正確切換，不出 console error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore');

    // 等 React island (client:load) hydration 完成
    await expect(page.locator('[data-testid="data-hero"]')).toBeVisible();
    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    const leadersTab = page.locator('[data-testid="sub-tab"][data-tab="leaders"]');
    await expect(boxscoreTab).toBeVisible();

    // toPass retry 容忍 hydration 競態：button visible 但 React onClick 尚未綁定
    await expect(async () => {
      await boxscoreTab.click();
      await expect(page).toHaveURL(/[?&]tab=boxscore/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await expect(page.locator('[data-testid="boxscore-panel"]')).toBeVisible();

    // 切回 leaders → URL 不帶 tab 參數（impl 設計：leaders 是預設 tab，URL 清乾淨）
    await leadersTab.click();
    await expect(page).not.toHaveURL(/[?&]tab=/);
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('R-3: 從 schedule 帶 deep link 進入 → boxscore tab + chip + highlight', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?week=5&game=2');

    // 等 hydration
    await expect(page.locator('[data-testid="data-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');
    const activeChip = page.locator('[data-testid="bs-week-chip"][data-active="true"]');
    await expect(activeChip).toContainText(/5/);
    const card = page.locator('[data-testid="bs-game-card"][data-game="2"]');
    await expect(card).toHaveAttribute('data-highlighted', 'true');
  });

  test('R-4: boxscore 拉不到 → 限縮 error 不影響 leaders', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="data-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="bs-error"]')).toBeVisible();

    // 切到 leaders 仍 OK
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-error"]')).toHaveCount(0);
  });

  test('R-5: leaders 全空（賽季初）→ 顯示 empty 訊息而非 error', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, mockEmptyLeaders());
    await page.goto('boxscore?tab=leaders');

    await expect(page.locator('[data-testid="data-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-error"]')).toHaveCount(0);
  });
});
