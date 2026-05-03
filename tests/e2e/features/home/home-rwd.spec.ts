/**
 * /（首頁）E2E — RWD 適配（對 prod 真實鏈路）
 *
 * @coverage E-6（RWD 子集）
 * @issue #17
 * @tag @home @rwd @issue-17
 *
 * 不再 mock home API；對 prod URL 跑真實鏈路：
 *  - 手機（375px）各區塊垂直堆疊
 *  - 桌機（1280px）戰績榜 + 龍虎榜並排兩欄
 *  - 桌機領先榜三指標橫排
 */

import { test, expect } from '@playwright/test';

test.describe('Home — RWD', () => {
  test('AC-10: 手機（< 768px）各區塊垂直堆疊', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('');

    const container = page.getByTestId('home-dashboard');
    await expect(container).toBeVisible();

    await expect(page.getByTestId('home-schedule')).toBeVisible();
    await expect(page.getByTestId('home-standings')).toBeVisible();
    await expect(page.getByTestId('home-leaders')).toBeVisible();
    await expect(page.getByTestId('home-dragon')).toBeVisible();

    const standingsBox = await page.getByTestId('home-standings').boundingBox();
    const dragonBox = await page.getByTestId('home-dragon').boundingBox();
    // 手機垂直堆疊：top 不同
    expect(standingsBox!.y).not.toEqual(dragonBox!.y);
  });

  test('AC-11: 桌機（≥ 768px）戰績榜 + 龍虎榜並排兩欄', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('');

    const standingsBox = await page.getByTestId('home-standings').boundingBox();
    const dragonBox = await page.getByTestId('home-dragon').boundingBox();

    // 桌機並排：y 接近（同一 row）
    expect(Math.abs(standingsBox!.y - dragonBox!.y)).toBeLessThan(50);
  });

  test('AC-11: 桌機領先榜三指標橫排', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('');

    const cats = page.getByTestId('home-leaders').getByTestId('leader-category');
    await expect(cats).toHaveCount(3);

    const firstBox = await cats.nth(0).boundingBox();
    const thirdBox = await cats.nth(2).boundingBox();

    expect(Math.abs(firstBox!.y - thirdBox!.y)).toBeLessThan(50);
    expect(thirdBox!.x).toBeGreaterThan(firstBox!.x);
  });
});
