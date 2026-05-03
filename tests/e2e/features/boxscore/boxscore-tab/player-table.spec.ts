/**
 * /boxscore Boxscore Tab — Player Table E2E（對 prod 真實鏈路）
 *
 * @coverage（boxscore 未在 Issue #17 主線 AC，僅 cleanup AC-X1）
 * @issue #17
 * @tag @boxscore @issue-17
 *
 * 不再 mock boxscore + leaders API；對 prod URL 跑真實鏈路：
 *  - 球員表格 11 欄
 *  - 合計 row（包含「合計」字樣）
 *  - DNP 球員顯示「(未出賽)」標籤
 *  - 球員 row 不可點擊（cursor 非 pointer，非 anchor）
 *
 * 「DNP 球員不計入合計 row」（AC-6b）需 deterministic 單場 fixture 才能驗合計數值，
 * 已由 unit test 涵蓋（boxscore-utils.test.ts 對 totals 計算邏輯）。
 */

import { test, expect } from '@playwright/test';

test.describe('Boxscore Tab — Player Table', () => {
  test('AC-5: 球員表格含 11 欄', async ({ page }) => {
    await page.goto('boxscore?tab=boxscore');

    const firstTable = page.locator('[data-testid="bs-team-table"]').first();
    await expect(firstTable).toBeVisible();

    const headers = firstTable.locator('thead th');
    await expect(headers).toHaveCount(11);
  });

  test('AC-6: 表格末尾顯示合計 row', async ({ page }) => {
    await page.goto('boxscore?tab=boxscore');

    const firstTable = page.locator('[data-testid="bs-team-table"]').first();
    await expect(firstTable).toBeVisible();

    const totalsRow = firstTable.locator('[data-testid="bs-totals-row"]');
    await expect(totalsRow).toBeVisible();
    await expect(totalsRow).toContainText(/合計/);
  });

  test('AC-7: DNP 球員顯示「(未出賽)」標籤（如該場有 DNP）', async ({ page }) => {
    await page.goto('boxscore?tab=boxscore');

    const dnpRows = page.locator('[data-testid="bs-player-row"][data-dnp="true"]');
    const count = await dnpRows.count();

    if (count > 0) {
      await expect(dnpRows.first()).toContainText(/未出賽|DNP/);
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'prod 該週無 DNP 球員 → 跳過 DNP 視覺驗證（unit test 已涵蓋元件渲染契約）',
      });
    }
  });

  test('AC-8: 球員 row 不可點擊（cursor 非 pointer + 非 anchor）', async ({ page }) => {
    await page.goto('boxscore?tab=boxscore');

    const playerRow = page.locator('[data-testid="bs-player-row"][data-dnp="false"]').first();
    await expect(playerRow).toBeVisible();

    const cursor = await playerRow.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).not.toBe('pointer');

    const tagName = await playerRow.evaluate((el) => el.tagName);
    expect(tagName.toLowerCase()).not.toBe('a');
  });
});
