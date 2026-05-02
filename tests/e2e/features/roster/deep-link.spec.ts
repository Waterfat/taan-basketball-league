/**
 * /roster 頁面 — Deep Link（?team=<id>）E2E
 *
 * @tag @roster @deep-link
 * Coverage:
 *   AC-11（?team=red → 自動切球員名單 tab + scroll 到紅隊 section + 邊框 highlight）
 *   AC-12（?team=invalid → 預設行為，無 scroll、無 highlight、不報錯）
 *
 * 測試資料策略：
 *   靜態前置條件：mockFullRoster() + mockFullDragonboard()
 */

import { test, expect } from '@playwright/test';
import { mockFullRoster } from '../../../fixtures/roster';
import { mockFullDragonboard } from '../../../fixtures/dragon';
import { mockRosterAndDragon } from '../../../helpers/mock-api';

test.describe('Roster Page — Deep Link @roster @deep-link', () => {
  // ────── AC-11: deep link ?team=red ──────
  test('AC-11a: /roster?team=red → 自動切換到球員名單 tab', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?team=red');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="roster"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="roster-tab-panel"]')).toBeVisible();
  });

  test('AC-11b: /roster?team=red → 紅隊 section 邊框 highlight（data-highlighted="true"）', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?team=red');

    const redSection = page.locator('[data-testid="roster-team-section"][data-team-id="red"]');
    await expect(redSection).toHaveAttribute('data-highlighted', 'true');
  });

  test('AC-11c: /roster?team=red → 其他隊 section 無 highlight', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?team=red');

    const otherSections = page.locator(
      '[data-testid="roster-team-section"]:not([data-team-id="red"])',
    );
    for (let i = 0; i < await otherSections.count(); i++) {
      await expect(otherSections.nth(i)).not.toHaveAttribute('data-highlighted', 'true');
    }
  });

  // ────── AC-12: ?team=invalid ──────
  test('AC-12: /roster?team=invalid → 頁面正常顯示，無 highlight，不報錯', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?team=invalid_team_xyz');

    // 頁面應正常渲染（6 隊都可見）
    await expect(page.locator('[data-testid="roster-team-section"]')).toHaveCount(6);

    // 無任何 section 被 highlight
    await expect(page.locator('[data-testid="roster-team-section"][data-highlighted="true"]')).toHaveCount(0);
  });
});
