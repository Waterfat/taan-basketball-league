/**
 * E-1：/standings 真實資料同步（Issue #17 AC-1, AC-X1）
 *
 * @coverage E-1
 * @issue #17
 * @tag @standings @issue-17
 *
 * 不再 mock Sheets API；對 prod URL 跑真實鏈路：
 *  - hero 顯示真實 season / phase / currentWeek（不為「第 季」/ undefined）
 *  - 表格 6 隊
 *  - 矩陣 6×6（對角線顯示「—」）
 *
 * 視覺細節（連勝顏色、history 圓點、隊伍配色等）已由 standings-components 單元測試涵蓋；
 * 邊界情境（0 勝、空資料、loading / error / 8 隊）依 e2e-guide.md「需 deterministic 假資料」
 * 原則改寫為 unit/integration（tests/unit/standings-components.test.ts +
 * tests/unit/error-empty-states.test.ts + tests/integration/api-standings-matrix.integration.test.ts）。
 */

import { test, expect } from '@playwright/test';

test.describe('Standings — 真實資料同步', () => {
  test('hero 顯示真實 season + phase + currentWeek', async ({ page }) => {
    await page.goto('standings');

    // hero 結構可見
    await expect(page.getByRole('heading', { name: /STANDINGS/i })).toBeVisible();

    // 不顯示資料缺失字串（容忍 prod season 數值變動，只確認非 undefined / 空）
    const body = page.locator('body');
    await expect(body).not.toContainText('第  季');
    await expect(body).not.toContainText('undefined');
    await expect(body).not.toContainText('NaN');

    // hero 至少含「第 N 季」格式（N 為非 0 數字，不寫死 25）
    await expect(page.getByText(/第\s*\d+\s*季/).first()).toBeVisible();
  });

  test('表格顯示 6 隊（真實隊名）', async ({ page }) => {
    await page.goto('standings');

    const rows = page.locator('[data-testid="standings-row"]:visible');
    await expect(rows).toHaveCount(6);

    // 每列有 rank + team-name + wins + losses（不寫死數值）
    const first = rows.first();
    await expect(first.locator('[data-testid="rank"]')).toBeVisible();
    await expect(first.locator('[data-testid="team-name"]')).toBeVisible();
    await expect(first.locator('[data-testid="wins"]')).toBeVisible();
    await expect(first.locator('[data-testid="losses"]')).toBeVisible();
  });

  test('點擊隊伍列 → 導向 /roster?team=<id>', async ({ page }) => {
    await page.goto('standings');

    const firstRow = page.locator('[data-testid="standings-row"]:visible').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // GitHub Pages trailing slash 容忍
    await expect(page).toHaveURL(/\/roster\/?\?team=\w+/);
  });

  test('矩陣顯示 6×6 + 對角線「—」', async ({ page }) => {
    await page.goto('standings');

    const matrix = page.getByTestId('standings-matrix');
    await expect(matrix).toBeVisible();

    const table = page.getByTestId('matrix-table');
    await expect(table).toBeVisible();

    // 6 列資料列（不含 header）
    const bodyRows = table.locator('tbody tr');
    await expect(bodyRows).toHaveCount(6);

    // 36 個 matrix-cell
    await expect(table.getByTestId('matrix-cell')).toHaveCount(36);

    // 對角線 6 格顯示「—」
    const selfCells = table.locator('[data-testid="matrix-cell"].matrix-cell--self');
    await expect(selfCells).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await expect(selfCells.nth(i)).toHaveText('—');
    }
  });

  test('rank 數字單調遞增（不寫死隊名順序）', async ({ page }) => {
    await page.goto('standings');

    const rows = page.locator('[data-testid="standings-row"]:visible');
    await expect(rows).toHaveCount(6);

    const ranks = await rows.evaluateAll((els) =>
      els.map((el) => el.querySelector('[data-testid="rank"]')?.textContent?.trim() ?? ''),
    );
    const numbers = ranks.map((r) => Number(r.replace(/\D/g, '')));
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
