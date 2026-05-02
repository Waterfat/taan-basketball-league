/**
 * Playwright 測試用：攔截 GAS / fallback JSON 請求
 *
 * 使用方式：
 *   await mockScheduleAPI(page, mockFullSchedule());          // 成功回應
 *   await mockScheduleAPI(page, null, { gasFails: true });    // GAS 失敗 → fallback JSON
 *   await mockScheduleAPI(page, null, { allFail: true });     // GAS + JSON 都失敗
 *   await mockScheduleAPI(page, schedule, { delayMs: 2000 }); // 延遲 2 秒模擬載入
 *
 *   await mockStandingsAPI(page, mockFullStandings());        // 戰績榜
 *
 *   await mockBoxscoreSheetsAPI(page, [game1, ...]);          // boxscore 直打 Sheets API
 *   await mockLeadersAPI(page, mockFullLeaders());            // 領先榜（GAS handleStats）
 */

import type { Page, Route } from '@playwright/test';
import type { ScheduleData } from '../fixtures/schedule';
import type { StandingsData } from '../fixtures/standings';
import type { BoxscoreGame, BoxscoreData } from '../fixtures/boxscore';
import { mockRawBoxscoreSheetsResponse } from '../fixtures/boxscore';
import type { LeaderData } from '../fixtures/leaders';

interface MockOptions<T> {
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
const SHEETS_PATTERN = /sheets\.googleapis\.com\/v4\/spreadsheets\/.+\/values\/.+/;
const LEADERS_JSON_PATTERN = /\/data\/(leaders|stats)\.json$/;

async function mockKindAPI<T>(
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

export async function mockStandingsAPI(
  page: Page,
  standings: StandingsData | null,
  opts: MockOptions<StandingsData> = {},
): Promise<void> {
  return mockKindAPI<StandingsData>(page, /\/data\/standings\.json$/, standings, opts);
}

/**
 * 攔截 Google Sheets API 直打請求（boxscore tab）
 *
 * 使用方式：
 *   await mockBoxscoreSheetsAPI(page, [game1, game2, ...]);            // 成功
 *   await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });      // Sheets 失敗
 *   await mockBoxscoreSheetsAPI(page, games, { delayMs: 1500 });       // 慢速網路
 */
interface BoxscoreMockOptions {
  /** Sheets API 是否失敗 */
  sheetsFails?: boolean;
  /** 延遲毫秒數 */
  delayMs?: number;
}

export async function mockBoxscoreSheetsAPI(
  page: Page,
  games: BoxscoreGame[],
  opts: BoxscoreMockOptions = {},
): Promise<void> {
  const { sheetsFails = false, delayMs = 0 } = opts;

  await page.route(SHEETS_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (sheetsFails) {
      await route.fulfill({ status: 500, body: 'Sheets API error' });
      return;
    }
    const body = mockRawBoxscoreSheetsResponse(games);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/**
 * 攔截 GAS handleStats endpoint（leaders）
 *
 * 使用方式：
 *   await mockLeadersAPI(page, mockFullLeaders());
 *   await mockLeadersAPI(page, null, { allFail: true });
 *   await mockLeadersAPI(page, leaders, { delayMs: 1500 });
 */
interface LeadersMockOptions {
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

/** 同時 mock boxscore + leaders（單頁 e2e 常用組合） */
export async function mockBoxscoreAndLeaders(
  page: Page,
  opts: {
    boxscore?: BoxscoreGame[];
    leaders?: LeaderData | null;
    boxOpts?: BoxscoreMockOptions;
    leadersOpts?: LeadersMockOptions;
  } = {},
): Promise<void> {
  await mockBoxscoreSheetsAPI(page, opts.boxscore ?? [], opts.boxOpts);
  await mockLeadersAPI(page, opts.leaders ?? null, opts.leadersOpts);
}

// re-export type for fixture consumers
export type { BoxscoreData, LeaderData };
