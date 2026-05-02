/**
 * /roster 頁面 — RWD 回歸 E2E
 *
 * @tag @roster
 * Coverage:
 *   AC-13（手機 < 768px → 球員名單卡片直排；龍虎榜每位球員一張卡片）
 *   AC-14（桌機 ≥ 768px → 球員名單表格；龍虎榜表格）
 *
 * 執行策略：
 *   AC-13 在 regression-mobile project 跑（viewport.width < 768），desktop skip
 *   AC-14 在 regression project 跑（viewport.width ≥ 768），mobile skip
 */

import { test, expect } from '@playwright/test';
import { mockFullRoster } from '../../../fixtures/roster';
import { mockFullDragonboard } from '../../../fixtures/dragon';
import { mockRosterAndDragon } from '../../../helpers/mock-api';

test.describe('Roster Page RWD @roster', () => {
  // ────── AC-14 desktop ──────
  test('AC-14 (desktop): 桌機 ≥768 → 球員名單表格 + 龍虎榜表格', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width < 768, 'desktop project only');
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    // 球員名單：使用 table
    const rosterTable = page.locator('[data-testid="roster-table"]').first();
    await expect(rosterTable).toBeVisible();

    // 切到龍虎榜
    await page.locator('[data-testid="sub-tab"][data-tab="dragon"]').click();
    const dragonTable = page.locator('[data-testid="dragon-table"]');
    await expect(dragonTable).toBeVisible();
  });

  // ────── AC-13 mobile ──────
  test('AC-13 (regression-mobile): 手機 <768 → 球員名單卡片直排 + 龍虎榜卡片', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= 768, 'mobile project only');
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    // 球員名單：使用卡片版面
    const rosterCards = page.locator('[data-testid="roster-player-card"]');
    await expect(rosterCards.first()).toBeVisible();

    // 切到龍虎榜
    await page.locator('[data-testid="sub-tab"][data-tab="dragon"]').click();
    const dragonCards = page.locator('[data-testid="dragon-player-card"]');
    await expect(dragonCards.first()).toBeVisible();
  });
});
