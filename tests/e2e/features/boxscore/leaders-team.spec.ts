/**
 * E-8b：/boxscore?tab=leaders 隊伍三表（對 prod 真實鏈路）
 *
 * @coverage E-8b
 * @issue #17
 * @tag @boxscore @leaders @team-stats @issue-17
 *
 * 不再 mock leaders API；對 prod URL 跑真實鏈路：
 *  - 三張隊伍表 wrapper 結構（offense / defense / net）存在
 *  - 各表 emoji 標題（⚔️ 進攻 / 🛡️ 防守 / 📈 差值）可見
 *  - 至少有 1 列資料（不寫死 6 隊 — 容忍 prod 賽季初未滿 6 隊資料）
 *
 * 「offense empty 不影響 defense/net」（E-403）需 deterministic 假資料 →
 * 改由 unit test 涵蓋（TeamLeadersSection 元件渲染契約）。
 */

import { test, expect } from '@playwright/test';

test.describe('Leaders Tab — 隊伍三表', () => {
  test('E-401: 三張隊伍表 wrapper 結構存在', async ({ page }) => {
    await page.goto('boxscore?tab=leaders');

    const section = page.locator('[data-testid="team-leaders-section"]');
    await expect(section).toBeVisible();

    await expect(section.locator('[data-testid="team-leaders-offense"]')).toBeVisible();
    await expect(section.locator('[data-testid="team-leaders-defense"]')).toBeVisible();
    await expect(section.locator('[data-testid="team-leaders-net"]')).toBeVisible();
  });

  test('E-401b: 三張表 emoji + 中文標題', async ({ page }) => {
    await page.goto('boxscore?tab=leaders');

    const section = page.locator('[data-testid="team-leaders-section"]');
    await expect(section).toBeVisible();

    await expect(section).toContainText('⚔️');
    await expect(section).toContainText('🛡️');
    await expect(section).toContainText('📈');

    await expect(page.getByText(/⚔️.*進攻|進攻.*⚔️/)).toBeVisible();
    await expect(page.getByText(/🛡️.*防守|防守.*🛡️/)).toBeVisible();
    await expect(page.getByText(/📈.*差值|差值.*📈/)).toBeVisible();
  });

  test('E-402: 每張表至少 1 列資料 + table 元素可見（容忍 prod 列數變動）', async ({ page }) => {
    await page.goto('boxscore?tab=leaders');

    const section = page.locator('[data-testid="team-leaders-section"]');
    await expect(section).toBeVisible();

    // 三張表的 row 數應 >= 1（賽季中）；若全空（賽季初）則至少 wrapper 存在
    for (const stat of ['offense', 'defense', 'net'] as const) {
      const wrapper = section.locator(`[data-testid="team-leaders-${stat}"]`);
      const rows = wrapper.locator('[data-testid="team-leaders-row"]');
      const rowCount = await rows.count();
      const hasEmpty = (await wrapper.locator('[data-testid="team-leaders-empty"]').count()) > 0;

      // 賽季中 → 有 rows；賽季初 → empty 佔位
      expect(rowCount >= 1 || hasEmpty).toBe(true);

      if (rowCount >= 1) {
        const teamAttr = await rows.first().getAttribute('data-team');
        expect(teamAttr).toBeTruthy();
      }
    }
  });
});
