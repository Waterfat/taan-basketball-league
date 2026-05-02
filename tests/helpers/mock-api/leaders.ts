/**
 * Playwright Mock — Leaders（龍虎榜）攔截
 *
 * 涵蓋範圍：
 *   - mockLeadersAPI：攔截 GAS ?type=stats endpoint + /data/(leaders|stats).json
 *
 * 使用方式：
 *   await mockLeadersAPI(page, mockFullLeaders());
 *   await mockLeadersAPI(page, null, { allFail: true });
 *   await mockLeadersAPI(page, leaders, { delayMs: 1500 });
 */

import type { Page, Route } from '@playwright/test';
import type { LeaderData } from '../../fixtures/leaders';

const LEADERS_JSON_PATTERN = /\/data\/(leaders|stats)\.json$/;

export interface LeadersMockOptions {
  /** GAS stats endpoint 是否失敗（true → fallback 到 JSON） */
  gasFails?: boolean;
  /** GAS + JSON fallback 都失敗 */
  allFail?: boolean;
  /** 延遲毫秒數 */
  delayMs?: number;
}

export async function mockLeadersAPI(
  page: Page,
  leaders: LeaderData | null,
  opts: LeadersMockOptions = {},
): Promise<void> {
  const { gasFails = false, allFail = false, delayMs = 0 } = opts;

  // GAS 攔截（type=stats）
  await page.route(/script\.google\.com\/macros\/s\/.+\/exec\?type=stats/, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail || gasFails) {
      await route.fulfill({ status: 500, body: 'GAS stats error' });
      return;
    }
    if (leaders) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(leaders),
      });
      return;
    }
    await route.fulfill({ status: 500, body: 'No leaders data' });
  });

  // JSON fallback 攔截
  await page.route(LEADERS_JSON_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail) {
      await route.fulfill({ status: 500, body: 'JSON fallback failed' });
      return;
    }
    if (leaders) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(leaders),
      });
      return;
    }
    await route.continue();
  });
}
