/**
 * E-6b：/（首頁）領先榜 + 龍虎榜迷你版（Issue #17 AC-5, AC-X1）
 *
 * @coverage E-6b
 * @issue #17
 * @tag @home @leaders @dragon @issue-17
 *
 * 不再 mock home API；對 prod URL 跑真實鏈路：
 *  - 領先榜三指標（得分/籃板/助攻）各 leader-category 存在
 *  - CTA「看完整領先榜」連 /boxscore?tab=leaders
 *  - 龍虎榜 top 5（rank / 名 / 隊 / 總分）
 *  - CTA「看完整龍虎榜」連 /roster?tab=dragon
 *
 * 不寫死球員名（黃偉訓 / 韋承志）— 容忍 prod 真實資料變動。
 */

import { test, expect } from '@playwright/test';

test.describe('Home — 領先榜 + 龍虎榜', () => {
  test('領先榜三指標各 category 存在 + 至少 1 entry', async ({ page }) => {
    await page.goto('');

    const block = page.getByTestId('home-leaders');
    await expect(block).toBeVisible();

    const cats = block.getByTestId('leader-category');
    await expect(cats).toHaveCount(3);

    // 至少第一個指標有資料
    const firstCat = cats.first();
    const entries = firstCat.getByTestId('leader-entry');
    const entryCount = await entries.count();
    expect(entryCount).toBeGreaterThanOrEqual(1);

    // 第一個 entry 有 leader-name
    if (entryCount > 0) {
      await expect(firstCat.getByTestId('leader-entry').first().getByTestId('leader-name')).toBeVisible();
    }
  });

  test('領先榜 CTA 連 /boxscore?tab=leaders', async ({ page }) => {
    await page.goto('');

    const cta = page.getByTestId('home-leaders').getByRole('link', { name: /看完整領先榜|完整領先榜/ });
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/boxscore\?tab=leaders/);
  });

  test('龍虎榜顯示 5 列（每列含 rank / name / team / total）', async ({ page }) => {
    await page.goto('');

    const block = page.getByTestId('home-dragon');
    await expect(block).toBeVisible();

    const rows = block.getByTestId('dragon-row').filter({ visible: true });
    await expect(rows).toHaveCount(5);

    const first = rows.first();
    await expect(first.getByTestId('rank')).toContainText('1');
    await expect(first.getByTestId('name')).toBeVisible();
    await expect(first.getByTestId('team')).toBeVisible();
    await expect(first.getByTestId('total')).toBeVisible();
  });

  test('龍虎榜 CTA 連 /roster?tab=dragon', async ({ page }) => {
    await page.goto('');

    const cta = page.getByTestId('home-dragon').getByRole('link', { name: /看完整龍虎榜|完整龍虎榜/ });
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/roster\?tab=dragon/);
  });
});
