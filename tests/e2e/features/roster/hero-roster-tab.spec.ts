/**
 * E-4：/roster Hero + 球員名單 tab E2E（對 prod 真實鏈路）
 *
 * @coverage E-4
 * @issue #17
 * @tag @roster @issue-17
 *
 * 不再 mock Roster + Dragon API；對 prod URL 跑真實鏈路：
 *  - Hero 標題含「ROSTER」+ 真實 season
 *  - 預設球員名單 tab active（aria-selected="true"）
 *  - 球員名單 6 隊 sections
 *  - 每球員 10 個出席色塊（Issue #17 AC-4 transformRoster 補完後）
 *  - dragon tab subtitle + chips（活躍度積分 / 平民區 / 奴隸區 / 季後賽加分提示）
 *
 * 出席色塊樣式（att=1/0/x/?）由 roster-utils 與 roster-components 單元測試涵蓋；
 * 全 "?" 邊界（AC-18）需 deterministic 假資料 → unit test。
 *
 * 不寫死「第 25 季」/「平民線 36 分」等 prod 真實值。
 */

import { test, expect } from '@playwright/test';

test.describe('Roster Hero — 真實 season + phase', () => {
  test('AC-1: /roster → Hero「ROSTER」+ 真實 season + subtitle 不為破碎字串', async ({ page }) => {
    await page.goto('roster');

    const heroTitle = page.locator('[data-testid="hero-title"]');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('ROSTER');
    await expect(heroTitle).toContainText(/第\s*\d+\s*季/);

    const subtitle = page.locator('[data-testid="hero-subtitle"]');
    await expect(subtitle).toBeVisible();

    // subtitle 不為破碎字串
    const subtitleText = (await subtitle.textContent()) ?? '';
    expect(subtitleText).not.toContain('undefined');
    expect(subtitleText).not.toContain('NaN');
    expect(subtitleText.length).toBeGreaterThan(0);

    // 預設球員名單 tab active
    await expect(page.locator('[data-testid="sub-tab"][data-tab="roster"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="roster-tab-panel"]')).toBeVisible();
  });

  test('AC-2: 球員名單 tab → 6 隊各一個 section', async ({ page }) => {
    await page.goto('roster');

    const sections = page.locator('[data-testid="roster-team-section"]');
    await expect(sections).toHaveCount(6);
  });

  test('AC-3: 每球員顯示名字 + 10 個出席色塊', async ({ page }) => {
    await page.goto('roster');

    const firstPlayer = page.locator('[data-testid="roster-player-row"]').first();
    await expect(firstPlayer).toBeVisible();
    await expect(firstPlayer.locator('[data-testid="player-name"]')).toBeVisible();

    const attBlocks = firstPlayer.locator('[data-testid="att-block"]');
    await expect(attBlocks).toHaveCount(10);
  });
});

test.describe('Roster Hero — 龍虎榜 tab subtitle + chips', () => {
  test('E-901: /roster?tab=dragon → hero subtitle 含「活躍度積分累計 · 決定下賽季選秀順位」', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const subtitle = page.locator('[data-testid="hero-subtitle"]');
    await expect(subtitle).toBeVisible();
    await expect(page.locator('[data-testid="sub-tab"][data-tab="dragon"]')).toHaveAttribute('aria-selected', 'true');

    await expect(subtitle).toContainText('活躍度積分累計');
    await expect(subtitle).toContainText('決定下賽季選秀順位');
  });

  test('E-902: /roster?tab=dragon → hero 顯示三個 chip', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    await expect(page.locator('[data-testid="hero-chip-civilian"]')).toBeVisible();
    await expect(page.locator('[data-testid="hero-chip-slave"]')).toBeVisible();
    await expect(page.locator('[data-testid="hero-chip-playoff-note"]')).toBeVisible();

    await expect(page.locator('[data-testid="hero-chip-civilian"]')).toContainText('平民區');
    await expect(page.locator('[data-testid="hero-chip-slave"]')).toContainText('奴隸區');
    await expect(page.locator('[data-testid="hero-chip-playoff-note"]')).toContainText('⚠');
    await expect(page.locator('[data-testid="hero-chip-playoff-note"]')).toContainText('季後賽加分於賽季結束後計入');

    // chips 切回 roster tab 後消失
    await page.locator('[data-testid="sub-tab"][data-tab="roster"]').click();
    await expect(page.locator('[data-testid="hero-chip-civilian"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="hero-chip-slave"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="hero-chip-playoff-note"]')).toHaveCount(0);
  });
});
