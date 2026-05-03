/**
 * E-8a：/boxscore?tab=leaders 個人領先榜（對 prod 真實鏈路）
 *
 * @coverage E-8a
 * @issue #17
 * @tag @boxscore @leaders @issue-17
 *
 * 不再 mock leaders API；對 prod URL 跑真實鏈路：
 *  - leaders-panel 區塊可見
 *  - 11 類個人卡片 (LEADER_CATEGORIES_ORDERED) 全部渲染
 *  - 卡片順序固定（既有 6 類在前，新 5 類在後）
 *
 * 部分類別空狀態（AC-E3：turnover / p3pct empty）需 deterministic 假資料 →
 * 改由 unit test 涵蓋（element 渲染契約於 LeaderCard 元件層驗證）。
 *
 * 不寫死球員名 / 數值 — 容忍 prod 真實資料變動。
 */

import { test, expect } from '@playwright/test';
import { LEADER_CATEGORIES_ORDERED } from '../../../../src/types/leaders';

test.describe('Leaders Tab — 個人 11 類', () => {
  test('E-301: leaders-panel 顯示 11 類個人卡片', async ({ page }) => {
    await page.goto('boxscore?tab=leaders');

    const panel = page.locator('[data-testid="leaders-panel"]');
    await expect(panel).toBeVisible();

    const cards = panel.locator('[data-testid="leaders-card"]');
    await expect(cards).toHaveCount(11);

    for (const cat of LEADER_CATEGORIES_ORDERED) {
      await expect(panel.locator(`[data-testid="leaders-card"][data-category="${cat}"]`)).toBeVisible();
    }
  });

  test('E-303: 11 類順序固定（既有 6 + 新 5）', async ({ page }) => {
    await page.goto('boxscore?tab=leaders');

    const cards = page.locator('[data-testid="leaders-panel"] [data-testid="leaders-card"]');
    await expect(cards).toHaveCount(11);

    for (let i = 0; i < LEADER_CATEGORIES_ORDERED.length; i++) {
      const actualCategory = await cards.nth(i).getAttribute('data-category');
      expect(actualCategory).toBe(LEADER_CATEGORIES_ORDERED[i]);
    }
  });

  test('E-302: 每類卡片有資料列或空狀態（非崩潰）', async ({ page }) => {
    await page.goto('boxscore?tab=leaders');

    const panel = page.locator('[data-testid="leaders-panel"]');
    await expect(panel).toBeVisible();

    // 每張卡片或有 leader-row 或有 leaders-empty（不崩潰）
    for (const cat of LEADER_CATEGORIES_ORDERED) {
      const card = panel.locator(`[data-testid="leaders-card"][data-category="${cat}"]`);
      const hasRow = (await card.locator('[data-testid="leader-row"]').count()) > 0;
      const hasEmpty = (await card.locator('[data-testid="leaders-empty"]').count()) > 0;
      expect(hasRow || hasEmpty).toBe(true);
    }
  });
});
