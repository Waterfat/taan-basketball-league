/**
 * /schedule 賽程頁 E2E
 *
 * Tag: @schedule
 * Coverage: AC-1 ~ AC-15（全部）+ qa-v2 補充
 *
 * 測試資料策略：
 * - 預設用 mockScheduleAPI() 攔截 GAS 與 fallback JSON 請求
 * - 不會打 production Google Sheets
 * - 各情境用 fixtures/schedule.ts 的工廠函式建立
 */

import { test, expect } from '@playwright/test';
import { mockFullSchedule, mockCurrentWeekMissing } from '../../fixtures/schedule';
import { mockScheduleAPI } from '../../helpers/mock-api';

test.describe('Schedule Page @schedule', () => {
  // ────── AC-1: 預設顯示當前週 ──────
  test('AC-1: 預設顯示當前週的 Hero header + chip timeline + 6 張對戰卡片', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    // UI 結構
    await expect(page.getByRole('heading', { name: /WEEK\s*5/i })).toBeVisible();
    await expect(page.getByText(/2026.*2.*7/)).toBeVisible();
    await expect(page.getByText(/三重/)).toBeVisible();
    await expect(page.getByText(/例行賽/)).toBeVisible();

    // chip timeline：當前週應為 active 狀態
    const activeChip = page.locator('[data-testid="chip-week"][data-active="true"]');
    await expect(activeChip).toContainText('5');

    // 6 張對戰卡片
    const cards = page.locator('[data-testid="game-card"]');
    await expect(cards).toHaveCount(6);
  });

  // ────── AC-2: 切換週 ──────
  test('AC-2: 點擊另一週 chip → Hero header + 對戰卡片同步更新', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    // 互動
    await page.locator('[data-testid="chip-week"]', { hasText: '1' }).first().click();

    // UI 同步更新
    await expect(page.getByRole('heading', { name: /WEEK\s*1/i })).toBeVisible();
    await expect(page.getByText(/熱身賽/)).toBeVisible();

    const cards = page.locator('[data-testid="game-card"]');
    await expect(cards).toHaveCount(6);
  });

  // ────── AC-3: 完賽場次比分顯示 + 贏家強調 ──────
  test('AC-3: 完賽場次顯示大字比分，贏家有視覺強調', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const firstCard = page.locator('[data-testid="game-card"]').first();

    // 比分顯示
    await expect(firstCard.locator('[data-testid="score-home"]')).toContainText(/\d+/);
    await expect(firstCard.locator('[data-testid="score-away"]')).toContainText(/\d+/);

    // 贏家視覺強調（data-winner 屬性 / class / aria）
    const winner = firstCard.locator('[data-winner="true"]');
    await expect(winner).toBeVisible();
  });

  // ────── AC-4: 即將進行場次 ──────
  test('AC-4: 即將進行場次顯示「— vs —」+ 「即將進行」徽章', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    // 切到 W7（全部 upcoming）
    await page.locator('[data-testid="chip-week"]', { hasText: '7' }).first().click();

    const cards = page.locator('[data-testid="game-card"]');
    await expect(cards.first().locator('[data-testid="status-badge"]')).toContainText(/即將進行/);
    await expect(cards.first().locator('[data-testid="score-home"]')).toContainText('—');
  });

  // ────── AC-5: 完賽卡片可點 → 跳 /boxscore ──────
  test('AC-5: 點擊完賽卡片 → 導向 /boxscore', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const finishedCard = page.locator('[data-testid="game-card"][data-status="finished"]').first();
    await finishedCard.click();

    await expect(page).toHaveURL(/\/boxscore/);
  });

  // ────── AC-5 [qa-v2 補充]：upcoming 卡片不可點 ──────
  test('[qa-v2 補充] AC-5b: 即將進行場次不可點擊（cursor 非 pointer 或 click 無導航）', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');
    await page.locator('[data-testid="chip-week"]', { hasText: '7' }).first().click();

    const upcomingCard = page.locator('[data-testid="game-card"][data-status="upcoming"]').first();
    const cursor = await upcomingCard.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).not.toBe('pointer');
  });

  // ────── AC-6: 展開工作人員 ──────
  test('AC-6: 點卡片展開箭頭 → 顯示工作人員（裁判 / 場務 / 攝影 / 器材）', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const cardWithStaff = page.locator('[data-testid="game-card"]').first();
    await cardWithStaff.locator('[data-testid="staff-toggle"]').click();

    const staffPanel = cardWithStaff.locator('[data-testid="staff-panel"]');
    await expect(staffPanel).toBeVisible();
    await expect(staffPanel).toContainText(/裁判/);
  });

  // ────── AC-6 [qa-v2 補充]：再次點擊收起 ──────
  test('[qa-v2 補充] AC-6b: 再次點擊展開箭頭 → 工作人員面板收起', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const card = page.locator('[data-testid="game-card"]').first();
    const toggle = card.locator('[data-testid="staff-toggle"]');
    const panel = card.locator('[data-testid="staff-panel"]');

    await toggle.click();
    await expect(panel).toBeVisible();

    await toggle.click();
    await expect(panel).toBeHidden();
  });

  // ────── AC-7: 暫停週 chip ──────
  test('AC-7: 點擊「休」chip → 顯示暫停原因', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const suspendedChip = page.locator('[data-testid="chip-suspended"]').first();
    await suspendedChip.click();

    await expect(page.getByText(/過年連假/)).toBeVisible();
  });

  // ────── AC-14: 連續多週暫停 ──────
  test('AC-14: 連續 3 週暫停 → chip 列出現 3 個獨立「休」chip，皆可點開', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const suspendedChips = page.locator('[data-testid="chip-suspended"]');
    await expect(suspendedChips).toHaveCount(3);

    // 第三個應該是 228 連假
    await suspendedChips.nth(2).click();
    await expect(page.getByText(/228/)).toBeVisible();
  });

  // ────── AC-15: 混合場次 ──────
  test('AC-15: 同週 4 完賽 + 2 即將進行 → 各自正確渲染', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    // 切到 W6（mixed）
    await page.locator('[data-testid="chip-week"]', { hasText: '6' }).first().click();

    const finished = page.locator('[data-testid="game-card"][data-status="finished"]');
    const upcoming = page.locator('[data-testid="game-card"][data-status="upcoming"]');
    await expect(finished).toHaveCount(4);
    await expect(upcoming).toHaveCount(2);
  });

  // ────── AC-10: Loading state ──────
  test('AC-10: 資料載入中 → 看到 skeleton', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule(), { delayMs: 1500 });
    await page.goto('/schedule');

    // 進頁後立即（資料還沒回）skeleton 應出現
    await expect(page.locator('[data-testid="skeleton-chip"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="skeleton-card"]').first()).toBeVisible();

    // 資料載入後 skeleton 消失
    await expect(page.locator('[data-testid="game-card"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="skeleton-card"]')).toHaveCount(0);
  });

  // ────── AC-11: Error state ──────
  test('AC-11: GAS + JSON 都失敗 → 顯示「無法載入賽程」+ 重試按鈕', async ({ page }) => {
    await mockScheduleAPI(page, null, { allFail: true });
    await page.goto('/schedule');

    await expect(page.getByText(/無法載入賽程/)).toBeVisible();
    await expect(page.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ────── AC-11 互動：點重試 ──────
  test('AC-11b: 點重試按鈕 → 重新嘗試載入', async ({ page }) => {
    let callCount = 0;
    await page.route(/script\.google\.com.*exec/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });
    await page.route(/\/data\/schedule\.json/, async (route) => {
      await route.fulfill({ status: 500, body: 'fail' });
    });

    await page.goto('/schedule');
    await expect(page.getByRole('button', { name: /重試/ })).toBeVisible();

    const initialCount = callCount;
    await page.getByRole('button', { name: /重試/ }).click();

    // 點重試後應該再次嘗試（call 數會增加）
    await expect.poll(() => callCount).toBeGreaterThan(initialCount);
  });

  // ────── AC-12: Empty state ──────
  test('AC-12: 該週無比賽 → 顯示「本週無賽程，下週見」+ 看上一週按鈕', async ({ page }) => {
    await mockScheduleAPI(page, mockCurrentWeekMissing());
    await page.goto('/schedule');

    await expect(page.getByText(/本週無賽程/)).toBeVisible();
    await expect(page.getByRole('button', { name: /看上一週/ })).toBeVisible();
  });

  // ────── AC-13: 第 1 週邊界 ──────
  test('AC-13: 賽季第 1 週 + 空資料 → 「看上一週」按鈕禁用或隱藏', async ({ page }) => {
    await mockScheduleAPI(page, { season: 25, currentWeek: 1, allWeeks: [] });
    await page.goto('/schedule');

    const button = page.getByRole('button', { name: /看上一週/ });
    const isHidden = (await button.count()) === 0;
    if (!isHidden) {
      await expect(button).toBeDisabled();
    }
  });

  // ────── AC-7 [qa-v2 補充]：點休 chip 不應切到該週 ──────
  test('[qa-v2 補充] AC-7b: 點擊「休」chip 不會把 Hero header 換成「休」（不切該週）', async ({ page }) => {
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const headerBefore = await page.getByRole('heading', { level: 1 }).textContent();
    await page.locator('[data-testid="chip-suspended"]').first().click();
    const headerAfter = await page.getByRole('heading', { level: 1 }).textContent();

    expect(headerAfter).toBe(headerBefore);
  });
});

