/**
 * Playwright Mock — Roster & Dragon（球員名單 + 龍虎榜）攔截
 *
 * [Issue #13] 從 GAS Webapp 中介層改為直打 Google Sheets API v4。
 * 行為由 mockKindAPI 統一處理（簡化版：第一層 Sheets 恆 fail，由 fallback JSON 供應資料）。
 *
 * 涵蓋範圍：
 *   - mockRosterAPI：攔截 Sheets API + /data/roster.json
 *   - mockDragonAPI：攔截 Sheets API + /data/dragon.json
 *   - mockRosterAndDragon：同時攔截兩者（大多數測試使用）
 *
 * 使用方式：
 *   await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockFullDragonboard() });
 *   await mockRosterAndDragon(page, { roster: null, dragon: null }, { allFail: true });
 *   await mockRosterAndDragon(page, { roster: mockFullRoster(), dragon: mockEmptyDragonboard() });
 */

import type { Page } from '@playwright/test';
import type { RosterData } from '../../fixtures/roster';
import type { DragonData } from '../../fixtures/dragon';
import { mockKindAPI, type MockOptions } from './schedule';

export async function mockRosterAPI(
  page: Page,
  roster: RosterData | null,
  opts: MockOptions<RosterData> = {},
): Promise<void> {
  return mockKindAPI<RosterData>(page, /\/data\/roster\.json$/, roster, opts);
}

export async function mockDragonAPI(
  page: Page,
  dragon: DragonData | null,
  opts: MockOptions<DragonData> = {},
): Promise<void> {
  return mockKindAPI<DragonData>(page, /\/data\/dragon\.json$/, dragon, opts);
}

export interface RosterAndDragonMockOptions {
  /** 名稱保留 `gasFails` 以維持向後相容；簡化版實作中第一層 Sheets 恆 fail，此 flag 不再影響行為。 */
  gasFails?: boolean;
  allFail?: boolean;
  delayMs?: number;
}

export async function mockRosterAndDragon(
  page: Page,
  data: { roster: RosterData | null; dragon: DragonData | null },
  opts: RosterAndDragonMockOptions = {},
): Promise<void> {
  await Promise.all([
    mockRosterAPI(page, data.roster, opts),
    mockDragonAPI(page, data.dragon, opts),
  ]);
}
