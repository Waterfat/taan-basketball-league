/**
 * /（首頁）E2E — 本週對戰預覽 + Toggle（Issue #14）
 *
 * Coverage:
 *   E-101 (B-1.1): 首頁顯示 6 組對戰預覽
 *   E-102 (B-1.2): 切換 toggle 顯示「對戰組合 / 賽程順序」
 *   E-103 (B-2.1): 智慧切換 — gamesPublished: false → 預設「對戰組合」
 *   E-104 (B-2.2): 智慧切換 — gamesPublished: true → 預設「賽程順序」
 *   E-105 (B-E2): gamesPublished: false → 顯示提示文字「本週場次順序尚未公告」
 *   E-106 (BQ-4): toggle 切換 → URL query string 同步（?view=combo / ?view=order）
 *
 * 測試資料策略：
 *   - 使用 mockHomeWithWeekMatchups({ gamesPublished: true }) 建立已公告順序情境
 *   - 使用 mockHomeWithWeekMatchups({ gamesPublished: false }) 建立尚未公告情境
 *   - 透過 mockHomeAPI(page, data) 攔截 /data/home.json，不打 production
 *   - 每個 test 獨立 mock，並行安全
 */

import { test, expect } from '@playwright/test';
import { mockHomeAPI } from '../../../helpers/mock-api';
import { mockHomeWithWeekMatchups } from '../../../fixtures/home';

test.describe('Home — 本週對戰預覽（已公告順序）', () => {
  // ── E-101 + E-104: 首頁顯示 6 組對戰預覽，智慧預設「賽程順序」 ──
  test(
    'E-101/E-104: 顯示 6 組對戰卡片，gamesPublished:true → 預設「賽程順序」',
    { tag: ['@home', '@issue-14', '@matchups'] },
    async ({ page }) => {
      const dataPromise = page.waitForResponse((resp) =>
        /\/data\/home\.json$/.test(resp.url()) && resp.status() === 200,
      );
      await mockHomeAPI(page, mockHomeWithWeekMatchups({ gamesPublished: true }));
      await page.goto('');
      await dataPromise;

      // UI 結構：section 容器、toggle、預設視圖可見
      await expect(page.getByTestId('home-matchups')).toBeVisible();
      await expect(page.getByTestId('matchups-toggle-order')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('matchups-toggle-combo')).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('matchups-order-list')).toBeVisible();
      await expect(page.getByTestId('matchups-combo-list')).toBeHidden();

      // 資料驗證：6 張對戰卡片存在
      await expect(page.getByTestId('matchup-card')).toHaveCount(6);
    },
  );

  // ── E-102: 切換 toggle ──
  test(
    'E-102: toggle 可切換「對戰組合 / 賽程順序」兩種視圖',
    { tag: ['@home', '@issue-14', '@matchups'] },
    async ({ page }) => {
      await mockHomeAPI(page, mockHomeWithWeekMatchups({ gamesPublished: true }));
      await page.goto('');

      // UI 結構：toggle 存在且為 radiogroup
      const toggle = page.getByTestId('matchups-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('role', 'radiogroup');

      const orderBtn = page.getByTestId('matchups-toggle-order');
      const comboBtn = page.getByTestId('matchups-toggle-combo');

      // 互動：切換到「對戰組合」
      await comboBtn.click();
      await expect(comboBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(orderBtn).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('matchups-combo-list')).toBeVisible();
      await expect(page.getByTestId('matchups-order-list')).toBeHidden();

      // 資料驗證：切換後仍有 6 張卡片
      await expect(page.getByTestId('matchup-card')).toHaveCount(6);
    },
  );
});

