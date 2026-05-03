/**
 * /boxscore 頁面 — Boxscore Tab：Game Cards E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-4（每場標題 + 雙隊表格 + 工作人員 collapsible 預設摺疊）
 *   AC-4b（點工作人員箭頭 → 展開/收起）
 *   E-6（Issue #13 A3 順帶驗收：「逐場 Box」分頁有比分卡片 + 比分文字）
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Tab — Game Cards @boxscore', () => {
  // ────── AC-4: 每場顯示標題 + 雙隊表格 + 工作人員 collapsible ──────
  test('AC-4: 每場標題 + 雙隊表格 + 工作人員 collapsible（預設摺疊）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstCard = page.locator('[data-testid="bs-game-card"]').first();
    await expect(firstCard.locator('[data-testid="bs-game-title"]')).toBeVisible();

    // 雙隊表格
    await expect(firstCard.locator('[data-testid="bs-team-table"]')).toHaveCount(2);

    // 工作人員預設摺疊
    const staffPanel = firstCard.locator('[data-testid="bs-staff-panel"]');
    await expect(staffPanel).toBeHidden();
    const toggle = firstCard.locator('[data-testid="bs-staff-toggle"]');
    await expect(toggle).toBeVisible();
  });

  // ────── AC-4b: 點 toggle 展開工作人員 ──────
  test('AC-4b: 點工作人員箭頭 → 展開/收起', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const card = page.locator('[data-testid="bs-game-card"]').first();
    const toggle = card.locator('[data-testid="bs-staff-toggle"]');
    const panel = card.locator('[data-testid="bs-staff-panel"]');

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/裁判/);

    await toggle.click();
    await expect(panel).toBeHidden();
  });

  // ────── E-6（Issue #13 A3 順帶驗收）：逐場 Box 分頁有比分 ──────
  test('逐場 Box 分頁載入時顯示該週比分（Issue #13 A3 / E-6）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    // 比分卡片可見（fixture 預期該週有 6 場）
    const gameCards = page.locator('[data-testid="bs-game-card"]');
    await expect(gameCards.first()).toBeVisible({ timeout: 5000 });
    expect(await gameCards.count()).toBeGreaterThan(0);

    // 至少第一張卡片顯示比分文字（fixture 第 1 場固定比分 34 vs 22）
    const firstTitle = gameCards.first().locator('[data-testid="bs-game-title"]');
    await expect(firstTitle).toBeVisible();
    await expect(firstTitle).toContainText(/\d+\s*vs\s*\d+/i);
  });
});
