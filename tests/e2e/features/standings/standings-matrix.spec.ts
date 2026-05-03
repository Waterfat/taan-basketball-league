/**
 * /standings 戰績矩陣 E2E（對 prod 真實鏈路）
 *
 * @coverage E-1（與 standings-data.spec.ts 共同覆蓋 AC-1 矩陣需求）
 * @issue #17
 * @tag @standings @matrix
 *
 * Issue #17 AC-X1：移除既有 mock 攔截器，改對 prod 真實鏈路驗證結構。
 *
 * 三狀態（loading / error）改由 unit/integration 涵蓋：
 *  - tests/unit/error-empty-states.test.ts 驗 ErrorState/EmptyState SSR 渲染
 *  - tests/integration/api-no-fallback.integration.test.ts 驗 AC-E1 不 fallback 行為
 *  - tests/integration/api-standings-matrix.integration.test.ts 驗 transformer 含 matrix
 *
 * 本 spec 只保留正常 prod 鏈路下的 UI 結構驗證（cell class / 對角線 / 手機 overflow）。
 */

import { test, expect } from '@playwright/test';

test.describe('Standings Matrix — structure & cell styles @standings @matrix', () => {
  test('E-201: 戰績矩陣區塊可見，矩陣表格有 6 列 × 6 欄', async ({ page }) => {
    await page.goto('standings');

    const section = page.getByTestId('standings-matrix');
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading')).toBeVisible();

    const table = page.getByTestId('matrix-table');
    await expect(table).toBeVisible();

    const bodyRows = table.locator('tbody tr');
    await expect(bodyRows).toHaveCount(6);
    await expect(bodyRows.first().getByTestId('matrix-cell')).toHaveCount(6);

    await expect(table.getByTestId('matrix-cell')).toHaveCount(36);
  });

  test('E-202: 對角線 6 格顯示「—」', async ({ page }) => {
    await page.goto('standings');

    const table = page.getByTestId('matrix-table');
    await expect(table).toBeVisible();

    const selfCells = table.locator('[data-testid="matrix-cell"].matrix-cell--self');
    await expect(selfCells).toHaveCount(6);

    for (let i = 0; i < 6; i++) await expect(selfCells.nth(i)).toHaveText('—');
  });

  test('E-203: 正分 cell 帶 matrix-cell--positive，負分帶 matrix-cell--negative（如 prod 有對應資料）', async ({ page }) => {
    await page.goto('standings');

    const table = page.getByTestId('matrix-table');
    await expect(table).toBeVisible();

    // prod 賽季中至少會有正/負分 cell；若極端情況（賽季初 0 比賽）則跳過
    const positiveCells = table.locator('[data-testid="matrix-cell"].matrix-cell--positive');
    const negativeCells = table.locator('[data-testid="matrix-cell"].matrix-cell--negative');

    const posCount = await positiveCells.count();
    const negCount = await negativeCells.count();

    // 賽季中 → 正/負皆有；極端賽季初 → 至少 cell 渲染（不 throw）
    if (posCount > 0) {
      const posPoints = await positiveCells.first().getAttribute('data-net-points');
      expect(Number(posPoints)).toBeGreaterThan(0);
      await expect(positiveCells.first()).not.toHaveClass(/matrix-cell--negative/);
    }
    if (negCount > 0) {
      const negPoints = await negativeCells.first().getAttribute('data-net-points');
      expect(Number(negPoints)).toBeLessThan(0);
      await expect(negativeCells.first()).not.toHaveClass(/matrix-cell--positive/);
    }
  });
});

test.describe('Standings Matrix — mobile scroll @standings @matrix', () => {
  test('E-204: 手機（375px）矩陣捲動包裹器有 overflow-x-auto 或 scrollWidth > clientWidth', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('standings');

    const scrollWrapper = page.getByTestId('matrix-scroll');
    await expect(scrollWrapper).toBeVisible();

    const hasOverflowClass = await scrollWrapper.evaluate(
      (el) => el.classList.contains('overflow-x-auto') || el.classList.contains('overflow-x-scroll'),
    );
    const isScrollable = await scrollWrapper.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(hasOverflowClass || isScrollable).toBe(true);
  });
});
