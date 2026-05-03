/**
 * E-2：/roster?tab=dragon — Dragon Hero + 龍虎榜 tab E2E（對 prod 真實鏈路）
 *
 * @coverage E-2
 * @issue #17
 * @tag @roster @dragon @issue-17
 *
 * 不再 mock Roster + Dragon API；對 prod URL 跑真實鏈路：
 *  - tab 切換 + URL ?tab=dragon
 *  - 龍虎榜表格欄位結構（9 欄 thead）
 *  - playoff=null 顯示「—」
 *  - 球員名字非可點擊連結
 *  - 規則連結（如 prod 有 rulesLink）→ target=_blank + rel noopener noreferrer
 *
 * 「total > civilianThreshold → above-threshold」（AC-7 / AC-8 平民線分隔線）
 * 與「dragon.players 空 → 龍虎榜資料尚未產生」（AC-19）需 deterministic 假資料 →
 * 改由 unit test 涵蓋（tests/unit/dragon-components.test.ts 元件渲染契約）。
 *
 * 不寫死球員名（韋承志 / 吳家豪）— 容忍 prod 真實資料變動。
 */

import { test, expect } from '@playwright/test';

test.describe('Roster Page — Dragon tab', () => {
  test('AC-5a: 點「積分龍虎榜」tab → URL 含 ?tab=dragon', async ({ page }) => {
    await page.goto('roster');

    await page.locator('[data-testid="sub-tab"][data-tab="dragon"]').click();

    await expect(page).toHaveURL(/[?&]tab=dragon/);
    await expect(page.locator('[data-testid="dragon-tab-panel"]')).toBeVisible();
  });

  test('AC-5b: 直接打開 /roster?tab=dragon → 龍虎榜 tab 顯示（重整保持）', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="dragon"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="dragon-tab-panel"]')).toBeVisible();
  });

  test('AC-6: 龍虎榜表格 thead 顯示 9 欄', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const headers = page.locator('[data-testid="dragon-table"] thead th');
    await expect(headers).toHaveCount(9);

    // 第一列球員資料存在 + rank=1
    const firstRow = page.locator('[data-testid="dragon-player-row"]').first();
    await expect(firstRow.locator('[data-testid="dragon-rank"]')).toHaveText('1');
    await expect(firstRow.locator('[data-testid="dragon-name"]')).toBeVisible();
  });

  test('AC-10: playoff=null → 顯示「—」（如 prod 賽季中尚未進入季後賽）', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const firstRow = page.locator('[data-testid="dragon-player-row"]').first();
    const playoffCell = firstRow.locator('[data-testid="dragon-playoff"]');
    await expect(playoffCell).toBeVisible();

    // playoff 內容應為「—」或數字（容忍 prod 賽季階段）
    const text = (await playoffCell.textContent())?.trim() ?? '';
    expect(text === '—' || /^\d+$/.test(text)).toBe(true);
  });

  test('AC-20: 球員名字非可點擊連結（純展示）', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const nameCell = page.locator('[data-testid="dragon-name"]').first();
    const tagName = await nameCell.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).not.toBe('a');
    await expect(nameCell.locator('a')).toHaveCount(0);
  });

  test('hero 顯示真實 season（不為「第 季」/ undefined）', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const hero = page.locator('[data-testid="hero-title"]');
    await expect(hero).toBeVisible();

    const body = page.locator('body');
    await expect(body).not.toContainText('第  季');
    await expect(body).not.toContainText('undefined');
    await expect(body).not.toContainText('NaN');

    // hero 含「第 N 季」格式
    await expect(page.getByText(/第\s*\d+\s*季/).first()).toBeVisible();
  });
});

test.describe('Dragon tab — 選秀規則連結', () => {
  test('E-803: 規則連結（如 prod 有設定）顯示「📋 查看完整選秀規則公告」', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const rulesLink = page.locator('[data-testid="dragon-rules-link"]');
    const count = await rulesLink.count();

    test.skip(count === 0, 'prod 該賽季 rulesLink 未設定 → 跳過規則連結驗證');

    await expect(rulesLink).toBeVisible();
    await expect(rulesLink).toContainText('📋 查看完整選秀規則公告');

    const href = await rulesLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/^https?:\/\//);
  });

  test('E-804: 規則連結（如有）target="_blank" + rel 含 noopener / noreferrer', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const rulesLink = page.locator('[data-testid="dragon-rules-link"]');
    const count = await rulesLink.count();

    test.skip(count === 0, 'prod 該賽季 rulesLink 未設定 → 跳過');

    await expect(rulesLink).toHaveAttribute('target', '_blank');
    const rel = await rulesLink.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });
});
