/**
 * /schedule 賽程頁 E2E — 對戰組合 / 賽程順序 Toggle（對 prod 真實鏈路）
 *
 * @coverage E-7（與 schedule-data.spec.ts 共同涵蓋 AC-6 toggle 結構）
 * @issue #17
 * @tag @schedule @matchups
 *
 * 不再 mock Sheets API；對 prod URL 跑真實鏈路：
 *  - toggle 結構（radiogroup + 兩按鈕）存在
 *  - 切換可改變 aria-pressed 與顯示列表
 *
 * 智慧預設邏輯（gamesPublished true/false → order/combo）由 unit test 涵蓋
 * （tests/unit/matchups-toggle-utils.test.ts）。本 spec 不再驗 unpublished 情境
 * （prod 不易主動觸發 unpublished；deterministic 假資料情境改在 unit）。
 */

import { test, expect } from '@playwright/test';

test.describe('Schedule — 對戰組合 / 賽程順序 Toggle', () => {
  test('E-701: 賽程頁顯示 toggle 結構', async ({ page }) => {
    await page.goto('schedule');

    const toggle = page.getByTestId('schedule-matchups-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('role', 'radiogroup');

    await expect(page.getByTestId('schedule-matchups-toggle-combo')).toBeVisible();
    await expect(page.getByTestId('schedule-matchups-toggle-order')).toBeVisible();
  });

  test('E-701b: 點擊 toggle → aria-pressed 與顯示列表正確切換', async ({ page }) => {
    await page.goto('schedule');
    await expect(page.getByTestId('schedule-matchups-toggle')).toBeVisible();

    // 切到對戰組合
    await page.getByTestId('schedule-matchups-toggle-combo').click();
    await expect(page.getByTestId('schedule-matchups-toggle-combo')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('schedule-matchups-toggle-order')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('schedule-matchups-combo-list')).toBeVisible();
    await expect(page.getByTestId('schedule-matchups-order-list')).toBeHidden();

    // 切回賽程順序
    await page.getByTestId('schedule-matchups-toggle-order').click();
    await expect(page.getByTestId('schedule-matchups-order-list')).toBeVisible();
    await expect(page.getByTestId('schedule-matchups-combo-list')).toBeHidden();
  });
});
