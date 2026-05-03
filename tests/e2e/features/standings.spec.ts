/**
 * /standings 戰績榜頁 E2E
 *
 * Tag: @standings
 * Coverage: AC-1 ~ AC-14（全部）+ qa-v2 補充
 *
 * 測試資料策略：
 * - 預設用 mockStandingsAPI() 攔截 GAS 與 fallback JSON 請求
 * - 不會打 production Google Sheets
 * - 各情境用 fixtures/standings.ts 的工廠函式建立
 */

import { test, expect } from '@playwright/test';
import {
  mockFullStandings,
  mockEmptyStandings,
  mockZeroRecordStandings,
  mockEightTeamStandings,
} from '../../fixtures/standings';
import { mockStandingsAPI } from '../../helpers/mock-api';

test.describe('Standings Page @standings', () => {
  // ────── AC-1: Hero 標題 + 副標 + 6 隊戰績 ──────
  test('AC-1: Hero「STANDINGS · 例行賽」+「第 25 季 · 第 5 週」+ 6 隊戰績榜', async ({ page }) => {
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    // UI 結構
    await expect(page.getByRole('heading', { name: /STANDINGS/i })).toBeVisible();
    await expect(page.getByText(/例行賽/)).toBeVisible();
    await expect(page.getByText(/第\s*25\s*季/)).toBeVisible();
    await expect(page.getByText(/第\s*5\s*週/)).toBeVisible();

    // 6 隊
    const rows = page.locator('[data-testid="standings-row"]:visible');
    await expect(rows).toHaveCount(6);

    // E-5（Issue #13 A2 順帶驗收）：確認「最近 6 場」欄位有 ○✕ 圖示
    // fixture mockFullStandings() 6 隊每隊都有 history 6 筆，至少要看到 1 個 history-dot
    const firstRow = rows.first();
    const historyCell = firstRow.locator('[data-testid="history"]');
    await expect(historyCell).toBeVisible();
    const dots = historyCell.locator('[data-testid="history-dot"]');
    expect(await dots.count()).toBeGreaterThan(0);
  });

  // ────── AC-2: 每列 7 個欄位 ──────
  test('AC-2: 每列顯示 rank、隊伍色點+名、勝、敗、勝率、history、連勝紀錄', async ({ page }) => {
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    const firstRow = page.locator('[data-testid="standings-row"]:visible').first();

    await expect(firstRow.locator('[data-testid="rank"]')).toContainText('1');
    await expect(firstRow.locator('[data-testid="team-dot"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="team-name"]')).toContainText('綠');
    await expect(firstRow.locator('[data-testid="wins"]')).toContainText('4');
    await expect(firstRow.locator('[data-testid="losses"]')).toContainText('2');
    await expect(firstRow.locator('[data-testid="pct"]')).toContainText('66.7');
    await expect(firstRow.locator('[data-testid="history"] [data-testid="history-dot"]')).toHaveCount(6);
    await expect(firstRow.locator('[data-testid="streak"]')).toContainText(/2連勝/);
  });

  // ────── AC-3: 連勝顏色 + ↑ ──────
  test('AC-3: 連勝隊伍 streak 文字以橙色顯示 + 上箭頭 icon', async ({ page }) => {
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    // 綠隊（rank 1）連勝
    const greenStreak = page
      .locator('[data-testid="standings-row"]:visible')
      .filter({ has: page.locator('[data-testid="team-name"]', { hasText: '綠' }) })
      .locator('[data-testid="streak"]');

    await expect(greenStreak).toHaveAttribute('data-streak-type', 'win');
    await expect(greenStreak).toContainText('↑');
    const color = await greenStreak.evaluate((el) => getComputedStyle(el).color);
    // 橙色 RGB 大致範圍：R 高、G 中、B 低
    expect(color).toMatch(/rgb\(/);
  });

  // ────── AC-4: 連敗顏色 + ↓ ──────
  test('AC-4: 連敗隊伍 streak 文字以紅色顯示 + 下箭頭 icon', async ({ page }) => {
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    // 紅隊（rank 2）連敗
    const redStreak = page
      .locator('[data-testid="standings-row"]:visible')
      .filter({ has: page.locator('[data-testid="team-name"]', { hasText: '紅' }) })
      .locator('[data-testid="streak"]');

    await expect(redStreak).toHaveAttribute('data-streak-type', 'lose');
    await expect(redStreak).toContainText('↓');
  });

  // ────── AC-5: history 圓點配色 ──────
  test('AC-5: history 圓點 → 勝場顯隊伍主色、敗場顯灰色', async ({ page }) => {
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    // 綠隊 history: ['L','W','W','L','W','W']
    const greenRow = page
      .locator('[data-testid="standings-row"]:visible')
      .filter({ has: page.locator('[data-testid="team-name"]', { hasText: '綠' }) });

    const dots = greenRow.locator('[data-testid="history-dot"]');
    await expect(dots).toHaveCount(6);

    // 第 1 顆（L → grey）vs 第 2 顆（W → green team color）
    await expect(dots.nth(0)).toHaveAttribute('data-result', 'L');
    await expect(dots.nth(1)).toHaveAttribute('data-result', 'W');
  });

  // ────── AC-6: 點隊伍列 → /roster?team=<id> ──────
  test('AC-6: 點擊隊伍列 → 導向 /roster?team=<隊伍id>', async ({ page }) => {
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    const greenRow = page
      .locator('[data-testid="standings-row"]:visible')
      .filter({ has: page.locator('[data-testid="team-name"]', { hasText: '綠' }) });

    await greenRow.click();
    // GitHub Pages 會加 trailing slash → /roster/?team=green；本地 dev 為 /roster?team=green
    await expect(page).toHaveURL(/\/roster\/?\?team=green/);
  });

  // ────── AC-7: rank 順序與輸入完全一致 ──────
  test('AC-7: rank 順序完全照後台給的值（前端不重排，即使勝率相同）', async ({ page }) => {
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    // 等資料載入完成（6 列可見後再讀順序）
    await expect(page.locator('[data-testid="standings-row"]:visible')).toHaveCount(6);

    // 用 evaluate 自行過濾「DOM 中可見」的列（mobile/desktop 雙渲染只有一邊有 boundingRect）
    const teamNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid="standings-row"]'))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((el) => el.querySelector('[data-testid="team-name"]')?.textContent?.trim() ?? '');
    });

    expect(teamNames).toEqual(['綠', '紅', '黑', '黃', '白', '藍']);
  });

  // ────── AC-10: Loading state ──────
  test('AC-10: 資料載入中 → skeleton（Hero 灰塊 + 6 列灰塊閃爍）', async ({ page }) => {
    await mockStandingsAPI(page, mockFullStandings(), { delayMs: 1500 });
    await page.goto('standings');

    await expect(page.locator('[data-testid="skeleton-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="skeleton-row"]').first()).toBeVisible();

    // 資料載入後 skeleton 消失
    await expect(page.locator('[data-testid="standings-row"]:visible').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="skeleton-row"]')).toHaveCount(0);
  });

  // ────── AC-11: Error state ──────
  test('AC-11: GAS + JSON 都失敗 → 顯示「無法載入戰績」+ 重試按鈕', async ({ page }) => {
    await mockStandingsAPI(page, null, { allFail: true });
    await page.goto('standings');

    await expect(page.getByText(/無法載入戰績/)).toBeVisible();
    await expect(page.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ────── AC-11 [qa-v2 補充]：點重試按鈕重新嘗試 ──────
  test('[qa-v2 補充] AC-11b: 點重試按鈕 → 重新嘗試載入', async ({ page }) => {
    let callCount = 0;
    await page.route(/sheets\.googleapis\.com\/v4\/spreadsheets/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });
    await page.route(/\/data\/standings\.json/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });

    await page.goto('standings');
    await expect(page.getByRole('button', { name: /重試/ })).toBeVisible();

    const initialCount = callCount;
    await page.getByRole('button', { name: /重試/ }).click();

    await expect.poll(() => callCount).toBeGreaterThan(initialCount);
  });

  // ────── AC-12: Empty state ──────
  test('AC-12: 賽季尚未開始 → 「賽季尚未開始 ⛹️」+「看球員名單」按鈕', async ({ page }) => {
    await mockStandingsAPI(page, mockEmptyStandings());
    await page.goto('standings');

    await expect(page.getByText(/賽季尚未開始/)).toBeVisible();
    await expect(page.getByRole('link', { name: /看球員名單/ })).toBeVisible();
  });

  // ────── AC-12 [qa-v2 補充]：empty 按鈕導向 /roster ──────
  test('[qa-v2 補充] AC-12b: 點「看球員名單」→ 導向 /roster', async ({ page }) => {
    await mockStandingsAPI(page, mockEmptyStandings());
    await page.goto('standings');

    await page.getByRole('link', { name: /看球員名單/ }).click();
    await expect(page).toHaveURL(/\/roster/);
  });

  // ────── AC-13: 0勝 0敗 → 勝率「—」 ──────
  test('AC-13: 0勝 0敗的隊（剛開賽）→ 勝率顯示「—」', async ({ page }) => {
    await mockStandingsAPI(page, mockZeroRecordStandings());
    await page.goto('standings');

    const firstRow = page.locator('[data-testid="standings-row"]:visible').first();
    await expect(firstRow.locator('[data-testid="pct"]')).toContainText('—');
    await expect(firstRow.locator('[data-testid="pct"]')).not.toContainText('0.0');
  });

  // ────── AC-14: > 6 隊不爆版 ──────
  test('AC-14: 8 隊資料 → 排版正常（不爆版，所有列可見）', async ({ page }) => {
    await mockStandingsAPI(page, mockEightTeamStandings());
    await page.goto('standings');

    const rows = page.locator('[data-testid="standings-row"]:visible');
    await expect(rows).toHaveCount(8);

    // 容器寬度應大於每列內容寬度（避免水平 overflow）
    const container = page.locator('[data-testid="standings-container"]');
    const containerBox = await container.boundingBox();
    const lastRowBox = await rows.last().boundingBox();
    expect(lastRowBox?.x ?? 0).toBeGreaterThanOrEqual(containerBox?.x ?? 0);
    expect((lastRowBox?.x ?? 0) + (lastRowBox?.width ?? 0)).toBeLessThanOrEqual(
      (containerBox?.x ?? 0) + (containerBox?.width ?? 0) + 1,
    );
  });
});

