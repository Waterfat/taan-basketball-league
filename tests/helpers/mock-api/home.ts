/**
 * Playwright Mock — Home（首頁 dashboard）攔截
 *
 * 涵蓋範圍：
 *   - mockHomeAPI：攔截 GAS endpoint + /data/home.json
 *
 * 使用方式：
 *   await mockHomeAPI(page, mockHomeData());
 *   await mockHomeAPI(page, null, { gasFails: true });
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
