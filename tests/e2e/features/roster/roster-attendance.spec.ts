/**
 * /roster 頁面 — 出席率欄 + 符號 legend E2E
 *
 * @tag @roster @issue-14 @attendance
 * Coverage:
 *   E-501 (B-6.1): 表格頂端日期欄頭（如 1/10、1/17 …）— 與 weeks[] 對應
 *   E-502 (B-6.2): 每位球員最右欄顯示「出席率% + 場次比」（如 "100% 6/6"）
 *                  計算規則：只計 1/0/x，排除 ?（尚未舉行）
 *   E-503 (B-7.1): 上方 legend「1 出席、0 請假、✕ 曠賽、? 尚未舉行」
 *
 * 測試資料策略：
 *   靜態前置條件：mockFullRoster()（10 週 weeks[]，6 隊，各種 att 值）
 *   E2E 透過 mockRosterAndDragon 攔截 /data/roster.json + /data/dragon.json
 *
 * 出席率驗算（以紅隊球員為例）：
 *   韋承志：att=[1,1,1,1,1,1,'?','?','?','?'] → attended=6, total=6, rate=100%
 *   吳軒宇：att=[1,0,1,1,1,1,'?','?','?','?'] → attended=5, total=6, rate=83%
 *   蔡一聲：att=[0,1,1,1,0,'x','?','?','?','?'] → attended=3, total=6, rate=50%
 */

import { test, expect } from '@playwright/test';
import { mockFullRoster, mockRosterWeeks } from '../../../fixtures/roster';
import { mockFullDragonboard } from '../../../fixtures/dragon';
import { mockRosterAndDragon } from '../../../helpers/mock-api';

test.describe('Roster Page — 出席率欄 + Legend @roster @issue-14 @attendance', () => {

  // ────── E-503 (B-7.1): legend ──────
  test('E-503: legend 顯示「1 出席、0 請假、✕ 曠賽、? 尚未舉行」',
    { tag: ['@roster', '@issue-14', '@attendance'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      // Layer 1 — UI 結構：legend 元素可見
      const legend = page.locator('[data-testid="attendance-legend"]');
      await expect(legend).toBeVisible();

      // Layer 2 — 互動：legend 包含四個符號說明
      await expect(legend).toContainText('1');
      await expect(legend).toContainText('出席');
      await expect(legend).toContainText('0');
      await expect(legend).toContainText('請假');
      await expect(legend).toContainText('✕');
      await expect(legend).toContainText('曠賽');
      await expect(legend).toContainText('?');
      await expect(legend).toContainText('尚未舉行');

      // Layer 3 — 資料驗證：確認 legend 位於表格上方（在 DOM 中早於 roster 表格出現）
      const legendIndex = await page.evaluate(() => {
        const legend = document.querySelector('[data-testid="attendance-legend"]');
        const table = document.querySelector('[data-testid="roster-team-section"]');
        if (!legend || !table) return -1;
        return legend.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING ? 0 : 1;
      });
      expect(legendIndex).toBe(0); // legend 在表格之前
    }
  );

  // ────── E-501 (B-6.1): 日期欄頭 ──────
  test('E-501: 表格頂端顯示 10 個日期欄頭，與 weeks[] date 對應',
    { tag: ['@roster', '@issue-14', '@attendance'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      const weeks = mockRosterWeeks();

      // Layer 1 — UI 結構：欄頭存在且數量正確
      const headers = page.locator('[data-testid="roster-week-header"]');
      await expect(headers).toHaveCount(weeks.length);

      // Layer 2 — 互動：第一個與最後一個日期正確顯示
      await expect(headers.first()).toContainText(weeks[0].date); // '1/10'
      await expect(headers.last()).toContainText(weeks[weeks.length - 1].date); // '3/14'

      // Layer 3 — 資料驗證：每個欄頭的 data-week 屬性對應 wk 編號
      const dataWeeks = await headers.evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-week'))
      );
      const expectedWks = weeks.map((w) => String(w.wk));
      expect(dataWeeks).toEqual(expectedWks);
    }
  );

  test('E-501b: 日期欄頭顯示正確的 date 文字（1/10 ~ 3/14）',
    { tag: ['@roster', '@issue-14', '@attendance'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      const weeks = mockRosterWeeks();

      // Layer 1 — UI 結構
      const headers = page.locator('[data-testid="roster-week-header"]');
      await expect(headers.first()).toBeVisible();

      // Layer 2 — 互動：中間欄頭（第 5 週 2/7）正確
      await expect(headers.nth(4)).toContainText('2/7');

      // Layer 3 — 資料驗證：全部 date 文字與 fixture 完全對齊
      const allTexts = await headers.allTextContents();
      const allDates = weeks.map((w) => w.date);
      for (let i = 0; i < allDates.length; i++) {
        expect(allTexts[i]).toContain(allDates[i]);
      }
    }
  );

  // ────── E-502 (B-6.2): 出席率彙整欄 ──────
  test('E-502: 韋承志（att 全 1，共 6 場）→ 出席率 100% 6/6',
    { tag: ['@roster', '@issue-14', '@attendance'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      // Layer 1 — UI 結構：韋承志那列的彙整欄可見
      const row = page.locator('[data-testid="roster-player-row"]').filter({ hasText: '韋承志' });
      const summary = row.locator('[data-testid="roster-attendance-summary"]');
      await expect(summary).toBeVisible();

      // Layer 2 — 互動：顯示 "100%" 及場次比 "6/6"
      await expect(summary).toContainText('100%');
      await expect(summary).toContainText('6/6');

      // Layer 3 — 資料驗證：data attributes 正確
      await expect(summary).toHaveAttribute('data-rate', '100');
      await expect(summary).toHaveAttribute('data-played', '6');
      await expect(summary).toHaveAttribute('data-total', '6');
    }
  );

  test('E-502b: 吳軒宇（att=[1,0,1,1,1,1,?,?,?,?]，5/6 出席）→ 出席率 83% 5/6',
    { tag: ['@roster', '@issue-14', '@attendance'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      const row = page.locator('[data-testid="roster-player-row"]').filter({ hasText: '吳軒宇' });
      const summary = row.locator('[data-testid="roster-attendance-summary"]');

      // Layer 1 — UI 結構
      await expect(summary).toBeVisible();

      // Layer 2 — 互動：正確顯示 83% 5/6
      await expect(summary).toContainText('83%');
      await expect(summary).toContainText('5/6');

      // Layer 3 — 資料驗證：data-played=5 data-total=6
      await expect(summary).toHaveAttribute('data-played', '5');
      await expect(summary).toHaveAttribute('data-total', '6');
    }
  );

  test('E-502c: 蔡一聲（含 x 與 0，排除 ?）→ 出席率 50% 3/6',
    { tag: ['@roster', '@issue-14', '@attendance'] },
    async ({ page }) => {
      await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
      await page.goto('roster');

      // 蔡一聲：att=[0,1,1,1,0,'x','?','?','?','?'] → attended=3, total=6, rate=50%
      const row = page.locator('[data-testid="roster-player-row"]').filter({ hasText: '蔡一聲' });
      const summary = row.locator('[data-testid="roster-attendance-summary"]');

      // Layer 1 — UI 結構
      await expect(summary).toBeVisible();

      // Layer 2 — 互動：? 不計入 total，x 計入 total
      await expect(summary).toContainText('50%');
      await expect(summary).toContainText('3/6');

      // Layer 3 — 資料驗證：data attributes 反映 x 已計入 total（= 6，非 5）
      await expect(summary).toHaveAttribute('data-played', '3');
      await expect(summary).toHaveAttribute('data-total', '6');
    }
  );
});
