/**
 * /boxscore 頁面 — Three-State（Loading / Error / Empty）E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-17（資料載入中 → skeleton → 載入後 skeleton 消失）
 *   AC-18（Sheets API 失敗 → 限縮錯誤 + 重試按鈕）
 *   AC-18b（boxscore 失敗切到 leaders → leaders 仍正常）
 *   AC-19（leaders endpoint 失敗 → 限縮錯誤 + 重試按鈕）
 *   AC-19b（重試按鈕 → 重新 fetch leaders）
 *   AC-20（該週 boxscore 為空 → empty state）
 *   AC-21（leaders 全空 → empty state）
 *   AC-21b（leaders 部分類別空 → 個別空卡，其他正常）[qa-v2 補充]
 *
 * 錯誤限縮原則：boxscore 失敗不影響 leaders panel，反之亦然
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
  mockEmptyLeaders,
  mockPartialLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
  mockBoxscoreSheetsAPI,
  mockLeadersAPI,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Three-State (Loading / Error / Empty) @boxscore', () => {
  // ────── AC-17: skeleton 載入中 ──────
  test('AC-17: 資料載入中 → 看到 skeleton', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES, { delayMs: 1500 });
    await mockLeadersAPI(page, mockFullLeaders(), { delayMs: 1500 });
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-skeleton"]')).toBeVisible();
    // 載入後 skeleton 消失
    await expect(page.locator('[data-testid="bs-game-card"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="bs-skeleton"]')).toHaveCount(0);
  });

  // ────── AC-18: boxscore Sheets API 失敗 → 限縮錯誤 ──────
  test('AC-18: Sheets API 失敗（boxscore） → 「無法載入逐場數據」+ 重試（限縮 boxscore 區塊）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    const error = page.locator('[data-testid="bs-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/無法載入逐場數據|無法載入Box/);
    await expect(error.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ────── AC-18b: 切到 leaders tab 仍正常 ──────
  test('AC-18b: boxscore 失敗時切到 leaders tab → leaders 仍正常顯示（錯誤限縮）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-error"]')).toBeVisible();
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-error"]')).toHaveCount(0);
  });

  // ────── AC-19: leaders endpoint 失敗 → 限縮錯誤 ──────
  test('AC-19: leaders stats endpoint 失敗 → 「無法載入領先榜」+ 重試（限縮 leaders 區塊）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, null, { allFail: true });
    await page.goto('boxscore?tab=leaders');

    const error = page.locator('[data-testid="leaders-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/無法載入領先榜|無法載入排行/);
    await expect(error.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ────── AC-19b: 重試按鈕觸發再次 fetch ──────
  test('AC-19b: 點重試按鈕 → 重新 fetch leaders', async ({ page }) => {
    let callCount = 0;
    await page.route(/script\.google\.com\/macros\/s\/.+\/exec\?type=stats/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });
    await page.route(/\/data\/(leaders|stats)\.json$/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await page.goto('boxscore?tab=leaders');

    const retry = page.locator('[data-testid="leaders-error"]').getByRole('button', { name: /重試/ });
    await expect(retry).toBeVisible();

    const initial = callCount;
    await retry.click();
    await expect.poll(() => callCount).toBeGreaterThan(initial);
  });

  // ────── AC-20: 該週 boxscore 為空 ──────
  test('AC-20: 該週 boxscore 為空 → 「該週尚無 Box Score」', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, []); // 完全沒有 games
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="bs-empty"]')).toContainText(/尚無\s*Box\s*Score/i);
  });

  // ────── AC-21: leaders 全空 ──────
  test('AC-21: leaders 全空（賽季初）→ 「賽季初尚無球員數據」', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, mockEmptyLeaders());
    await page.goto('boxscore?tab=leaders');

    await expect(page.locator('[data-testid="leaders-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-empty"]')).toContainText(/賽季初|尚無球員數據/);
  });

  // ────── [qa-v2 補充] 部分類別空 ──────
  test('[qa-v2 補充] AC-21b: leaders 部分類別空 → 個別卡片顯示 empty，其他正常', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, mockPartialLeaders());
    await page.goto('boxscore?tab=leaders');

    // scoring 有資料
    await expect(page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"]')).toHaveCount(10);
    // rebound 空（fixture 設定）
    const reboundCard = page.locator('[data-testid="leaders-card"][data-category="rebound"]');
    await expect(reboundCard).toBeVisible();
    await expect(reboundCard.locator('[data-testid="leader-row"]')).toHaveCount(0);
  });
});
