/**
 * /schedule 賽程頁 E2E — 對戰組合 / 賽程順序 Toggle（Issue #14）
 *
 * Coverage:
 *   E-701 (B-9.1): 賽程頁有「對戰組合 / 賽程順序」toggle
 *   E-702 (B-9.2): 智慧預設邏輯與首頁一致（gamesPublished → 賽程順序 / 未公告 → 對戰組合）
 *
 * 測試資料策略：
 *   - 已公告順序：mockFullSchedule()（currentWeek=5，games[] 均有 home/away）
 *   - 尚未公告：mockFullSchedule() 的 currentWeek 對應週，手動覆寫 games[] 為空
 *     home/away（使用 mockGameWeek 的 opts 機制 + ScheduleData 組合），
 *     命名為 mockScheduleUnpublished（本檔 inline helper）
 *   - 透過 mockScheduleAPI(page, data) 攔截 /data/schedule.json，不打 production
 *   - 賽程頁 toggle 的 data-testid 前綴為 schedule-matchups-*（與首頁 matchups-* 平行，
 *     詳見 home-matchups.spec.ts；若實作選擇共用同一套 testid，請更新此 docstring）
 *
 * Tags: @schedule @issue-14 @matchups
 */

import { test, expect } from '@playwright/test';
import { mockScheduleAPI } from '../../../helpers/mock-api';
import { mockFullSchedule, mockGameWeek } from '../../../fixtures/schedule';
import type { ScheduleData } from '../../../fixtures/schedule';

/**
 * 將 currentWeek 的所有 games 的 home/away 清空，模擬「順序尚未公告」情境。
 * matchups[] 保留組合資訊（combos 還是知道對戰配對，只是場次順序未定）。
 */
function mockScheduleUnpublished(): ScheduleData {
  const base = mockFullSchedule();
  return {
    ...base,
    allWeeks: base.allWeeks.map((week) => {
      if (week.type !== 'game' || week.week !== base.currentWeek) return week;
      return mockGameWeek(week.week, week.date, {
        phase: week.phase,
        venue: week.venue,
        matchups: week.matchups,
        games: week.games.map((g) => ({
          ...g,
          home: '',
          away: '',
          homeScore: null,
          awayScore: null,
          status: 'upcoming' as const,
        })),
      });
    }),
  };
}

