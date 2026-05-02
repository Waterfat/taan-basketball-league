/**
 * /（首頁）E2E — 三狀態 + 邊界/異常
 *
 * Coverage: AC-12, AC-13, AC-14, AC-15, AC-16, AC-17
 * qa-v2 補充：AC-13 重試按鈕行為（B-19）
 *
 * 測試資料策略：
 * - 延遲模擬 skeleton；allFail 模擬全失敗；空資料模擬賽季未開始
 * - 邊界情境使用 mock*WithFew* 工廠
 */

import { test, expect } from '@playwright/test';
import { mockHomeAPI } from '../../../helpers/mock-api';
import {
  mockHomeData,
  mockEmptyHomeData,
  mockHomeDataWithNullStreak,
  mockHomeDataWithFewPlayers,
  mockHomeDataWithFewDragon,
} from '../../../fixtures/home';

test.describe('Home — 三狀態 + 邊界 @home @states', () => {
  // ── AC-12 ──
  test('AC-12: 資料載入中顯示 skeleton', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData(), { delayMs: 2000 });
    await page.goto('');

    // 未 await 資料完成前，skeleton 應可見
    await expect(page.getByTestId('home-skeleton')).toBeVisible({ timeout: 1000 });
    // 資料到位後 skeleton 消失
    await expect(page.getByTestId('home-skeleton')).not.toBeVisible({ timeout: 5000 });
  });

  // ── AC-13 ──
  test('AC-13: GAS + JSON 全失敗 → 顯示錯誤訊息 + 重試按鈕', async ({ page }) => {
    await mockHomeAPI(page, null, { allFail: true });
    await page.goto('');

    // UI 結構
    await expect(page.getByTestId('home-error')).toBeVisible();
    await expect(page.getByText(/無法載入聯盟資訊/)).toBeVisible();
    await expect(page.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ── AC-13 重試 [qa-v2 補充] ──
  test('AC-13 [qa-v2 補充]: 點重試按鈕後重新 fetch', async ({ page }) => {
    let fetchCount = 0;
    // 第一次失敗，第二次成功
    await page.route(/\/data\/home\.json$/, async (route) => {
      fetchCount++;
      if (fetchCount === 1) {
        await route.fulfill({ status: 500, body: 'fail' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockHomeData()),
        });
      }
    });
    await page.goto('');

    // 等待錯誤狀態
    await expect(page.getByTestId('home-error')).toBeVisible();

    // 互動流程：點重試
    await page.getByRole('button', { name: /重試/ }).click();

    // 重試後 error 消失，資料出現
    await expect(page.getByTestId('home-error')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('home-standings')).toBeVisible();
  });

  // ── AC-14 ──
  test('AC-14: home.json 空資料 → 「賽季尚未開始」訊息', async ({ page }) => {
    await mockHomeAPI(page, mockEmptyHomeData());
    await page.goto('');

    await expect(page.getByTestId('home-empty')).toBeVisible();
    await expect(page.getByText(/賽季尚未開始/)).toBeVisible();
  });

  // ── AC-15 ──
  test('AC-15: streakType null → 不顯示 icon，只顯示文字', async ({ page }) => {
    await mockHomeAPI(page, mockHomeDataWithNullStreak());
    await page.goto('');

    // 只取可見列（桌機 table row），避免找到 CSS-hidden mobile 列
    const rows = page.getByTestId('home-standings').getByTestId('home-standings-row').filter({ visible: true });
    const first = rows.first();

    // streak icon 不可見
    await expect(first.getByTestId('streak-icon')).not.toBeVisible();
    // streak 文字本身仍顯示
    await expect(first.getByTestId('streak')).toBeVisible();
  });

  // ── AC-16 ──
  test('AC-16: 領先榜某指標 players < 3 → 顯示有的，不報錯', async ({ page }) => {
    await mockHomeAPI(page, mockHomeDataWithFewPlayers());
    await page.goto('');

    await expect(page.getByTestId('home-error')).not.toBeVisible();

    // 第一欄（得分）只有 1 筆
    const ptsCat = page.getByTestId('home-leaders')
      .getByTestId('leader-category').first();
    await expect(ptsCat.getByTestId('leader-entry')).toHaveCount(1);

    // 第二欄（籃板）只有 2 筆
    const rebCat = page.getByTestId('home-leaders')
      .getByTestId('leader-category').nth(1);
    await expect(rebCat.getByTestId('leader-entry')).toHaveCount(2);
  });

  // ── AC-17 ──
  test('AC-17: 龍虎榜 < 5 筆 → 顯示有的，不報錯', async ({ page }) => {
    await mockHomeAPI(page, mockHomeDataWithFewDragon());
    await page.goto('');

    await expect(page.getByTestId('home-error')).not.toBeVisible();
    const rows = page.getByTestId('home-dragon').getByTestId('dragon-row').filter({ visible: true });
    await expect(rows).toHaveCount(2);
  });
});
