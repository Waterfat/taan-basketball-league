/**
 * Playwright Mock — Standings（戰績榜）攔截
 *
 * 涵蓋範圍：
 *   - mockStandingsAPI：攔截 GAS endpoint + /data/standings.json
 *
 * 使用方式：
 *   await mockStandingsAPI(page, mockFullStandings());
 *   await mockStandingsAPI(page, null, { gasFails: true });
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
