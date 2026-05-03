/**
 * /standings 戰績矩陣 E2E
 *
 * Tags: @standings @issue-14 @matrix
 * Coverage: E-201 (B-3.1) E-202 (B-3.2) E-203 (B-3.3) E-204 (AC-E1) E-205 (BQ-1)
 *
 * 資料策略：mockStandingsWithMatrix() 攔截 /data/standings.json。
 * allFail:true 讓 Sheets + fallback 雙 500。delayMs:1500 觸發 loading 狀態。
 * 三狀態（loading/error）可複用 standings 頁面層級的 SkeletonState / ErrorState，
 * 若實作不另加 matrix-skeleton / matrix-error，本 spec 聲明此為合法設計。
 * MatrixCell = number | null；對角線 null → 顯「—」；mockMatrix6x6() 含正/負/null 三種值。
 */

import { test, expect } from '@playwright/test';
import { mockStandingsWithMatrix } from '../../../fixtures/standings';
import { mockStandingsAPI } from '../../../helpers/mock-api';

// E-201 + E-202 + E-203: 矩陣結構、對角線、顏色 class
test.describe('Standings Matrix — structure & cell styles @standings @issue-14 @matrix', () => {
  test('E-201: 戰績矩陣區塊可見，矩陣表格有 6 行 × 6 欄',
    { tag: ['@standings', '@issue-14', '@matrix'] },
    async ({ page }) => {
      const data = mockStandingsWithMatrix();
      await mockStandingsAPI(page, data);
      const response = page.waitForResponse(/standings\.json/);
      await page.goto('standings');
      await response;

      // UI 結構
      const section = page.getByTestId('standings-matrix');
      await expect(section).toBeVisible();
      await expect(section.getByRole('heading')).toBeVisible();

      const table = page.getByTestId('matrix-table');
      await expect(table).toBeVisible();

      // 6 列資料列（不含 header row）
      const bodyRows = table.locator('tbody tr');
      await expect(bodyRows).toHaveCount(6);
      await expect(bodyRows.first().getByTestId('matrix-cell')).toHaveCount(6);

      // 資料驗證：全表格共 36 個 matrix-cell
      await expect(table.getByTestId('matrix-cell')).toHaveCount(36);
    },
  );

  test('E-202: 對角線 6 格（自己對自己）顯示「—」',
    { tag: ['@standings', '@issue-14', '@matrix'] },
    async ({ page }) => {
      const data = mockStandingsWithMatrix();
      await mockStandingsAPI(page, data);
      const response = page.waitForResponse(/standings\.json/);
      await page.goto('standings');
      await response;

      const table = page.getByTestId('matrix-table');
      await expect(table).toBeVisible();

      // 互動：對角線 6 格均帶 matrix-cell--self class
      const selfCells = table.locator('[data-testid="matrix-cell"].matrix-cell--self');
      await expect(selfCells).toHaveCount(6);

      // 資料驗證：每個 self cell 顯示破折號「—」
      for (let i = 0; i < 6; i++) await expect(selfCells.nth(i)).toHaveText('—');
    },
  );

  test('E-203: 正分 cell 有 matrix-cell--positive class，負分有 matrix-cell--negative class',
    { tag: ['@standings', '@issue-14', '@matrix'] },
    async ({ page }) => {
      const data = mockStandingsWithMatrix();
      await mockStandingsAPI(page, data);
      const response = page.waitForResponse(/standings\.json/);
      await page.goto('standings');
      await response;

      const table = page.getByTestId('matrix-table');
      await expect(table).toBeVisible();

      // UI 結構：fixture 保證各 row 含正分與負分 cell
      const positiveCells = table.locator('[data-testid="matrix-cell"].matrix-cell--positive');
      const negativeCells = table.locator('[data-testid="matrix-cell"].matrix-cell--negative');
      await expect(positiveCells.first()).toBeVisible();
      await expect(negativeCells.first()).toBeVisible();

      // 互動：class 與 data-net-points 數值一致
      const posPoints = await positiveCells.first().getAttribute('data-net-points');
      const negPoints = await negativeCells.first().getAttribute('data-net-points');
      expect(Number(posPoints)).toBeGreaterThan(0);
      expect(Number(negPoints)).toBeLessThan(0);

      // 資料驗證：class 不互相污染
      await expect(positiveCells.first()).not.toHaveClass(/matrix-cell--negative/);
      await expect(negativeCells.first()).not.toHaveClass(/matrix-cell--positive/);
    },
  );
});