test.describe('Schedule — 對戰組合 / 賽程順序 Toggle（已公告順序）', () => {
  // ── E-701: 賽程頁有 toggle ──
  test(
    'E-701: 賽程頁顯示「對戰組合 / 賽程順序」toggle',
    { tag: ['@schedule', '@issue-14', '@matchups'] },
    async ({ page }) => {
      // 資料驗證：確認 /data/schedule.json 被正確攔截
      const dataPromise = page.waitForResponse((resp) =>
        /\/data\/schedule\.json$/.test(resp.url()) && resp.status() === 200,
      );
      await mockScheduleAPI(page, mockFullSchedule());
      await page.goto('schedule');
      await dataPromise;

      // UI 結構：toggle 存在且可見
      const toggle = page.getByTestId('schedule-matchups-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('role', 'radiogroup');

      // 互動：toggle 包含「對戰組合」與「賽程順序」兩個按鈕
      await expect(page.getByTestId('schedule-matchups-toggle-combo')).toBeVisible();
      await expect(page.getByTestId('schedule-matchups-toggle-order')).toBeVisible();
    },
  );

  // ── E-702a: 已公告 → 預設「賽程順序」 ──
  test(
    'E-702a: games[] 有 home/away → 智慧預設為「賽程順序」',
    { tag: ['@schedule', '@issue-14', '@matchups'] },
    async ({ page }) => {
      const dataPromise = page.waitForResponse((resp) =>
        /\/data\/schedule\.json$/.test(resp.url()) && resp.status() === 200,
      );
      await mockScheduleAPI(page, mockFullSchedule());
      await page.goto('schedule');
      await dataPromise;

      // UI 結構：schedule 頁面載入完成
      await expect(page.getByTestId('schedule-matchups-toggle')).toBeVisible();

      // 互動：驗證預設選中「賽程順序」
      await expect(
        page.getByTestId('schedule-matchups-toggle-order'),
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(
        page.getByTestId('schedule-matchups-toggle-combo'),
      ).toHaveAttribute('aria-pressed', 'false');

      // 資料驗證：「賽程順序」列表可見，「對戰組合」列表隱藏
      await expect(page.getByTestId('schedule-matchups-order-list')).toBeVisible();
      await expect(page.getByTestId('schedule-matchups-combo-list')).toBeHidden();
    },
  );

  // ── E-701b: toggle 切換互動 ──
  test(
    'E-701b: 點擊 toggle → 正確切換視圖並更新 aria-pressed',
    { tag: ['@schedule', '@issue-14', '@matchups'] },
    async ({ page }) => {
      await mockScheduleAPI(page, mockFullSchedule());
      await page.goto('schedule');
      await expect(page.getByTestId('schedule-matchups-toggle')).toBeVisible();

      // 互動：切換到「對戰組合」
      await page.getByTestId('schedule-matchups-toggle-combo').click();

      // UI 結構：combo 選中，order 取消選中
      await expect(
        page.getByTestId('schedule-matchups-toggle-combo'),
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(
        page.getByTestId('schedule-matchups-toggle-order'),
      ).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('schedule-matchups-combo-list')).toBeVisible();
      await expect(page.getByTestId('schedule-matchups-order-list')).toBeHidden();

      // 互動：切換回「賽程順序」
      await page.getByTestId('schedule-matchups-toggle-order').click();

      // 資料驗證：order view 重新出現
      await expect(page.getByTestId('schedule-matchups-order-list')).toBeVisible();
      await expect(page.getByTestId('schedule-matchups-combo-list')).toBeHidden();
    },
  );
});

test.describe('Schedule — 對戰組合 / 賽程順序 Toggle（順序未公告）', () => {
  // ── E-702b: 未公告 → 預設「對戰組合」 ──
  test(
    'E-702b: games[].home/away 為空 → 智慧預設為「對戰組合」',
    { tag: ['@schedule', '@issue-14', '@matchups'] },
    async ({ page }) => {
      const dataPromise = page.waitForResponse((resp) =>
        /\/data\/schedule\.json$/.test(resp.url()) && resp.status() === 200,
      );
      await mockScheduleAPI(page, mockScheduleUnpublished());
      await page.goto('schedule');
      await dataPromise;

      // UI 結構：toggle 可見
      await expect(page.getByTestId('schedule-matchups-toggle')).toBeVisible();

      // 互動：驗證預設選中「對戰組合」
      await expect(
        page.getByTestId('schedule-matchups-toggle-combo'),
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(
        page.getByTestId('schedule-matchups-toggle-order'),
      ).toHaveAttribute('aria-pressed', 'false');

      // 資料驗證：combo 列表可見，order 列表隱藏
      await expect(page.getByTestId('schedule-matchups-combo-list')).toBeVisible();
      await expect(page.getByTestId('schedule-matchups-order-list')).toBeHidden();
    },
  );

  // ── E-702c: 未公告 → 顯示提示 ──
  test(
    'E-702c: games[] 全部無 home/away → 顯示「本週場次順序尚未公告」提示',
    { tag: ['@schedule', '@issue-14', '@matchups'] },
    async ({ page }) => {
      await mockScheduleAPI(page, mockScheduleUnpublished());
      await page.goto('schedule');

      // UI 結構：toggle 存在
      await expect(page.getByTestId('schedule-matchups-toggle')).toBeVisible();

      // 互動：提示元素可見
      const hint = page.getByTestId('schedule-matchups-unpublished-hint');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('本週場次順序尚未公告');

      // 資料驗證：combo 視圖下對戰組合應有資料（matchups[] 有內容）
      await expect(page.getByTestId('schedule-matchups-combo-list')).toBeVisible();
    },
  );
});
