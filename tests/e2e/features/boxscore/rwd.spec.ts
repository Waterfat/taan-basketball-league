/**
 * /boxscore 頁面 — RWD 回歸 E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-15（桌機 ≥768 → boxscore 11 欄完整 + leaders 兩欄並排）
 *   AC-16（手機 <768 → boxscore 表格橫向捲動 + leaders 垂直堆疊）
 *
 * 執行策略：
 *   AC-15 在 desktop project 跑（viewport.width ≥ 768）
 *   AC-16 在 mobile project 跑（viewport.width < 768）
 *   各自用 test.skip() 過濾
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

test.describe('Boxscore Page RWD @boxscore', () => {
  // ────── AC-15 desktop ──────
  test('AC-15 (regression desktop): 桌機 ≥768 → boxscore 11 欄完整 + leaders 兩欄並排', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width < 768, 'desktop project only');
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const headers = page.locator('[data-testid="bs-team-table"]').first().locator('thead th');
    await expect(headers).toHaveCount(11);

    // leaders tab 兩欄並排：scoring 和第二張卡 Y 接近
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    const cards = page.locator('[data-testid="leaders-card"]');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    expect(Math.abs((box1?.y ?? 0) - (box2?.y ?? 0))).toBeLessThan(20);
    expect((box2?.x ?? 0)).toBeGreaterThan(box1?.x ?? 0);
  });

  // ────── AC-16 mobile ──────
  test('AC-16 (regression-mobile): 手機 <768 → boxscore 表格橫向捲動 + leaders 垂直堆疊', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= 768, 'mobile project only');
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    // 表格容器應 overflow-x scrollable
    const tableContainer = page.locator('[data-testid="bs-team-table"]').first().locator('..');
    const overflowX = await tableContainer.evaluate((el) => getComputedStyle(el).overflowX);
    expect(['auto', 'scroll']).toContain(overflowX);

    // leaders 垂直堆疊：兩張卡 X 接近
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    const cards = page.locator('[data-testid="leaders-card"]');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    expect(Math.abs((box1?.x ?? 0) - (box2?.x ?? 0))).toBeLessThan(20);
    expect((box2?.y ?? 0)).toBeGreaterThan(box1?.y ?? 0);
  });
});