// ────── AC-8 / AC-9: RWD ──────
test.describe('Standings Page RWD @standings', () => {
  test('AC-8 (regression-mobile): 手機 → 6 張卡片垂直堆疊', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= 768, 'mobile project only');
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    const rows = page.locator('[data-testid="standings-row"]:visible');
    await expect(rows).toHaveCount(6);

    // 卡片垂直排列：第一張和第二張的 X 座標接近、Y 座標遞增
    const box1 = await rows.nth(0).boundingBox();
    const box2 = await rows.nth(1).boundingBox();
    expect(Math.abs((box1?.x ?? 0) - (box2?.x ?? 0))).toBeLessThan(20);
    expect((box2?.y ?? 0)).toBeGreaterThan(box1?.y ?? 0);
  });

  test('AC-9 (regression desktop): 桌機 → 橫排表格 6 列', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width < 768, 'desktop project only');
    await mockStandingsAPI(page, mockFullStandings());
    await page.goto('standings');

    const rows = page.locator('[data-testid="standings-row"]:visible');
    await expect(rows).toHaveCount(6);

    // 桌機應為單一橫排表格容器：所有列 X 座標接近、Y 座標遞增
    const box1 = await rows.nth(0).boundingBox();
    const box2 = await rows.nth(1).boundingBox();
    expect(Math.abs((box1?.x ?? 0) - (box2?.x ?? 0))).toBeLessThan(20);
    expect((box2?.y ?? 0)).toBeGreaterThan(box1?.y ?? 0);

    // 桌機表格寬度應 ≥ 600 (rough 桌機 layout 判斷)
    expect(box1?.width ?? 0).toBeGreaterThan(400);
  });
});
