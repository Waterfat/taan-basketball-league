/**
 * /（首頁）E2E — Hero + 本週賽程區塊
 *
 * Coverage: AC-1, AC-2, AC-8（CTA /schedule）
 *
 * 測試資料策略：
 * - 攔截 GAS + /data/home.json，使用 mockHomeData() 正常快照
 * - 不打 production GAS
 */

import { test, expect } from '@playwright/test';
import { mockHomeAPI } from '../../../helpers/mock-api';
import { mockHomeData } from '../../../fixtures/home';

test.describe('Home — Hero + 本週賽程 @home', () => {
  // ── AC-1 ──
  test('AC-1: Hero 顯示「TAAN BASKETBALL」+ 第 25 季 + 例行賽 + 第 3 週', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('');

    // UI 結構
    await expect(page.getByRole('heading', { name: /TAAN BASKETBALL/i })).toBeVisible();
    await expect(page.getByText(/第\s*25\s*季/)).toBeVisible();
    await expect(page.getByText(/例行賽/)).toBeVisible();
    await expect(page.getByText(/第\s*3\s*週/)).toBeVisible();
  });

  // ── AC-2 ──
  test('AC-2: 本週賽程區塊顯示日期 + 場地', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('');

    // UI 結構
    const scheduleBlock = page.getByTestId('home-schedule');
    await expect(scheduleBlock).toBeVisible();
    await expect(scheduleBlock.getByText(/2026.*2.*14/)).toBeVisible();
    await expect(scheduleBlock.getByText(/三重體育館/)).toBeVisible();
  });

  // ── AC-2 CTA + AC-8 ──
  test('AC-2/8: 本週賽程 CTA 連到 /schedule', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('');

    // 互動流程
    const cta = page.getByTestId('home-schedule').getByRole('link', { name: /看本週對戰/ });
    await expect(cta).toBeVisible();

    // API 驗證 — URL 指向 /schedule
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/schedule/);
  });
});
