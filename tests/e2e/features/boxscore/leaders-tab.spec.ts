/**
 * /boxscore 頁面 — Leaders Tab E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-9（leaders tab 顯示 6 類別獨立卡片）
 *   AC-9b（每個類別卡片含 top 10）
 *   AC-10（每位球員顯示 rank、名字、隊色點、數值）
 *   AC-10b（scoring 卡片顯示進階指標 2P%/3P%/FT%）
 *   AC-10c（rebound 卡片顯示進階指標 進攻/防守籃板）
 *
 * 類別清單：scoring / rebound / assist / steal / block / eff
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Leaders Tab @boxscore', () => {
  // ────── AC-9: 6 類別獨立卡片 ──────
  test('AC-9: leaders tab 顯示 6 類別獨立卡片', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const cards = page.locator('[data-testid="leaders-card"]');
    await expect(cards).toHaveCount(6);

    for (const cat of ['scoring', 'rebound', 'assist', 'steal', 'block', 'eff']) {
      await expect(page.locator(`[data-testid="leaders-card"][data-category="${cat}"]`)).toBeVisible();
    }
  });

  // ────── AC-9b: 每類 top 10 ──────
  test('AC-9b: 每個類別卡片含 top 10', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const scoringCard = page.locator('[data-testid="leaders-card"][data-category="scoring"]');
    const rows = scoringCard.locator('[data-testid="leader-row"]');
    await expect(rows).toHaveCount(10);
  });

  // ────── AC-10: 球員顯示 rank/名字/隊色點/數值 ──────
  test('AC-10: 每位球員顯示 rank、名字、隊色點、數值', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstRow = page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"][data-rank="1"]');
    await expect(firstRow).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-name"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-team-dot"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-val"]')).toContainText(/\d/);
  });

  // ────── AC-10b: scoring 進階指標 2P%/3P%/FT% ──────
  test('AC-10b: scoring 卡片顯示進階指標 2P%/3P%/FT%', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstScoring = page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"]').first();
    const advanced = firstScoring.locator('[data-testid="leader-advanced"]');
    await expect(advanced).toContainText(/%/);
  });

  // ────── AC-10c: rebound 進階指標 進攻/防守籃板 ──────
  test('AC-10c: rebound 卡片顯示進階指標（進攻/防守籃板）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstRebound = page.locator('[data-testid="leaders-card"][data-category="rebound"] [data-testid="leader-row"]').first();
    const advanced = firstRebound.locator('[data-testid="leader-advanced"]');
    await expect(advanced).toContainText(/\d/);
  });
});
