/**
 * /roster?tab=dragon — 平民區 / 奴隸區 分組標題 E2E
 *
 * @tag @roster @dragon @issue-14
 * Coverage:
 *   E-801（B-10.1）（🧑 平民區（前 N 名 · 可優先自由選擇加入隊伍）group wrapper + 標題可見）
 *   E-802（B-10.2）（⛓️ 奴隸區（第 N+1 名起 · 為聯盟貢獻過低淪為奴隸…）group wrapper + 標題可見）
 *
 * 測試資料策略：
 *   mockDragonGroupingShowcase()：threshold=10，平民區 5 人（rank 1-5 total≥10）
 *   + 奴隸區 5 人（rank 6-10 total<10）；rulesLink 已設，向後相容 civilian-divider
 *
 * 注意：E-801/E-802 分組標題為 TDD 新 data-testid，實作者須在 DragonTabPanel
 * 新增 dragon-group-civilian / dragon-group-slave wrapper 及對應標題元素。
 * 既有 civilian-divider testid 仍保留（向後相容）。
 */

import { test, expect } from '@playwright/test';
import { mockFullRoster } from '../../../fixtures/roster';
import { mockDragonGroupingShowcase } from '../../../fixtures/dragon';
import { mockRosterAndDragon } from '../../../helpers/mock-api';

test.describe('Dragon tab — 平民區 / 奴隸區 分組標題 @roster @dragon @issue-14', () => {
  // E-801 (B-10.1): 平民區 group wrapper + 標題文字
  test('E-801: 🧑 平民區 標題可見，文字含「前 N 名 · 可優先自由選擇加入隊伍」', { tag: ['@roster', '@dragon', '@issue-14'] }, async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockDragonGroupingShowcase() });
    const dragonResponse = page.waitForResponse(/dragon\.json/);
    await page.goto('roster?tab=dragon');
    await dragonResponse;

    // UI 結構：平民區 wrapper 可見
    const civilianGroup = page.locator('[data-testid="dragon-group-civilian"]');
    await expect(civilianGroup).toBeVisible();

    // 互動層：data-group 屬性正確
    await expect(civilianGroup).toHaveAttribute('data-group', 'civilian');

    // 資料驗證：標題含完整文案（threshold=10 → 前 10 名）
    const civilianTitle = page.locator('[data-testid="dragon-group-civilian-title"]');
    await expect(civilianTitle).toBeVisible();
    await expect(civilianTitle).toContainText('🧑 平民區');
    await expect(civilianTitle).toContainText('前 10 名');
    await expect(civilianTitle).toContainText('可優先自由選擇加入隊伍');
  });

  // E-802 (B-10.2): 奴隸區 group wrapper + 標題文字
  test('E-802: ⛓️ 奴隸區 標題可見，文字含「第 N+1 名起 · 為聯盟貢獻過低淪為奴隸」', { tag: ['@roster', '@dragon', '@issue-14'] }, async ({ page }) => {
    await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockDragonGroupingShowcase() });
    const dragonResponse = page.waitForResponse(/dragon\.json/);
    await page.goto('roster?tab=dragon');
    await dragonResponse;

    // UI 結構：奴隸區 wrapper 可見
    const slaveGroup = page.locator('[data-testid="dragon-group-slave"]');
    await expect(slaveGroup).toBeVisible();

    // 互動層：data-group 屬性正確
    await expect(slaveGroup).toHaveAttribute('data-group', 'slave');

    // 資料驗證：標題含完整文案（threshold=10 → 第 11 名起）
    const slaveTitle = page.locator('[data-testid="dragon-group-slave-title"]');
    await expect(slaveTitle).toBeVisible();
    await expect(slaveTitle).toContainText('⛓️ 奴隸區');
    await expect(slaveTitle).toContainText('第 11 名起');
    await expect(slaveTitle).toContainText('為聯盟貢獻過低淪為奴隸');
  });
});