// E-204: 手機矩陣橫向捲動
test.describe('Standings Matrix — mobile scroll @standings @issue-14 @matrix', () => {
  test('E-204: 手機（375px）矩陣捲動包裹器有 overflow-x-auto 或 scrollWidth > clientWidth',
    { tag: ['@standings', '@issue-14', '@matrix'] },
    async ({ page }) => {
      const data = mockStandingsWithMatrix();
      await mockStandingsAPI(page, data);

      // 互動：切至手機 viewport
      await page.setViewportSize({ width: 375, height: 812 });
      const response = page.waitForResponse(/standings\.json/);
      await page.goto('standings');
      await response;

      // UI 結構：捲動包裹器可見
      const scrollWrapper = page.getByTestId('matrix-scroll');
      await expect(scrollWrapper).toBeVisible();

      // 資料驗證：方式 A — 驗 Tailwind class；方式 B — 驗 scrollWidth > clientWidth（任一成立即可）
      const hasOverflowClass = await scrollWrapper.evaluate((el) =>
        el.classList.contains('overflow-x-auto') || el.classList.contains('overflow-x-scroll'),
      );
      const isScrollable = await scrollWrapper.evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(hasOverflowClass || isScrollable).toBe(true);
    },
  );
});

// E-205: 矩陣三狀態（loading / error / 正常）
test.describe('Standings Matrix — three states @standings @issue-14 @matrix', () => {
  test('E-205-loading: 資料載入中 → skeleton 可見，矩陣表格尚未出現',
    { tag: ['@standings', '@issue-14', '@matrix'] },
    async ({ page }) => {
      const data = mockStandingsWithMatrix();
      await mockStandingsAPI(page, data, { delayMs: 1500 });
      await page.goto('standings');

      // UI 結構：skeleton 可見（matrix-skeleton 或頁面層級 skeleton-hero 均合法）
      const skeleton = page.locator('[data-testid="matrix-skeleton"], [data-testid="skeleton-hero"]').first();
      await expect(skeleton).toBeVisible();
      // 互動：資料完成後矩陣出現；資料驗證：matrix-skeleton 消失
      await expect(page.getByTestId('matrix-table')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="matrix-skeleton"]')).toHaveCount(0);
    },
  );

  test('E-205-error: GAS + JSON 雙失敗 → 顯示 error 狀態，矩陣表格不存在',
    { tag: ['@standings', '@issue-14', '@matrix'] },
    async ({ page }) => {
      await mockStandingsAPI(page, null, { allFail: true });
      await page.goto('standings');

      // UI 結構：error 可見（matrix-error 或頁面層級 error-state 均合法）
      const errorEl = page.locator('[data-testid="matrix-error"], [data-testid="error-state"]').first();
      await expect(errorEl).toBeVisible();
      // 互動：重試按鈕可見；資料驗證：矩陣表格不存在
      await expect(page.getByRole('button', { name: /重試/ })).toBeVisible();
      await expect(page.getByTestId('matrix-table')).toHaveCount(0);
    },
  );

  test('E-205-ok: 正常資料 → 矩陣區塊存在，skeleton 與 error 均不存在',
    { tag: ['@standings', '@issue-14', '@matrix'] },
    async ({ page }) => {
      const data = mockStandingsWithMatrix();
      await mockStandingsAPI(page, data);
      const response = page.waitForResponse(/standings\.json/);
      await page.goto('standings');
      await response;

      // UI 結構
      await expect(page.getByTestId('standings-matrix')).toBeVisible();
      await expect(page.getByTestId('matrix-table')).toBeVisible();
      // 互動 & 資料驗證：skeleton / error 不存在，36 cells 全數渲染
      await expect(page.locator('[data-testid="matrix-skeleton"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="matrix-error"]')).toHaveCount(0);
      await expect(page.getByTestId('matrix-cell')).toHaveCount(36);
    },
  );
});
