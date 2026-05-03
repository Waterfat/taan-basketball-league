/**
 * E-7：/schedule 真實 weeks E2E（Issue #17 AC-6, AC-X1）
 *
 * @coverage E-7
 * @issue #17
 * @tag @schedule @issue-17
 *
 * 不再 mock Sheets API；對 prod URL 跑真實鏈路：
 *  - hero week 號 + 日期顯示（不寫死 W5 / 2/7）
 *  - 預設展開當前週的對戰卡片（>= 1 張）
 *  - chip timeline 至少有 1 個 active chip
 *
 * 邊界情境（empty 該週、第 1 週 disabled、loading / error / suspended chip 細節）
 * 依 e2e-guide.md 「需 deterministic 假資料」原則改為 unit / integration：
 *  - tests/unit/schedule-utils.test.ts（utils）
 *  - tests/unit/error-empty-states.test.ts（ErrorState / EmptyState SSR）
 *  - tests/integration/api-no-fallback.integration.test.ts（AC-E1）
 *
 * 視覺強調 / RWD 細節由 schedule-toggle.spec.ts 與 schedule-utils 單元測試覆蓋。
 */

import { test, expect } from '@playwright/test';

test.describe('Schedule — 真實 weeks', () => {
  test('hero 顯示真實 WEEK 號 + 日期，不為破碎字串', async ({ page }) => {
    await page.goto('schedule');

    const heading = page.getByRole('heading', { name: /WEEK\s*\d+/i });
    await expect(heading).toBeVisible();

    const body = page.locator('body');
    await expect(body).not.toContainText('undefined');
    await expect(body).not.toContainText('NaN');
  });

  test('chip timeline 至少 1 個 active chip', async ({ page }) => {
    await page.goto('schedule');

    const activeChip = page.locator('[data-testid="chip-week"][data-active="true"]');
    await expect(activeChip).toHaveCount(1);

    // active chip 有非空文字
    const text = (await activeChip.textContent())?.trim() ?? '';
    expect(text.length).toBeGreaterThan(0);
  });

  test('當前週對戰卡片顯示 >= 1 張', async ({ page }) => {
    await page.goto('schedule');

    const cards = page.locator('[data-testid="game-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('展開工作人員 → staff-panel 可見（若該卡有 staff toggle）', async ({ page }) => {
    await page.goto('schedule');

    const card = page.locator('[data-testid="game-card"]').first();
    const toggle = card.locator('[data-testid="staff-toggle"]');

    if ((await toggle.count()) > 0) {
      await toggle.click();
      const panel = card.locator('[data-testid="staff-panel"]');
      await expect(panel).toBeVisible();

      // 再點收起
      await toggle.click();
      await expect(panel).toBeHidden();
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'staff toggle 缺席（prod 該週無 staff 資料）→ 跳過互動驗證',
      });
    }
  });

  test('點擊另一週 chip → hero header 同步更新', async ({ page }) => {
    await page.goto('schedule');

    const chips = page.locator('[data-testid="chip-week"]');
    const chipCount = await chips.count();
    test.skip(chipCount < 2, 'prod 賽程僅 1 週 → 跳過切換');

    // 找一個非 active 的 chip 點下去
    const inactiveChip = page.locator('[data-testid="chip-week"][data-active="false"]').first();
    const chipText = (await inactiveChip.textContent())?.trim() ?? '';
    const chipWeek = chipText.match(/\d+/)?.[0];

    if (chipWeek) {
      await inactiveChip.click();
      await expect(page.getByRole('heading', { name: new RegExp(`WEEK\\s*${chipWeek}`, 'i') })).toBeVisible();
    }
  });
});
