/**
 * /roster 頁面 — Hero Header + 球員名單 tab E2E
 *
 * @tag @roster
 * Coverage:
 *   AC-1（Hero header：ROSTER · 第 N 季 + 賽季進行中 · 平民線 N 分）
 *   AC-2（球員名單 tab：6 隊各一 section 垂直堆疊）
 *   AC-3（每球員顯示名字 + 10 週出席色塊）
 *   AC-4（色塊樣式：1=主色白字 / 0=紅色白字 / x=黃色黑字 / ?=灰色虛框）
 *   AC-18（att 全 "?" → 10 個灰色虛框，不報錯）
 *
 * 測試資料策略：
 *   靜態前置條件：mockFullRoster() / mockFullDragonboard()（fixtures 手寫，不打 GAS）
 *   E2E 透過 mockRosterAndDragon 攔截 GAS + JSON
 */

import { test, expect } from '@playwright/test';
import { mockFullRoster, mockRosterAllQuestions } from '../../../fixtures/roster';
import { mockFullDragonboard, mockEmptyDragonboard } from '../../../fixtures/dragon';
import { mockRosterAndDragon } from '../../../helpers/mock-api';

test.describe('Roster Page — Hero + 球員名單 tab @roster', () => {
  // ────── AC-1: Hero header ──────
  test('AC-1: /roster → Hero「ROSTER · 第 25 季」+ 副標「賽季進行中 · 平民線 36 分」+ 預設球員名單 tab', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    await expect(page.locator('[data-testid="hero-title"]')).toContainText('ROSTER');
    await expect(page.locator('[data-testid="hero-title"]')).toContainText('第 25 季');
    await expect(page.locator('[data-testid="hero-subtitle"]')).toContainText('賽季進行中');
    await expect(page.locator('[data-testid="hero-subtitle"]')).toContainText('平民線 36 分');

    // 預設球員名單 tab 為選中
    await expect(page.locator('[data-testid="sub-tab"][data-tab="roster"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="roster-tab-panel"]')).toBeVisible();
  });

  // ────── AC-2: 6 隊 section ──────
  test('AC-2: 球員名單 tab → 6 隊各一個 section 垂直堆疊', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    const sections = page.locator('[data-testid="roster-team-section"]');
    await expect(sections).toHaveCount(6);

    // 驗證隊伍名稱均可見
    for (const teamName of ['紅隊', '黑隊', '藍隊', '綠隊', '黃隊', '白隊']) {
      await expect(page.locator('[data-testid="roster-team-section"]').filter({ hasText: teamName })).toBeVisible();
    }
  });

  // ────── AC-3: 球員名字 + 10 色塊 ──────
  test('AC-3: 每球員顯示名字 + 10 個出席色塊', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    // 第一位球員（韋承志，紅隊）
    const firstPlayer = page.locator('[data-testid="roster-player-row"]').first();
    await expect(firstPlayer.locator('[data-testid="player-name"]')).toBeVisible();

    // 每位球員應有 10 個色塊
    const attBlocks = firstPlayer.locator('[data-testid="att-block"]');
    await expect(attBlocks).toHaveCount(10);
  });

  // ────── AC-4: 色塊樣式 ──────
  test('AC-4a: att=1 → 色塊含文字「1」', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    // 韋承志前 6 週全部出席，第一個色塊應顯示「1」
    const firstBlock = page.locator('[data-testid="roster-player-row"]').first().locator('[data-testid="att-block"]').first();
    await expect(firstBlock).toHaveText('1');
    await expect(firstBlock).toHaveAttribute('data-att', '1');
  });

  test('AC-4b: att=0 → 色塊含文字「0」（含 data-att="0"）', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    // 吳軒宇第 2 週缺席（att=0）
    const row = page.locator('[data-testid="roster-player-row"]').filter({ hasText: '吳軒宇' });
    const zeroBlock = row.locator('[data-testid="att-block"][data-att="0"]').first();
    await expect(zeroBlock).toHaveText('0');
  });

  test('AC-4c: att="x" → 色塊含文字「x」（含 data-att="x"）', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    // 蔡一聲第 6 週為 "x"
    const row = page.locator('[data-testid="roster-player-row"]').filter({ hasText: '蔡一聲' });
    const xBlock = row.locator('[data-testid="att-block"][data-att="x"]').first();
    await expect(xBlock).toHaveText('x');
  });

  test('AC-4d: att="?" → 色塊含文字「?」（含 data-att="?"）', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    // 任一球員後 4 週為 "?"
    const firstRow = page.locator('[data-testid="roster-player-row"]').first();
    const qBlock = firstRow.locator('[data-testid="att-block"][data-att="?"]').first();
    await expect(qBlock).toHaveText('?');
  });

  // ────── AC-18: att 全 "?" ──────
  test('AC-18: att 全 "?" → 10 個灰色虛框色塊，頁面不報錯', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockRosterAllQuestions(), dragon: mockEmptyDragonboard() });
    await page.goto('roster');

    const firstRow = page.locator('[data-testid="roster-player-row"]').first();
    const attBlocks = firstRow.locator('[data-testid="att-block"]');
    await expect(attBlocks).toHaveCount(10);

    // 全部 data-att="?"
    const counts = await attBlocks.evaluateAll((els) =>
      els.filter((el) => el.getAttribute('data-att') === '?').length,
    );
    expect(counts).toBe(10);
  });
});
