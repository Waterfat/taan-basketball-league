/**
 * Playwright Mock — Standings（戰績榜）攔截
 *
 * [Issue #13] 從 GAS Webapp 中介層改為直打 Google Sheets API v4。
 * 行為由 mockKindAPI 統一處理（簡化版：第一層 Sheets 恆 fail，由 fallback JSON 供應資料）。
 *
 * 涵蓋範圍：
 *   - mockStandingsAPI：攔截 Sheets API + /data/standings.json
 *
 * 使用方式：
 *   await mockStandingsAPI(page, mockFullStandings());
 *   await mockStandingsAPI(page, null, { allFail: true });
 */

import type { Page } from '@playwright/test';
import type { StandingsData } from '../../fixtures/standings';
import { mockKindAPI, type MockOptions } from './schedule';

export async function mockStandingsAPI(
  page: Page,
  standings: StandingsData | null,
  opts: MockOptions<StandingsData> = {},
): Promise<void> {
  return mockKindAPI<StandingsData>(page, /\/data\/standings\.json$/, standings, opts);
}
