/**
 * /boxscore?tab=leaders — 隊伍三表 E2E（TDD — 元件尚未實作）
 *
 * Coverage IDs:
 *   E-401 (B-5.1): 顯示三張隊伍表（⚔️ 進攻 / 🛡️ 防守 / 📈 差值）
 *   E-402 (B-5.1): 每張表 6 列（每隊一列），含 PPG / 排名
 *   E-403 (BQ-2):  缺一張表（offense empty）→ 該表顯空狀態，不影響其他表
 *
 * 測試資料策略：
 *   - 全量：mockLeadersAPI(page, mockExtendedLeadersWithTeams()) — 11 類 + 三隊伍表
 *   - 部分缺失：mockLeadersAPI(page, mockExtendedLeadersWithPartialTeams()) — offense 空
 *   - 不打 production Google Sheets / GAS
 *
 * 預期 data-testid（TDD — 實作端需補）：
 *   team-leaders-section       — 三表的整體 wrapper
 *   team-leaders-offense       — 進攻表 (data-team-stat="offense")
 *   team-leaders-defense       — 防守表 (data-team-stat="defense")
 *   team-leaders-net           — 差值表 (data-team-stat="net")
 *   team-leaders-table         — 各表內實際 <table> 元素
 *   team-leaders-row           — 每列（data-team attr 對應隊伍 ID）
 *   team-leaders-empty         — 當 headers/rows 為空時的空狀態佔位符
 *
 * @tag @boxscore @issue-14 @leaders @team-stats
 */

import { test, expect } from '@playwright/test';
import {
  mockExtendedLeadersWithTeams,
  mockExtendedLeadersWithPartialTeams,
} from '../../../fixtures/leaders';
import { mockLeadersAPI } from '../../../helpers/mock-api';

test.describe('Leaders Tab — 隊伍三表 @boxscore @issue-14 @leaders @team-stats', () => {

  // ────── E-401: 三張隊伍表顯示（含 emoji 標題）──────
  test('E-401: 顯示三張隊伍表（⚔️ 進攻 / 🛡️ 防守 / 📈 差值）', {
    tag: ['@boxscore', '@issue-14', '@leaders', '@team-stats'],
  }, async ({ page }) => {
    // 資料層：三張隊伍表全有資料
    await mockLeadersAPI(page, mockExtendedLeadersWithTeams());

    // UI 結構層：section wrapper 存在
    await page.goto('boxscore?tab=leaders');
    const section = page.locator('[data-testid="team-leaders-section"]');
    await expect(section).toBeVisible();

    // 互動層：三張子表各自可見
    await expect(
      section.locator('[data-testid="team-leaders-offense"]')
    ).toBeVisible();
    await expect(
      section.locator('[data-testid="team-leaders-defense"]')
    ).toBeVisible();
    await expect(
      section.locator('[data-testid="team-leaders-net"]')
    ).toBeVisible();

    // 資料驗證層：三張表 emoji 標題正確
    await expect(section).toContainText('⚔️');
    await expect(section).toContainText('🛡️');
    await expect(section).toContainText('📈');

    // display label 驗證（不可只有 emoji，需含中文標題）
    await expect(page.getByText(/⚔️.*進攻|進攻.*⚔️/)).toBeVisible();
    await expect(page.getByText(/🛡️.*防守|防守.*🛡️/)).toBeVisible();
    await expect(page.getByText(/📈.*差值|差值.*📈/)).toBeVisible();
  });

  // ────── E-402: 每張表 6 列（每隊一列）────────
  test('E-402: 每張隊伍表各有 6 列（每隊一列）且含 PPG / 數值', {
    tag: ['@boxscore', '@issue-14', '@leaders', '@team-stats'],
  }, async ({ page }) => {
    await mockLeadersAPI(page, mockExtendedLeadersWithTeams());

    // UI 結構層
    await page.goto('boxscore?tab=leaders');
    const section = page.locator('[data-testid="team-leaders-section"]');
    await expect(section).toBeVisible();

    // 互動層：進攻表有 6 列
    const offenseRows = section
      .locator('[data-testid="team-leaders-offense"] [data-testid="team-leaders-row"]');
    await expect(offenseRows).toHaveCount(6);

    // 互動層：防守表有 6 列
    const defenseRows = section
      .locator('[data-testid="team-leaders-defense"] [data-testid="team-leaders-row"]');
    await expect(defenseRows).toHaveCount(6);

    // 互動層：差值表有 6 列
    const netRows = section
      .locator('[data-testid="team-leaders-net"] [data-testid="team-leaders-row"]');
    await expect(netRows).toHaveCount(6);

    // 資料驗證層：進攻表第 1 列帶有 data-team 屬性（隊伍 ID 非空）
    const firstOffenseRow = offenseRows.first();
    const teamAttr = await firstOffenseRow.getAttribute('data-team');
    expect(teamAttr).toBeTruthy();
    expect(teamAttr).not.toBe('');

    // 資料驗證層：進攻表的實際 <table> 存在
    const offenseTable = section.locator(
      '[data-testid="team-leaders-offense"] [data-testid="team-leaders-table"]'
    );
    await expect(offenseTable).toBeVisible();
  });

  // ────── E-403: 缺一張表時該表顯空狀態，其他不受影響 ──────
  test('E-403: offense 為空時顯空狀態佔位符，defense / net 不受影響', {
    tag: ['@boxscore', '@issue-14', '@leaders', '@team-stats'],
  }, async ({ page }) => {
    // 資料層：offense headers/rows 均為空
    await mockLeadersAPI(page, mockExtendedLeadersWithPartialTeams());

    // UI 結構層：section 仍顯示
    await page.goto('boxscore?tab=leaders');
    const section = page.locator('[data-testid="team-leaders-section"]');
    await expect(section).toBeVisible();

    // 互動層：offense 顯示空狀態，不顯示表格
    const offenseWrapper = section.locator('[data-testid="team-leaders-offense"]');
    await expect(offenseWrapper).toBeVisible();
    await expect(
      offenseWrapper.locator('[data-testid="team-leaders-empty"]')
    ).toBeVisible();
    await expect(
      offenseWrapper.locator('[data-testid="team-leaders-table"]')
    ).not.toBeVisible();

    // 資料驗證層：defense 和 net 正常顯示 6 列
    const defenseRows = section
      .locator('[data-testid="team-leaders-defense"] [data-testid="team-leaders-row"]');
    await expect(defenseRows).toHaveCount(6);

    const netRows = section
      .locator('[data-testid="team-leaders-net"] [data-testid="team-leaders-row"]');
    await expect(netRows).toHaveCount(6);
  });

});
