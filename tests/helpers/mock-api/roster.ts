/**
 * Playwright Mock — Roster & Dragon（球員名單 + 龍虎榜）攔截
 *
 * 涵蓋範圍：
 *   - mockRosterAPI：攔截 GAS + /data/roster.json
 *   - mockDragonAPI：攔截 GAS + /data/dragon.json
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
