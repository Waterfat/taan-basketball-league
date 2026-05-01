/**
 * UAT smoke test for /schedule
 *
 * 用 prod 真實資料（public/data/schedule.json）驗證部署正確
 * 不 mock，跑真實 fetch flow（GAS 未設 → 自動 fallback 到 JSON）
 */

import { test, expect } from '@playwright/test';

test.describe('Schedule page (UAT regression)', () => {
  test('部署版可載入並渲染賽程內容', async ({ page }) => {
    await page.goto('schedule');

    // 等到 React island hydrate 完成（skeleton 消失）
    await expect(
      page.locator('[data-testid="game-card"]').first(),
    ).toBeVisible({ timeout: 15_000 });

    // Hero header 出現
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/WEEK/);

    // 至少有 chip timeline
    const chips = page.locator('[data-testid="chip-week"]');
    await expect(chips.first()).toBeVisible();

    // 至少 6 張卡片
    const cards = page.locator('[data-testid="game-card"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(6);
  });
});
