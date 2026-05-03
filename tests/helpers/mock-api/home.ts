/**
 * Playwright Mock — Home（首頁 dashboard）攔截
 *
 * [Issue #13] 從 GAS Webapp 中介層改為直打 Google Sheets API v4。
 * 行為由 mockKindAPI 統一處理（簡化版：第一層 Sheets 恆 fail，由 fallback JSON 供應資料）。
 *
 * 涵蓋範圍：
 *   - mockHomeAPI：攔截 Sheets API + /data/home.json
 *
 * 使用方式：
 *   await mockHomeAPI(page, mockHomeData());
 *   await mockHomeAPI(page, null, { allFail: true });
 *   await mockHomeAPI(page, mockHomeData(), { delayMs: 2000 });
 */

import type { Page } from '@playwright/test';
import type { HomeData } from '../../fixtures/home';
import { mockKindAPI, type MockOptions } from './schedule';

export async function mockHomeAPI(
  page: Page,
  data: HomeData | null,
  opts: MockOptions<HomeData> = {},
): Promise<void> {
  return mockKindAPI<HomeData>(page, /\/data\/home\.json$/, data, opts);
}
