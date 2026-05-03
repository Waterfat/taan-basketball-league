/**
 * /standings + /home Data Fallback E2E（Issue #13）
 *
 * Tag: @data-fallback @issue-13
 * Coverage:
 *   E-4（Issue #13 B-13）：Sheets API 失敗時 UI 不顯示「資料過期」之類提示，靜默 fallback
 *   E-7（Issue #13 B-16）：Sheets + 靜態 JSON 都失敗時頁面顯示 empty state，整站不崩潰
 *
 * 測試資料策略：
 * - 用 mock-api helper 攔截 Sheets API 與 fallback JSON
 * - mock-api helpers 在 Phase 2 task 改寫成 SHEETS_PATTERN 後會生效
 *
 * 註：本檔測試 Issue #13 完成後的新行為。Phase 2 task 實作前部分情境會 fail；
 *     實作後 GREEN。
 */

import { test, expect } from '@playwright/test';
import { mockStandingsAPI, mockHomeAPI } from '../../helpers/mock-api';
import { mockFullStandings } from '../../fixtures/standings';
import { mockHomeData } from '../../fixtures/home';

test.describe('Data Fallback @data-fallback @issue-13', () => {
  // ────── E-4: Sheets fail → 靜默 fallback，無提示 ──────
  test('E-4: Sheets fail → fallback 靜態 JSON，UI 不顯示「資料過期」提示 [qa-v2 補充]', async ({ page }) => {
    // Sheets fail（gasFails 概念在 Issue #13 後等同 Sheets fail），fallback JSON 提供完整資料
    await mockStandingsAPI(page, mockFullStandings(), { gasFails: true });
    await page.goto('standings');

    // 頁面正常渲染（資料來自 fallback JSON）
    await expect(page.getByRole('heading', { name: /STANDINGS/i })).toBeVisible();
    const rows = page.locator('[data-testid="standings-row"]:visible');
    await expect(rows).toHaveCount(6);

    // 不顯示提示文字（無「資料過期」「載入失敗」「重試」等字樣）
    await expect(page.getByText(/資料過期|資料異常|載入失敗|請重新整理|fallback|cached/i)).toHaveCount(0);
  });

  test('E-4 Home: Sheets fail → home 頁靜默 fallback，無錯誤橫幅 [qa-v2 補充]', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData(), { gasFails: true });
    await page.goto('');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/資料過期|載入失敗|請重新整理/i)).toHaveCount(0);
  });

  // ────── E-7: Sheets + JSON 都失敗 → empty state，不白屏 ──────
  test('E-7: Sheets + JSON 都失敗 → standings 顯示空狀態（不白屏、不崩潰）[qa-v2 補充]', async ({ page }) => {
    await mockStandingsAPI(page, null, { allFail: true });
    await page.goto('standings');

    // 頁面框架仍渲染（不白屏）：navigation + heading 應可見
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('heading', { name: /STANDINGS/i })).toBeVisible();

    // 空狀態：6 隊資料應為 0 列（或顯示 empty placeholder）
    const rows = page.locator('[data-testid="standings-row"]:visible');
    await expect(rows).toHaveCount(0);
  });

  test('E-7 Home: Sheets + JSON 都失敗 → home 頁不崩潰，導覽列仍可用 [qa-v2 補充]', async ({ page }) => {
    await mockHomeAPI(page, null, { allFail: true });
    await page.goto('');

    await expect(page.locator('nav')).toBeVisible();
    // 整站可用：能 click 到其他頁
    await page.getByRole('link', { name: /賽程/ }).first().click();
    await expect(page).toHaveURL(/schedule/);
  });
});
