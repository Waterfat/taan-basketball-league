/**
 * Playwright Mock — Schedule & 通用 Sheets/JSON 攔截
 *
 * [Issue #13] 從 GAS Webapp 中介層改為直打 Google Sheets API v4。
 * 第一層 Sheets 攔截採「簡化版」策略：恆 fulfill 500，讓第二層 fallback JSON
 * 提供 ground truth。E2E 主要驗 UI render，transformer 邏輯由 unit/integration
 * 層覆蓋。
 *
 * 涵蓋範圍：
 *   - mockScheduleAPI：攔截 Sheets API + /data/schedule.json
 *   - mockKindAPI：通用兩層攔截（Sheets 預設 fail，fallback JSON 提供資料）
 *   - SHEETS_PATTERN：對外 export，供其他模組與 unit test 共用
 *
 * 使用方式：
 *   await mockScheduleAPI(page, mockFullSchedule());
 *   await mockScheduleAPI(page, null, { gasFails: true });   // 名稱保留向後相容
 *   await mockScheduleAPI(page, null, { allFail: true });
 *   await mockScheduleAPI(page, schedule, { delayMs: 2000 });
 */

import type { Page, Route } from '@playwright/test';
import type { ScheduleData } from '../../fixtures/schedule';

export interface MockOptions<T> {
  /**
   * 第一層（Sheets API）是否失敗
   * 名稱保留 `gasFails` 以維持向後相容；語意已改為 sheetsFails，
   * 在簡化版實作中此 flag 不再影響行為（第一層恆 fail）。
   */
  gasFails?: boolean;
  /** Sheets + JSON fallback 都失敗 */
  allFail?: boolean;
  /** 延遲毫秒數（模擬慢速網路） */
  delayMs?: number;
  /** 自訂 JSON fallback 內容（不指定就用 data 同一份） */
  fallbackJson?: T;
}

/**
 * 匹配 Google Sheets API v4 的 values 端點：
 *   https://sheets.googleapis.com/v4/spreadsheets/{ID}/values:batchGet?...
 *   https://sheets.googleapis.com/v4/spreadsheets/{ID}/values/{RANGE}?...
 */
export const SHEETS_PATTERN = /sheets\.googleapis\.com\/v4\/spreadsheets\/[^/]+\/values/;

export async function mockKindAPI<T>(
  page: Page,
  jsonPattern: RegExp,
  data: T | null,
  opts: MockOptions<T> = {},
): Promise<void> {
  const { allFail = false, delayMs = 0, fallbackJson } = opts;

  // 第一層：Sheets API — 簡化版恆 fail，由 fallback JSON 供應資料
  await page.route(SHEETS_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ status: 500, body: 'Sheets disabled in E2E mock' });
  });

  // 第二層：static JSON fallback
  await page.route(jsonPattern, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail) {
      await route.fulfill({ status: 500, body: 'JSON fallback failed' });
      return;
    }
    const fallback = fallbackJson ?? data;
    if (fallback) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fallback),
      });
      return;
    }
    await route.continue();
  });
}

export async function mockScheduleAPI(
  page: Page,
  schedule: ScheduleData | null,
  opts: MockOptions<ScheduleData> = {},
): Promise<void> {
  return mockKindAPI<ScheduleData>(page, /\/data\/schedule\.json$/, schedule, opts);
}
