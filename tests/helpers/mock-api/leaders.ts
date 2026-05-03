/**
 * Playwright Mock — Leaders（龍虎榜）攔截
 *
 * [Issue #13] 從 GAS Webapp 中介層改為直打 Google Sheets API v4。
 * Leaders 採「簡化版」策略：本 helper 只提供 fallback JSON 攔截，第一層
 * Sheets API 的攔截交由其他同時 mount 的 helper（boxscore.ts 已自帶 SHEETS_PATTERN
 * route 並回傳真實 Sheets payload）；若單獨使用 mockLeadersAPI 而未搭配 boxscore
 * mock，則 Sheets 第一層走真實網路 → 在 E2E 環境下會自動 fail → fallback JSON 接手。
 *
 * 設計取捨：避免在這裡註冊與 boxscore.ts 相同的 SHEETS_PATTERN route 而造成
 * 後註冊優先（LIFO）覆蓋掉 boxscore 真實 mock 的 200 回應。
 *
 * 涵蓋範圍：
 *   - mockLeadersAPI：攔截 /data/(leaders|stats).json
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
  /**
   * 名稱保留 `gasFails` 以維持向後相容；本 helper 已不註冊第一層 Sheets route，
   * 此 flag 不再影響行為（保留以避免破壞既有呼叫端）。
   */
  gasFails?: boolean;
  /** JSON fallback 失敗 */
  allFail?: boolean;
  /** 延遲毫秒數 */
  delayMs?: number;
}

export async function mockLeadersAPI(
  page: Page,
  leaders: LeaderData | null,
  opts: LeadersMockOptions = {},
): Promise<void> {
  const { allFail = false, delayMs = 0 } = opts;

  // 只攔截 JSON fallback，不再 route SHEETS_PATTERN（避免覆蓋 boxscore 的 mock）
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
