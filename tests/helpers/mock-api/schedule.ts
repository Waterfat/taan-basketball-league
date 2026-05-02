/**
 * Playwright Mock — Schedule & 通用 GAS/JSON 攔截
 *
 * 涵蓋範圍：
 *   - mockScheduleAPI：攔截 GAS endpoint + /data/schedule.json
 *   - mockKindAPI：通用兩層攔截（GAS 優先，失敗 fallback JSON）
 *
 * 使用方式：
 *   await mockScheduleAPI(page, mockFullSchedule());
 *   await mockScheduleAPI(page, null, { gasFails: true });
 *   await mockScheduleAPI(page, null, { allFail: true });
 *   await mockScheduleAPI(page, schedule, { delayMs: 2000 });
 */

import type { Page, Route } from '@playwright/test';
import type { ScheduleData } from '../../fixtures/schedule';

export interface MockOptions<T> {
  /** GAS 是否失敗（true 時會 fallback 到 JSON） */
  gasFails?: boolean;
  /** GAS + JSON 都失敗 */
  allFail?: boolean;
  /** 延遲毫秒數（模擬慢速網路） */
  delayMs?: number;
  /** 自訂 JSON fallback 內容（不指定就用 data 同一份） */
  fallbackJson?: T;
}

const GAS_PATTERN = /script\.google\.com\/macros\/s\/.+\/exec/;

export async function mockKindAPI<T>(
  page: Page,
  jsonPattern: RegExp,
  data: T | null,
  opts: MockOptions<T> = {},
): Promise<void> {
  const { gasFails = false, allFail = false, delayMs = 0, fallbackJson } = opts;

  await page.route(GAS_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail || gasFails) {
      await route.fulfill({ status: 500, body: 'GAS error' });
      return;
    }
    if (data) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
      return;
    }
    await route.fulfill({ status: 500, body: 'No data' });
  });

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
