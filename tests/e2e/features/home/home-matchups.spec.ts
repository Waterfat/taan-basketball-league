/**
 * E-6c：/（首頁）本週對戰預覽 + Toggle（Issue #17 AC-5, AC-X1）
 *
 * @coverage E-6c
 * @issue #17
 * @tag @home @matchups @issue-17
 *
 * 不再 mock home API；對 prod URL 跑真實鏈路：
 *  - 對戰預覽區塊渲染（matchup-card 數量 >= 1）
 *  - toggle radiogroup 結構存在 + 切換可改 aria-pressed
 *  - URL ?view=combo / ?view=order 同步
 *
 * 智慧預設（gamesPublished true→order / false→combo）邏輯由 unit test 涵蓋
 * （tests/unit/matchups-toggle-utils.test.ts）；本 spec 不再驗 deterministic 預設情境。
 *
 * 「本週場次順序尚未公告」提示文字情境（gamesPublished:false）改由 unit 元件測試
 * （resolveDefaultView + UI render contract）覆蓋，不在 prod e2e 主動觸發。
 */

import { test, expect } from '@playwright/test';

test.describe('Home — 本週對戰預覽', () => {
  test('home-matchups 區塊可見 + 有 matchup-card', async ({ page }) => {
    await page.goto('');

    await expect(page.getByTestId('home-matchups')).toBeVisible();

    const cards = page.getByTestId('matchup-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('toggle radiogroup 結構存在', async ({ page }) => {
    await page.goto('');

    const toggle = page.getByTestId('matchups-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('role', 'radiogroup');

    await expect(page.getByTestId('matchups-toggle-combo')).toBeVisible();
    await expect(page.getByTestId('matchups-toggle-order')).toBeVisible();
  });

  test('toggle 切換 → aria-pressed 與 list visibility 同步', async ({ page }) => {
    await page.goto('');
    await expect(page.getByTestId('matchups-toggle')).toBeVisible();

    // 不假設預設是 combo 還是 order（取決於 prod gamesPublished 真實狀態）
    await page.getByTestId('matchups-toggle-combo').click();
    await expect(page.getByTestId('matchups-toggle-combo')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('matchups-toggle-order')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('matchups-combo-list')).toBeVisible();

    await page.getByTestId('matchups-toggle-order').click();
    await expect(page.getByTestId('matchups-toggle-order')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('matchups-order-list')).toBeVisible();
  });

  test('toggle 切換 → URL query 同步 ?view=combo / ?view=order', async ({ page }) => {
    await page.goto('');
    await expect(page.getByTestId('home-matchups')).toBeVisible();

    await page.getByTestId('matchups-toggle-combo').click();
    await expect(page).toHaveURL(/[?&]view=combo/);

    await page.getByTestId('matchups-toggle-order').click();
    await expect(page).toHaveURL(/[?&]view=order/);
  });

  test('帶 ?view=combo 進入 → combo toggle active', async ({ page }) => {
    await page.goto('?view=combo');

    await expect(page.getByTestId('home-matchups')).toBeVisible();
    await expect(page.getByTestId('matchups-toggle-combo')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('matchups-combo-list')).toBeVisible();
  });
});
