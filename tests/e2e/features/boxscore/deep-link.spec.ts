/**
 * /boxscore 頁面 — Deep Link E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-12（?week=N&game=M → boxscore tab + chip W{N} + scroll + highlight）
 *   AC-12b（從 deep link 切回 leaders → URL 移除 week/game query）
 *
 * Deep Link 規則：
 *   /boxscore?week=N&game=M → boxscore tab + chip W{N} + 第 M 場 highlight + scroll
 *   切回 leaders → URL 清除 tab/week/game
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

test.describe('Boxscore Deep Link @boxscore', () => {
  // ────── AC-12: deep link from /schedule ──────
  test('AC-12: /boxscore?week=5&game=1 → boxscore tab + chip W5 + 第 1 場 highlight + scroll', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?week=5&game=1');

    // 自動切 boxscore tab
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');

    // chip W5 為 active
    const activeChip = page.locator('[data-testid="bs-week-chip"][data-active="true"]');
    await expect(activeChip).toContainText(/5/);

    // 第 1 場卡片 highlight + 在視窗內
    const card = page.locator('[data-testid="bs-game-card"][data-game="1"]');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-highlighted', 'true');
    await expect(card).toBeInViewport({ timeout: 3000 });
  });

  // ────── [qa-v2 補充] 切回 leaders 後 highlight 移除 ──────
  test('[qa-v2 補充] AC-12b: 從 deep link 進入後切回 leaders → URL 移除 week/game query', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?week=5&game=1');

    // leaders tab 為預設，URL 清乾淨（不帶 tab/week/game）— impl 設計
    const leadersTab = page.locator('[data-testid="sub-tab"][data-tab="leaders"]');
    await expect(async () => {
      await leadersTab.click();
      await expect(page).not.toHaveURL(/week=/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/game=/);
    await expect(page).not.toHaveURL(/tab=/);
  });
});
