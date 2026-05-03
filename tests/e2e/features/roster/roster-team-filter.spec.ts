/**
 * /roster 頁面 — 隊伍切換 chips E2E
 *
 * @tag @roster @issue-14 @team-filter
 * Coverage:
 *   E-601 (B-8.1): 顯示 7 個 chips（全部 + 紅黑藍綠黃白）
 *   E-602 (B-8.2): 點「紅」chip → 只顯示紅隊 section（其他隊伍 section hidden）
 *   E-603 (B-8.3): 點「全部」→ 顯示六隊 section
 *   E-604 (BQ-3 [qa-v2 補充]): 選中 chip 有 aria-pressed=true 與 active 樣式
 *
 * 測試資料策略：
 *   靜態前置條件：mockFullRoster()（6 隊：紅黑藍綠黃白）
 *   E2E 透過 mockRosterAndDragon 攔截 /data/roster.json + /data/dragon.json
 *   chip 篩選為純 client-side，不觸發新 API request；
 *   資料層驗證透過篩選後的可見 section 數量（DOM count）確認
 */

import { test, expect } from '@playwright/test';
import { mockFullRoster } from '../../../fixtures/roster';
import { mockFullDragonboard } from '../../../fixtures/dragon';
import { mockRosterAndDragon } from '../../../helpers/mock-api';

const TEAM_CHIPS = ['all', '紅', '黑', '藍', '綠', '黃', '白'] as const;
const TEAM_IDS = ['red', 'black', 'blue', 'green', 'yellow', 'white'] as const;

test.describe('Roster Page — 隊伍切換 chips @roster @issue-14 @team-filter', () => {

  // ────── E-601 (B-8.1): 7 個 chips ──────
  test('E-601: chips 容器顯示 7 個 chip（全部 + 紅黑藍綠黃白）',
    { tag: ['@roster', '@issue-14', '@team-filter'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      // Layer 1 — UI 結構：chip 容器可見
      const chipContainer = page.locator('[data-testid="roster-team-chips"]');
      await expect(chipContainer).toBeVisible();

      // Layer 2 — 互動：共 7 個 chip
      const chips = chipContainer.locator('[data-testid="roster-team-chip"]');
      await expect(chips).toHaveCount(7);

      // Layer 3 — 資料驗證：每個 data-team 屬性對應預期值
      const dataTeams = await chips.evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-team'))
      );
      expect(dataTeams).toEqual([...TEAM_CHIPS]);
    }
  );

  test('E-601b: 預設狀態下「全部」chip 有 aria-pressed=true',
    { tag: ['@roster', '@issue-14', '@team-filter'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      // Layer 1 — UI 結構
      const allChip = page.locator('[data-testid="roster-team-chip"][data-team="all"]');
      await expect(allChip).toBeVisible();

      // Layer 2 — 互動：預設全部 chip 為 active
      await expect(allChip).toHaveAttribute('aria-pressed', 'true');

      // Layer 3 — 資料驗證：其他 chip 非 active
      for (const team of TEAM_CHIPS.filter((t) => t !== 'all')) {
        const chip = page.locator(`[data-testid="roster-team-chip"][data-team="${team}"]`);
        await expect(chip).toHaveAttribute('aria-pressed', 'false');
      }
    }
  );

  // ────── E-604 (BQ-3): active 樣式 + aria-pressed ──────
  test('E-604: 點「紅」chip → aria-pressed=true（紅），「全部」變 false',
    { tag: ['@roster', '@issue-14', '@team-filter'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      const redChip = page.locator('[data-testid="roster-team-chip"][data-team="紅"]');
      const allChip = page.locator('[data-testid="roster-team-chip"][data-team="all"]');

      // Layer 1 — UI 結構：紅 chip 可見
      await expect(redChip).toBeVisible();

      // Layer 2 — 互動：點擊後 aria-pressed 切換
      await redChip.click();
      await expect(redChip).toHaveAttribute('aria-pressed', 'true');
      await expect(allChip).toHaveAttribute('aria-pressed', 'false');

      // Layer 3 — 資料驗證：其餘 chip（黑/藍/綠/黃/白）皆為 false
      for (const team of TEAM_CHIPS.filter((t) => t !== 'all' && t !== '紅')) {
        const chip = page.locator(`[data-testid="roster-team-chip"][data-team="${team}"]`);
        await expect(chip).toHaveAttribute('aria-pressed', 'false');
      }
    }
  );

  // ────── E-602 (B-8.2): 點「紅」→ 只顯紅隊 ──────
  test('E-602: 點「紅」chip → 只有紅隊 section 可見，其餘隱藏',
    { tag: ['@roster', '@issue-14', '@team-filter'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      // Layer 1 — UI 結構：初始 6 隊全部存在
      const allSections = page.locator('[data-testid="roster-team-section"]');
      await expect(allSections).toHaveCount(6);

      // Layer 2 — 互動：點擊「紅」chip
      await page.locator('[data-testid="roster-team-chip"][data-team="紅"]').click();

      // 紅隊 section 可見
      const redSection = page.locator('[data-testid="roster-team-section"][data-team-id="red"]');
      await expect(redSection).toBeVisible();

      // Layer 3 — 資料驗證：其他 5 隊 section 隱藏
      for (const teamId of TEAM_IDS.filter((id) => id !== 'red')) {
        const section = page.locator(`[data-testid="roster-team-section"][data-team-id="${teamId}"]`);
        await expect(section).toBeHidden();
      }
    }
  );

  // ────── E-603 (B-8.3): 點「全部」→ 六隊重新顯示 ──────
  test('E-603: 「紅」chip 啟用後點「全部」→ 六隊 section 全部可見',
    { tag: ['@roster', '@issue-14', '@team-filter'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      // 先切到紅隊
      await page.locator('[data-testid="roster-team-chip"][data-team="紅"]').click();

      // Layer 1 — UI 結構：全部 chip 可見
      const allChip = page.locator('[data-testid="roster-team-chip"][data-team="all"]');
      await expect(allChip).toBeVisible();

      // Layer 2 — 互動：點全部 chip
      await allChip.click();
      await expect(allChip).toHaveAttribute('aria-pressed', 'true');

      // Layer 3 — 資料驗證：六隊 section 全部重新可見
      for (const teamId of TEAM_IDS) {
        const section = page.locator(`[data-testid="roster-team-section"][data-team-id="${teamId}"]`);
        await expect(section).toBeVisible();
      }
    }
  );

  test('E-603b: 依序切換多隊後點「全部」→ 六隊全部可見（連續操作）',
    { tag: ['@roster', '@issue-14', '@team-filter'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      // Layer 1 — UI 結構
      await expect(page.locator('[data-testid="roster-team-chips"]')).toBeVisible();

      // Layer 2 — 互動：切黑、再切藍、最後切回全部
      await page.locator('[data-testid="roster-team-chip"][data-team="黑"]').click();
      await page.locator('[data-testid="roster-team-chip"][data-team="藍"]').click();
      await page.locator('[data-testid="roster-team-chip"][data-team="all"]').click();

      // Layer 3 — 資料驗證：最終六隊都可見
      const visibleCount = await page.locator('[data-testid="roster-team-section"]').evaluateAll(
        (els) => els.filter((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }).length
      );
      expect(visibleCount).toBe(6);
    }
  );
});
