/**
 * /（首頁）E2E — RWD 適配
 *
 * Coverage: AC-10, AC-11
 *
 * 測試資料策略：
 * - 使用 mockHomeData() 正常快照
 * - 手機情境由 features-mobile project（Pixel 7）自動執行，此檔也可指定 viewport
 */

import { test, expect } from '@playwright/test';
import { mockHomeAPI } from '../../../helpers/mock-api';
import { mockHomeData } from '../../../fixtures/home';

test.describe('Home — RWD @home @rwd', () => {
  // ── AC-10 手機：垂直堆疊 ──
  test('AC-10: 手機（< 768px）各區塊垂直堆疊', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockHomeAPI(page, mockHomeData());
    await page.goto('/');

    const container = page.getByTestId('home-dashboard');
    await expect(container).toBeVisible();

    // 各區塊可見（不驗 CSS，驗功能性 - 區塊可見即可）
    await expect(page.getByTestId('home-schedule')).toBeVisible();
    await expect(page.getByTestId('home-standings')).toBeVisible();
    await expect(page.getByTestId('home-leaders')).toBeVisible();
    await expect(page.getByTestId('home-dragon')).toBeVisible();

    // 戰績榜 + 龍虎榜在手機上應為全寬（不並排）
    const standingsBox = await page.getByTestId('home-standings').boundingBox();
    const dragonBox = await page.getByTestId('home-dragon').boundingBox();
    // 兩者 top 不同 → 垂直堆疊
    expect(standingsBox!.y).not.toEqual(dragonBox!.y);
  });

  // ── AC-11 桌機：雙欄 + 橫排 ──
  test('AC-11: 桌機（≥ 768px）戰績榜 + 龍虎榜並排兩欄', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockHomeAPI(page, mockHomeData());
    await page.goto('/');

    const standingsBox = await page.getByTestId('home-standings').boundingBox();
    const dragonBox = await page.getByTestId('home-dragon').boundingBox();

    // 桌機：兩欄並排 → y 接近（同一 row）
    expect(Math.abs(standingsBox!.y - dragonBox!.y)).toBeLessThan(50);
  });

  // ── AC-11 領先榜橫排 ──
  test('AC-11: 桌機領先榜三指標橫排', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockHomeAPI(page, mockHomeData());
    await page.goto('/');

    const cats = page.getByTestId('home-leaders').getByTestId('leader-category');
    await expect(cats).toHaveCount(3);

    const firstBox = await cats.nth(0).boundingBox();
    const thirdBox = await cats.nth(2).boundingBox();

    // 橫排：y 接近（同一 row），x 遞增
    expect(Math.abs(firstBox!.y - thirdBox!.y)).toBeLessThan(50);
    expect(thirdBox!.x).toBeGreaterThan(firstBox!.x);
  });
});
