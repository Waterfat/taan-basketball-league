/**
 * Playwright Mock — Boxscore（逐場數據）攔截
 *
 * 涵蓋範圍：
 *   - mockBoxscoreSheetsAPI：攔截 Google Sheets API 直打請求（boxscore tab）
 *   - mockBoxscoreAndLeaders：同時 mock boxscore + leaders（頁面常用組合）
 *
 * 使用方式：
 *   await mockBoxscoreSheetsAPI(page, [game1, game2]);
 *   await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
 *   await mockBoxscoreSheetsAPI(page, games, { delayMs: 1500 });
 *   await mockBoxscoreAndLeaders(page, { boxscore: games, leaders: mockFullLeaders() });
 */

import type { Page, Route } from '@playwright/test';
import type { BoxscoreGame, BoxscoreData } from '../../fixtures/boxscore';
import { mockRawBoxscoreSheetsResponse } from '../../fixtures/boxscore';
import type { LeaderData } from '../../fixtures/leaders';
import { mockLeadersAPI, type LeadersMockOptions } from './leaders';

const SHEETS_PATTERN = /sheets\.googleapis\.com\/v4\/spreadsheets\/.+\/values\/.+/;

export interface BoxscoreMockOptions {
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
