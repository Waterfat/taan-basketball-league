/**
 * /roster 頁面 — 龍虎榜 tab E2E
 *
 * @tag @roster @dragon
 * Coverage:
 *   AC-5（切換 tab → URL ?tab=dragon，重整仍顯示）
 *   AC-6（龍虎榜欄位：rank/球員/隊/icon/出席/輪值/拖地/季後賽/總分）
 *   AC-7（total > civilianThreshold → 金色背景）
 *   AC-8（threshold 位置顯示平民線分隔線）
 *   AC-9（tag="裁" → ⚖️ icon；tag=null → 不顯示）
 *   AC-10（playoff=null → 顯示「—」）
 *   AC-19（dragon.players 空 → 「龍虎榜資料尚未產生」訊息）
 *   AC-20（球員不可點，純展示）[qa-v2 補充]
 *
 * 測試資料策略：
 *   靜態前置條件：mockDragonboardWithThreshold()（threshold=10，rank 1-2 超過）
 *   空狀態：mockEmptyDragonboard()（players=[]）
 */

import { test, expect } from '@playwright/test';
import { mockFullRoster } from '../../../fixtures/roster';
import { mockFullDragonboard, mockDragonboardWithThreshold, mockEmptyDragonboard } from '../../../fixtures/dragon';
import { mockRosterAndDragon } from '../../../helpers/mock-api';

test.describe('Roster Page — 龍虎榜 tab @roster @dragon', () => {
  // ────── AC-5: tab 切換 + URL ──────
  test('AC-5a: 點「積分龍虎榜」tab → URL 含 ?tab=dragon', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster');

    await page.locator('[data-testid="sub-tab"][data-tab="dragon"]').click();

    await expect(page).toHaveURL(/[?&]tab=dragon/);
    await expect(page.locator('[data-testid="dragon-tab-panel"]')).toBeVisible();
  });

  test('AC-5b: 直接打開 /roster?tab=dragon → 龍虎榜 tab 仍顯示（重整保持）', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?tab=dragon');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="dragon"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="dragon-tab-panel"]')).toBeVisible();
  });

  // ────── AC-6: 龍虎榜欄位 ──────
  test('AC-6: 龍虎榜表格顯示 9 個欄位（rank/球員/隊/icon/出席/輪值/拖地/季後賽/總分）', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?tab=dragon');

    const headers = page.locator('[data-testid="dragon-table"] thead th');
    await expect(headers).toHaveCount(9);

    // 驗收第一列球員資料存在
    const firstRow = page.locator('[data-testid="dragon-player-row"]').first();
    await expect(firstRow.locator('[data-testid="dragon-rank"]')).toHaveText('1');
    await expect(firstRow.locator('[data-testid="dragon-name"]')).toContainText('韋承志');
  });

  // ────── AC-7: 金色背景 ──────
  test('AC-7: total > civilianThreshold → 列有 data-above-threshold="true"', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockDragonboardWithThreshold() });
    await page.goto('roster?tab=dragon');

    // threshold=10，rank 1(total=12) 和 rank 2(total=11) 超過
    const rows = page.locator('[data-testid="dragon-player-row"]');
    await expect(rows.nth(0)).toHaveAttribute('data-above-threshold', 'true');
    await expect(rows.nth(1)).toHaveAttribute('data-above-threshold', 'true');

    // rank 3(total=9) 以下不超過
    await expect(rows.nth(2)).not.toHaveAttribute('data-above-threshold', 'true');
  });

  // ────── AC-8: 平民線分隔線 ──────
  test('AC-8: threshold 位置顯示「平民線」分隔線', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockDragonboardWithThreshold() });
    await page.goto('roster?tab=dragon');

    const divider = page.locator('[data-testid="civilian-divider"]');
    await expect(divider).toBeVisible();
    await expect(divider).toContainText('平民線');
  });

  // ────── AC-9: tag="裁" icon ──────
  test('AC-9a: tag="裁" → ⚖️ icon 可見', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?tab=dragon');

    // 韋承志 rank 1，tag="裁"
    const firstRow = page.locator('[data-testid="dragon-player-row"]').first();
    await expect(firstRow.locator('[data-testid="judge-icon"]')).toBeVisible();
  });

  test('AC-9b: tag=null → ⚖️ icon 不顯示', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?tab=dragon');

    // 吳家豪 rank 2，tag=null
    const secondRow = page.locator('[data-testid="dragon-player-row"]').nth(1);
    await expect(secondRow.locator('[data-testid="judge-icon"]')).toHaveCount(0);
  });

  // ────── AC-10: playoff=null → "—" ──────
  test('AC-10: playoff=null → 顯示「—」', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?tab=dragon');

    // 所有球員 playoff=null
    const firstRow = page.locator('[data-testid="dragon-player-row"]').first();
    await expect(firstRow.locator('[data-testid="dragon-playoff"]')).toHaveText('—');
  });

  // ────── AC-19: 空龍虎榜 ──────
  test('AC-19: dragon.players 空 → 「龍虎榜資料尚未產生」訊息', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockEmptyDragonboard() });
    await page.goto('roster?tab=dragon');

    await expect(page.locator('[data-testid="dragon-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="dragon-empty"]')).toContainText('龍虎榜資料尚未產生');
  });

  // ────── AC-20: 球員不可點 [qa-v2 補充] ──────
  test('[qa-v2 補充] AC-20: 球員名字非可點擊連結（純展示）', async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
    await page.goto('roster?tab=dragon');

    const nameCell = page.locator('[data-testid="dragon-name"]').first();
    // 球員名稱不是 <a> 連結
    const tagName = await nameCell.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).not.toBe('a');
    // 也不包含 <a> 子元素
    await expect(nameCell.locator('a')).toHaveCount(0);
  });
});
