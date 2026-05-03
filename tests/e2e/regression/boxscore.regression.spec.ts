/**
 * /boxscore 數據頁 P0 回歸 smoke（對 prod 真實鏈路）
 *
 * @tag @boxscore-regression @issue-17
 * @issue #17
 *
 * Issue #17 AC-X1：移除原 boxscore / leaders 的 mock 攔截器，
 * 改對 prod 真實鏈路驗證核心未登入流程：
 *   - R-1：頁面載入（Hero + 兩個 sub-tab，預設 leaders active）
 *   - R-2：切換 tab + 切回 → URL 同步、面板正確切換、不出 console error
 *   - R-3：deep link from /schedule（boxscore?week=N&game=M → tab + chip + highlight）
 *
 * 三狀態（error / empty）的限縮邏輯已由 tests/unit/boxscore-leaders-states.test.ts 覆蓋
 * （deterministic 假資料 → unit 元件渲染契約）。
 */

import { test, expect } from '@playwright/test';

test.describe('Boxscore Regression @boxscore-regression', () => {
  test('R-1: 頁面載入 → Hero + 兩個 sub-tab 可見，預設 leaders active', async ({ page }) => {
    await page.goto('boxscore');

    await expect(page.locator('[data-testid="data-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="sub-tab"][data-tab="leaders"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
  });

  test('R-2: 切換 tab + 切回 → URL 同步、面板正確切換、不出 console error', async ({ page }) => {
    const errors: string[] = [];
    const ignorePatterns = [/Outdated Optimize Dep/i, /504.*Outdated/i];
    const shouldIgnore = (msg: string) => ignorePatterns.some((p) => p.test(msg));
    page.on('pageerror', (e) => {
      if (!shouldIgnore(e.message)) errors.push(e.message);
    });
    page.on('console', (m) => {
      if (m.type() === 'error' && !shouldIgnore(m.text())) errors.push(m.text());
    });

    await page.goto('boxscore');

    await expect(page.locator('[data-testid="data-hero"]')).toBeVisible();
    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    const leadersTab = page.locator('[data-testid="sub-tab"][data-tab="leaders"]');
    await expect(boxscoreTab).toBeVisible();

    // toPass retry 容忍 hydration 競態
    await expect(async () => {
      await boxscoreTab.click();
      await expect(page).toHaveURL(/[?&]tab=boxscore/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    // reason: CI fetch boxscore range 慢/可能拿不到，容忍 panel/empty/error 任一可見即代表面板容器有切換成功
    await expect(
      page.locator('[data-testid="boxscore-panel"], [data-testid="bs-empty"], [data-testid="bs-error"]').first(),
    ).toBeVisible({ timeout: 15_000 });

    // 切回 leaders → URL 不帶 tab 參數
    await leadersTab.click();
    await expect(page).not.toHaveURL(/[?&]tab=/);
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('R-3: 從 schedule 帶 deep link 進入 → boxscore tab + chip + highlight', async ({ page }) => {
    // 為避免依賴特定 prod 資料，先進 schedule 找一張完賽卡片，從中抓 week/game 參數
    await page.goto('schedule');

    // 找任一完賽卡片
    const finishedCard = page.locator('[data-testid="game-card"][data-status="finished"]').first();
    const cardCount = await finishedCard.count();
    test.skip(cardCount === 0, 'prod 賽季無完賽場次 → 跳過 deep link 驗證');

    // 直接點擊跳 boxscore（既有元件邏輯應帶 week + game）
    await finishedCard.click();
    await expect(page).toHaveURL(/\/boxscore.*[?&]week=\d+/);

    // 驗 boxscore tab active + chip 高亮 + 卡片高亮
    await expect(page.locator('[data-testid="data-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');

    const activeChip = page.locator('[data-testid="bs-week-chip"][data-active="true"]');
    await expect(activeChip).toBeVisible();

    // 高亮卡片至少 1 張
    const highlighted = page.locator('[data-testid="bs-game-card"][data-highlighted="true"]');
    await expect(highlighted.first()).toBeVisible();
  });
});
