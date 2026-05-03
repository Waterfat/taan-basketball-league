/**
 * /boxscore?tab=leaders — 個人領先榜 11 類 E2E
 *
 * Coverage IDs:
 *   E-301 (B-4.1): 領先榜顯示 11 類個人卡片
 *   E-302 (B-4.2): 含新 5 類（失誤 / 犯規 / 2P% / 3P% / FT%）
 *   E-303 (BQ-6):  11 類順序固定 — order matches LEADER_CATEGORIES_ORDERED
 *   E-304 (AC-E3): 部分類別空時，該卡片仍顯示空狀態（"該類別尚無數據"），不影響其他類別
 *
 * 測試資料策略：
 *   - 全量：mockLeadersAPI(page, mockExtendedLeaders()) — 11 類全有資料
 *   - 部分空：複製 mockExtendedLeaders() 後將 turnover/p3pct 清空驗 AC-E3
 *   - 不打 production Google Sheets / GAS
 *
 * @tag @boxscore @issue-14 @leaders
 */

import { test, expect } from '@playwright/test';
import {
  mockExtendedLeaders,
  LEADER_CATEGORIES_ORDERED,
} from '../../../fixtures/leaders';
import { mockLeadersAPI } from '../../../helpers/mock-api';

test.describe('Leaders Tab — 個人 11 類 @boxscore @issue-14 @leaders', () => {

  // ────── E-301: 11 類個人卡片全部顯示 ──────
  test('E-301: leaders panel 顯示 11 類個人卡片', {
    tag: ['@boxscore', '@issue-14', '@leaders'],
  }, async ({ page }) => {
    // 資料層：mock 攔截 stats/leaders.json，回傳 11 類擴充資料
    await mockLeadersAPI(page, mockExtendedLeaders());

    // UI 結構層
    await page.goto('boxscore?tab=leaders');
    const panel = page.locator('[data-testid="leaders-panel"]');
    await expect(panel).toBeVisible();

    // 互動層：11 張卡片全部存在
    const cards = panel.locator('[data-testid="leaders-card"]');
    await expect(cards).toHaveCount(11);

    // 資料驗證層：每張卡片的 data-category 對應正確
    for (const cat of LEADER_CATEGORIES_ORDERED) {
      await expect(
        panel.locator(`[data-testid="leaders-card"][data-category="${cat}"]`)
      ).toBeVisible();
    }
  });

  // ────── E-302: 新 5 類別確認存在 ──────
  test('E-302: 新增 5 類（失誤 / 犯規 / 2P% / 3P% / FT%）卡片可見', {
    tag: ['@boxscore', '@issue-14', '@leaders'],
  }, async ({ page }) => {
    await mockLeadersAPI(page, mockExtendedLeaders());

    // UI 結構層
    await page.goto('boxscore?tab=leaders');
    const panel = page.locator('[data-testid="leaders-panel"]');
    await expect(panel).toBeVisible();

    const newCategories = ['turnover', 'foul', 'p2pct', 'p3pct', 'ftpct'] as const;

    // 互動層：逐一確認新 5 類卡片存在且有資料列
    for (const cat of newCategories) {
      const card = panel.locator(`[data-testid="leaders-card"][data-category="${cat}"]`);
      await expect(card).toBeVisible();

      // 資料驗證層：卡片有至少 1 列球員資料（非空狀態）
      await expect(card.locator('[data-testid="leader-row"]').first()).toBeVisible();
    }
  });

  // ────── E-303: 11 類固定顯示順序 ──────
  test('E-303: 11 類 categories 順序固定（既有 6 類在前，新 5 類在後）', {
    tag: ['@boxscore', '@issue-14', '@leaders'],
  }, async ({ page }) => {
    await mockLeadersAPI(page, mockExtendedLeaders());

    // UI 結構層
    await page.goto('boxscore?tab=leaders');
    const panel = page.locator('[data-testid="leaders-panel"]');
    await expect(panel).toBeVisible();

    // 互動層：等待 11 張卡片全部渲染
    const cards = panel.locator('[data-testid="leaders-card"]');
    await expect(cards).toHaveCount(11);

    // 資料驗證層：逐一比對 DOM 順序與 LEADER_CATEGORIES_ORDERED
    for (let i = 0; i < LEADER_CATEGORIES_ORDERED.length; i++) {
      const actualCategory = await cards.nth(i).getAttribute('data-category');
      expect(actualCategory).toBe(LEADER_CATEGORIES_ORDERED[i]);
    }
  });

  // ────── E-304: 部分類別空時空狀態不污染其他卡片 ──────
  test('E-304: 部分類別為空時，該卡片顯示空狀態，不影響其他類別', {
    tag: ['@boxscore', '@issue-14', '@leaders'],
  }, async ({ page }) => {
    // 資料層：turnover 和 p3pct 清空
    const data = mockExtendedLeaders();
    data['25'].turnover = [];
    data['25'].p3pct = [];
    await mockLeadersAPI(page, data);

    // UI 結構層：panel 仍正常顯示
    await page.goto('boxscore?tab=leaders');
    const panel = page.locator('[data-testid="leaders-panel"]');
    await expect(panel).toBeVisible();

    // 互動層：仍有 11 張卡片（空類別也渲染卡片外殼）
    const cards = panel.locator('[data-testid="leaders-card"]');
    await expect(cards).toHaveCount(11);

    // 資料驗證層（空狀態）：空類別卡片顯示「該類別尚無數據」
    const turnoverCard = panel.locator('[data-testid="leaders-card"][data-category="turnover"]');
    await expect(turnoverCard.locator('[data-testid="leaders-empty"]')).toBeVisible();
    await expect(turnoverCard).toContainText('該類別尚無數據');

    const p3Card = panel.locator('[data-testid="leaders-card"][data-category="p3pct"]');
    await expect(p3Card.locator('[data-testid="leaders-empty"]')).toBeVisible();

    // 資料驗證層（非空類別不受影響）：scoring 仍有 10 列資料
    const scoringCard = panel.locator('[data-testid="leaders-card"][data-category="scoring"]');
    await expect(scoringCard.locator('[data-testid="leader-row"]')).toHaveCount(10);
  });

});
