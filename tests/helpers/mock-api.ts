/**
 * Playwright 測試用：攔截 GAS / fallback JSON 請求
 *
 * 使用方式：
 *   await mockScheduleAPI(page, mockFullSchedule());          // 成功回應
 *   await mockScheduleAPI(page, null, { gasFails: true });    // GAS 失敗 → fallback JSON
 *   await mockScheduleAPI(page, null, { allFail: true });     // GAS + JSON 都失敗
 *   await mockScheduleAPI(page, schedule, { delayMs: 2000 }); // 延遲 2 秒模擬載入
 */

import type { Page, Route } from '@playwright/test';
import type { ScheduleData } from '../fixtures/schedule';

interface MockOptions {
  /** GAS 是否失敗（true 時會 fallback 到 JSON） */
  gasFails?: boolean;
  /** GAS + JSON 都失敗 */
  allFail?: boolean;
  /** 延遲毫秒數（模擬慢速網路） */
  delayMs?: number;
  /** 自訂 JSON fallback 內容（不指定就用 schedule 同一份） */
  fallbackJson?: ScheduleData;
}

const GAS_PATTERN = /script\.google\.com\/macros\/s\/.+\/exec/;
const JSON_PATTERN = /\/data\/schedule\.json$/;

export async function mockScheduleAPI(
  page: Page,
  schedule: ScheduleData | null,
  opts: MockOptions = {},
): Promise<void> {
  const { gasFails = false, allFail = false, delayMs = 0, fallbackJson } = opts;

  // 攔截 GAS 請求
  await page.route(GAS_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail || gasFails) {
      await route.fulfill({ status: 500, body: 'GAS error' });
      return;
    }
    if (schedule) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(schedule),
      });
      return;
    }
    await route.fulfill({ status: 500, body: 'No data' });
  });

  // 攔截 fallback JSON 請求
  await page.route(JSON_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail) {
      await route.fulfill({ status: 500, body: 'JSON fallback failed' });
      return;
    }
    const data = fallbackJson ?? schedule;
    if (data) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
      return;
    }
    await route.continue(); // 沒指定就放行（讀真實 public/data/schedule.json）
  });
}
