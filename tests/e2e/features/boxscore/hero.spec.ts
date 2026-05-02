/**
 * /boxscore 頁面 — Hero Header E2E
 *
 * @tag @boxscore
 * Coverage: AC-1（Hero header 顯示 + 副標）、AC-1b（副標隨 active tab 動態變化）
 *
 * 測試資料策略：
 * - mockBoxscoreAndLeaders() 攔截 Sheets API（直打）+ GAS stats endpoint
 * - 不打 production Google Sheets / GAS
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

test.describe('Boxscore Page — Hero @boxscore', () => {
  // ────── AC-1: Hero header 顯示 + 副標 ──────
  test('AC-1: 訪客打開 /boxscore → Hero header「DATA · 第 25 季」', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore');

    // UI 結構
    const hero = page.locator('[data-testid="data-hero"]');
    await expect(hero).toBeVisible();
    await expect(hero.locator('[data-testid="hero-title"]')).toContainText(/DATA/i);
    await expect(hero.locator('[data-testid="hero-title"]')).toContainText(/第\s*25\s*季|S25/);
  });

  // ────── AC-1 副標動態 ──────
  test('AC-1b: Hero 副標依 active tab 動態變化（leaders → boxscore）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore'); // 預設 leaders

    const subtitle = page.locator('[data-testid="hero-subtitle"]');
    await expect(subtitle).toContainText(/領先榜/);

    // 切到 boxscore tab — toPass retry 容忍 hydration 競態
    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    await expect(async () => {
      await boxscoreTab.click();
      await expect(subtitle).toContainText(/逐場\s*Box/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
  });
});
