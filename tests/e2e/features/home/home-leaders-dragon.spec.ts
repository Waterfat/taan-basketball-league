/**
 * /（首頁）E2E — 領先榜 + 龍虎榜區塊
 *
 * Coverage: AC-5, AC-6, AC-7, AC-8（CTA）
 *
 * 測試資料策略：
 * - 攔截 GAS + /data/home.json，使用 mockHomeData()
 * - 不打 production GAS
 */

import { test, expect } from '@playwright/test';
import { mockHomeAPI } from '../../../helpers/mock-api';
import { mockHomeData } from '../../../fixtures/home';

test.describe('Home — 領先榜 + 龍虎榜 @home @leaders @dragon', () => {
  // ── AC-5 ──
  test('AC-5: 領先榜三指標（得分/籃板/助攻）各顯示 top 3 並排', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('');

    const block = page.getByTestId('home-leaders');
    await expect(block).toBeVisible();

    // 三個指標欄
    const cats = block.getByTestId('leader-category');
    await expect(cats).toHaveCount(3);

    // 第一欄（得分）有 top 3 entries
    const firstCat = cats.first();
    await expect(firstCat.getByTestId('leader-entry')).toHaveCount(3);
    await expect(firstCat.getByTestId('leader-entry').first().getByTestId('leader-name'))
      .toContainText('黃偉訓');
  });

  // ── AC-6 + AC-8 ──
  test('AC-6/8: 領先榜 CTA 連 /boxscore?tab=leaders', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('');

    const cta = page.getByTestId('home-leaders').getByRole('link', { name: /看完整領先榜/ });
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/boxscore\?tab=leaders/);
  });

  // ── AC-7 ──
  test('AC-7: 龍虎榜顯示 top 5（rank / 名 / 隊 / 總分）', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('');

    const block = page.getByTestId('home-dragon');
    await expect(block).toBeVisible();

    const rows = block.getByTestId('dragon-row');
    await expect(rows).toHaveCount(5);

    // 確認第一列欄位
    const first = rows.first();
    await expect(first.getByTestId('rank')).toContainText('1');
    await expect(first.getByTestId('name')).toContainText('韋承志');
    await expect(first.getByTestId('team')).toContainText('紅');
    await expect(first.getByTestId('total')).toContainText('16');
  });

  // ── AC-7 CTA + AC-8 ──
  test('AC-7/8: 龍虎榜 CTA 連 /roster?tab=dragon', async ({ page }) => {
    await mockHomeAPI(page, mockHomeData());
    await page.goto('');

    const cta = page.getByTestId('home-dragon').getByRole('link', { name: /看完整龍虎榜/ });
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/roster\?tab=dragon/);
  });
});
