/**
 * /（首頁）E2E — 戰績榜迷你版區塊
 *
 * Coverage: AC-3, AC-4, AC-8（CTA /standings）, AC-9（隊伍列 deep link）
 *
 * 測試資料策略：
 * - 攔截 GAS + /data/home.json，使用 mockHomeData()
 * - 不打 production GAS
 */

import { test, expect } from '@playwright/test';
import { mockHomeAPI } from '../../../helpers/mock-api';
import { mockHomeData } from '../../../fixtures/home';

test.describe('Home — 戰績榜迷你版 @home @standings', () => {
  // ── AC-3 ──
  test('AC-3: 戰績榜顯示 6 隊（rank / 隊色點+名 / 勝敗 / 勝率 / 連勝紀錄）', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('/');

    // UI 結構
    const block = page.getByTestId('home-standings');
    await expect(block).toBeVisible();

    const rows = block.getByTestId('home-standings-row');
    await expect(rows).toHaveCount(6);

    // 確認第一列欄位
    const first = rows.first();
    await expect(first.getByTestId('rank')).toContainText('1');
    await expect(first.getByTestId('team-dot')).toBeVisible();
    await expect(first.getByTestId('team-name')).toContainText('綠');
    await expect(first.getByTestId('record')).toContainText(/勝/);
    await expect(first.getByTestId('pct')).toContainText('66.7');
    await expect(first.getByTestId('streak')).toContainText(/連勝|連敗/);
  });

  // ── AC-3 CTA + AC-8 ──
  test('AC-3/8: 戰績榜 CTA「看完整戰績」連 /standings', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('/');

    const cta = page.getByTestId('home-standings').getByRole('link', { name: /看完整戰績/ });
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/standings/);
  });

  // ── AC-4: 連勝視覺 ──
  test('AC-4: 連勝隊伍 streak 橙字 + ↑ icon', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('/');

    // 綠隊（rank 1）是 win
    const greenRow = page
      .getByTestId('home-standings')
      .getByTestId('home-standings-row')
      .filter({ has: page.getByTestId('team-name').filter({ hasText: '綠' }) });

    const streak = greenRow.getByTestId('streak');
    await expect(streak).toHaveAttribute('data-streak-type', 'win');
    await expect(streak).toContainText('↑');
  });

  // ── AC-4: 連敗視覺 ──
  test('AC-4: 連敗隊伍 streak 紅字 + ↓ icon', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('/');

    // 紅隊（rank 2）是 lose
    const redRow = page
      .getByTestId('home-standings')
      .getByTestId('home-standings-row')
      .filter({ has: page.getByTestId('team-name').filter({ hasText: '紅' }) });

    const streak = redRow.getByTestId('streak');
    await expect(streak).toHaveAttribute('data-streak-type', 'lose');
    await expect(streak).toContainText('↓');
  });

  // ── AC-9: 隊伍列 deep link ──
  test('AC-9: 點戰績榜隊伍列跳 /roster?team=<id>', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('/');

    // 互動流程：點第一列
    const firstRow = page
      .getByTestId('home-standings')
      .getByTestId('home-standings-row')
      .first();
    const href = await firstRow.evaluate((el) => {
      const a = el.querySelector('a') ?? el.closest('a');
      return a?.getAttribute('href') ?? '';
    });

    // API 驗證 — URL 含 /roster?team=
    expect(href).toMatch(/\/roster\?team=/);
  });
});