test.describe('Home — 本週對戰預覽（順序未公告）', () => {
  // ── E-103: 智慧切換 — gamesPublished: false → 預設「對戰組合」 ──
  test(
    'E-103: gamesPublished: false → 智慧預設為「對戰組合」',
    { tag: ['@home', '@issue-14', '@matchups'] },
    async ({ page }) => {
      const dataPromise = page.waitForResponse((resp) =>
        /\/data\/home\.json$/.test(resp.url()) && resp.status() === 200,
      );
      await mockHomeAPI(page, mockHomeWithWeekMatchups({ gamesPublished: false }));
      await page.goto('');
      await dataPromise;

      // UI 結構：section 可見
      await expect(page.getByTestId('home-matchups')).toBeVisible();

      // 互動：驗證預設選中「對戰組合」
      await expect(page.getByTestId('matchups-toggle-combo')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('matchups-toggle-order')).toHaveAttribute('aria-pressed', 'false');

      // 資料驗證：「對戰組合」列表可見
      await expect(page.getByTestId('matchups-combo-list')).toBeVisible();
      await expect(page.getByTestId('matchups-order-list')).toBeHidden();
    },
  );

  // ── E-105: 順序未公告提示文字 ──
  test(
    'E-105: gamesPublished: false → 顯示「本週場次順序尚未公告」提示',
    { tag: ['@home', '@issue-14', '@matchups'] },
    async ({ page }) => {
      await mockHomeAPI(page, mockHomeWithWeekMatchups({ gamesPublished: false }));
      await page.goto('');

      // UI 結構：提示元素可見
      const hint = page.getByTestId('matchups-unpublished-hint');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('本週場次順序尚未公告');

      // 互動：即使切換到「賽程順序」tab，提示仍保持（或 tab 被禁用）
      const orderBtn = page.getByTestId('matchups-toggle-order');
      await orderBtn.click();

      // 資料驗證：6 張對戰卡片仍然可見（對戰組合視圖）
      const cards = page.getByTestId('matchup-card');
      await expect(cards).toHaveCount(6);
    },
  );
});

test.describe('Home — toggle URL query string 同步', () => {
  // ── E-106: toggle 切換 URL query 同步 ──
  test(
    'E-106: 切換 toggle → URL query string 同步為 ?view=combo / ?view=order',
    { tag: ['@home', '@issue-14', '@matchups'] },
    async ({ page }) => {
      await mockHomeAPI(page, mockHomeWithWeekMatchups({ gamesPublished: true }));
      await page.goto('');
      await expect(page.getByTestId('home-matchups')).toBeVisible();

      // 互動：切換到「對戰組合」
      await page.getByTestId('matchups-toggle-combo').click();

      // UI 結構：combo view 可見
      await expect(page.getByTestId('matchups-combo-list')).toBeVisible();

      // 資料驗證：URL 含 ?view=combo
      await expect(page).toHaveURL(/[?&]view=combo/);

      // 互動：切換回「賽程順序」
      await page.getByTestId('matchups-toggle-order').click();

      // UI 結構：order view 可見
      await expect(page.getByTestId('matchups-order-list')).toBeVisible();

      // 資料驗證：URL 含 ?view=order
      await expect(page).toHaveURL(/[?&]view=order/);
    },
  );

  // ── E-106b: 直接以 ?view=combo 進入首頁 ──
  test(
    'E-106b: 帶 ?view=combo 進入首頁 → 直接顯示「對戰組合」視圖',
    { tag: ['@home', '@issue-14', '@matchups'] },
    async ({ page }) => {
      const dataPromise = page.waitForResponse((resp) =>
        /\/data\/home\.json$/.test(resp.url()) && resp.status() === 200,
      );
      await mockHomeAPI(page, mockHomeWithWeekMatchups({ gamesPublished: true }));
      await page.goto('?view=combo');
      await dataPromise;

      // UI 結構：section 可見
      await expect(page.getByTestId('home-matchups')).toBeVisible();

      // 互動：combo toggle 應為 active
      await expect(page.getByTestId('matchups-toggle-combo')).toHaveAttribute('aria-pressed', 'true');

      // 資料驗證：對戰組合視圖顯示，卡片數量 6
      await expect(page.getByTestId('matchups-combo-list')).toBeVisible();
      const cards = page.getByTestId('matchup-card');
      await expect(cards).toHaveCount(6);
    },
  );
});
