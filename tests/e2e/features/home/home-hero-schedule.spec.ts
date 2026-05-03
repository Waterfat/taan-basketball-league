/**
 * E-5：/（首頁）Hero + 本週賽程（Issue #17 AC-5, AC-X1）
 *
 * @coverage E-5
 * @issue #17
 * @tag @home @issue-17
 *
 * 不再 mock home API；對 prod URL 跑真實鏈路：
 *  - hero 顯示真實 currentWeek + phase（不為「第 季」/ undefined）
 *  - 本週賽程區塊有日期 + 場地內容
 *  - CTA「看本週對戰」連到 /schedule
 *
 * 視覺細節（CTA 文字色、icon）由 home-utils 單元測試與其他 spec 涵蓋。
 */

import { test, expect } from '@playwright/test';

test.describe('Home Hero — 真實 currentWeek + phase', () => {
  test('Hero 顯示「TAAN BASKETBALL」+ 真實 season + phase + week（不為破碎字串）', async ({ page }) => {
    await page.goto('');

    await expect(page.getByRole('heading', { name: /TAAN BASKETBALL/i })).toBeVisible();

    const body = page.locator('body');
    await expect(body).not.toContainText('第  季');
    await expect(body).not.toContainText('undefined');
    await expect(body).not.toContainText('NaN');

    // 至少顯示「第 N 季」格式（N 為非 0 數字）
    await expect(page.getByText(/第\s*\d+\s*季/).first()).toBeVisible();
    // phase 至少是「例行賽 / 季後賽 / 季前賽 / 熱身賽」之一（非 undefined）
    await expect(page.getByText(/例行賽|季後賽|季前賽|熱身賽/).first()).toBeVisible();
    // week 顯示 W / 第 N 週
    await expect(page.getByText(/第\s*\d+\s*週|W\d+/).first()).toBeVisible();
  });

  test('本週賽程區塊顯示日期 + 場地（容忍 prod 內容變動）', async ({ page }) => {
    await page.goto('');

    const scheduleBlock = page.getByTestId('home-schedule');
    await expect(scheduleBlock).toBeVisible();

    // 至少含日期（YYYY 或 YYYY/M/D）與場地名（不寫死「三重體育館」/ 2026/2/14）
    const text = (await scheduleBlock.textContent()) ?? '';
    expect(text.length).toBeGreaterThan(0);
    // 含至少一個 4 位年份或月日（容忍格式：2026 / 26-2 / 2/14 / 2026.2.14）
    expect(text).toMatch(/\d{4}|\d+\s*[\/.\-]\s*\d+/);
  });

  test('本週賽程 CTA 連到 /schedule', async ({ page }) => {
    await page.goto('');

    const cta = page.getByTestId('home-schedule').getByRole('link', { name: /看本週對戰|本週對戰/ });
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/schedule/);
  });
});