// ────── AC-8 / AC-9: RWD ──────
test.describe('Schedule Page RWD @schedule', () => {
  test('AC-8 (regression-mobile): 手機寬度 → chip 緊湊版「W5」、卡片直排', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= 768, 'mobile project only');
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const chip = page.locator('[data-testid="chip-week"]').first();
    const text = (await chip.textContent()) ?? '';
    expect(text.trim()).toMatch(/^W?\d+$/); // 緊湊版

    // 卡片直排：第一張和第二張的 X 座標應接近（垂直排列）
    const cards = page.locator('[data-testid="game-card"]');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    expect(Math.abs((box1?.x ?? 0) - (box2?.x ?? 0))).toBeLessThan(20);
    expect((box2?.y ?? 0)).toBeGreaterThan(box1?.y ?? 0);
  });

  test('AC-9 (regression desktop): 桌機寬度 → chip 顯示「W5 · 2/7」、卡片並排', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width < 768, 'desktop project only');
    await mockScheduleAPI(page, mockFullSchedule());
    await page.goto('/schedule');

    const activeChip = page.locator('[data-testid="chip-week"][data-active="true"]');
    await expect(activeChip).toContainText(/2.*7/); // 含日期

    // 卡片兩兩並排：前兩張卡 Y 座標相近
    const cards = page.locator('[data-testid="game-card"]');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    expect(Math.abs((box1?.y ?? 0) - (box2?.y ?? 0))).toBeLessThan(20);
    expect((box2?.x ?? 0)).toBeGreaterThan(box1?.x ?? 0);
  });
});
