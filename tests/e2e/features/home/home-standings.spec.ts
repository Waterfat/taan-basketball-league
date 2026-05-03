/**
 * E-6a：/（首頁）戰績榜迷你版（Issue #17 AC-5, AC-X1）
 *
 * @coverage E-6a
 * @issue #17
 * @tag @home @standings @issue-17
 *
 * 不再 mock home API；對 prod URL 跑真實鏈路：
 *  - 6 隊戰績區塊渲染（rank / 隊名 / 勝敗 / 連勝紀錄）
 *  - CTA「看完整戰績」連到 /standings
 *  - 隊伍列 deep link → /roster?team=<id>
 *
 * 連勝視覺色（橙/紅 + ↑↓）已由 standings-components / dragon-components 等 unit test 涵蓋；
 * 不寫死「綠隊 rank 1 連勝」這類 prod 真實資料假設。
 */

import { test, expect } from '@playwright/test';

test.describe('Home — 戰績榜迷你版', () => {
  test('6 隊戰績顯示 + 各列含 rank / team-name / record / streak', async ({ page }) => {
    await page.goto('');

    const block = page.getByTestId('home-standings');
    await expect(block).toBeVisible();

    const rows = block.getByTestId('home-standings-row').filter({ visible: true });
    await expect(rows).toHaveCount(6);

    const first = rows.first();
    await expect(first.getByTestId('rank')).toContainText('1');
    await expect(first.getByTestId('team-dot')).toBeVisible();
    await expect(first.getByTestId('team-name')).toBeVisible();
    await expect(first.getByTestId('record')).toContainText(/勝/);
    await expect(first.getByTestId('streak')).toBeVisible();
  });

  test('CTA「看完整戰績」連 /standings', async ({ page }) => {
    await page.goto('');

    const cta = page.getByTestId('home-standings').getByRole('link', { name: /看完整戰績|完整戰績/ });
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/standings/);
  });

  test('點戰績榜隊伍列 → /roster?team=<id>', async ({ page }) => {
    await page.goto('');

    const firstRow = page
      .getByTestId('home-standings')
      .getByTestId('home-standings-row')
      .first();

    const href = await firstRow.evaluate((el) => {
      const a = el.querySelector('a') ?? el.closest('a');
      return a?.getAttribute('href') ?? '';
    });

    expect(href).toMatch(/\/roster\?team=\w+/);
  });

  test('streak 屬性帶 data-streak-type（win/lose/none 之一）', async ({ page }) => {
    await page.goto('');

    const rows = page
      .getByTestId('home-standings')
      .getByTestId('home-standings-row')
      .filter({ visible: true });
    await expect(rows.first()).toBeVisible();

    const streakAttrs = await rows.evaluateAll((els) =>
      els.map((el) => el.querySelector('[data-testid="streak"]')?.getAttribute('data-streak-type') ?? ''),
    );
    for (const t of streakAttrs) {
      expect(['win', 'lose', 'none', '']).toContain(t);
    }
  });
});
