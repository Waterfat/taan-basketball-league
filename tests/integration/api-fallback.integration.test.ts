/**
 * Integration: src/lib/api.ts fallback 行為（保留 case）
 *
 * ⚠️ Issue #17 AC-E1 後行為改變（2026-05）：
 *   配置正確且 Sheets 失敗時，不再 fallback static，直接 source: 'error'。
 *   原本「Sheets 失敗 → fallback static」4 條 case 已移除（行為改變，由 api-no-fallback.integration.test.ts 接手驗新行為）。
 *   保留：
 *     - placeholder 情境 → 走 static fallback（合法例外）
 *     - 兩層都失敗（Sheets fail + static fail）→ source: error
 *
 * Tag: @api-fallback @schedule @standings @roster @dragon
 * Coverage:
 *   I-8（Sheets + JSON 都失敗 → source: error）
 *   placeholder 情境 → JSON 直接 fallback
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockFullSchedule } from '../fixtures/schedule';

const ORIG_FETCH = globalThis.fetch;
const TEST_SHEET_ID = 'TEST_SHEET_ID_xyz';
const TEST_API_KEY = 'TEST_API_KEY_xyz';

describe('api.ts 三層 fallback (integration, Issue #13)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PUBLIC_SHEET_ID', TEST_SHEET_ID);
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', TEST_API_KEY);
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    vi.unstubAllEnvs();
  });

  // ⚠️ Issue #17 AC-E1：「schedule: Sheets 失敗 → fallback static」case 已移除
  //   新行為驗證在 tests/integration/api-no-fallback.integration.test.ts

  // ────── I-8: 兩層都失敗 → source: error ──────
  it('schedule: Sheets + JSON 都 throw → source: error', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('schedule');

    expect(result.source).toBe('error');
    expect(result.data).toBeNull();
    expect(result.error).toContain('network down');
  });

  it('SHEET_ID 為 placeholder（REPLACE_WITH_）→ 直接走 JSON fallback（不打 Sheets）', async () => {
    vi.stubEnv('PUBLIC_SHEET_ID', 'REPLACE_WITH_SPREADSHEET_ID');

    const schedule = mockFullSchedule();
    let sheetsCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        sheetsCalled = true;
        return new Response('should not be called', { status: 500 });
      }
      if (u.includes('schedule.json')) {
        return new Response(JSON.stringify(schedule), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('schedule');

    expect(sheetsCalled).toBe(false);
    expect(result.source).toBe('static');
  });

  // ────── standings ──────
  // ⚠️ Issue #17 AC-E1：「standings: Sheets 失敗 → fallback static」case 已移除
  //   新行為驗證在 tests/integration/api-no-fallback.integration.test.ts

  it('standings: Sheets + JSON 都失敗 → source: error', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('standings.json')) {
        return new Response('not found', { status: 404 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('standings');

    expect(result.source).toBe('error');
    expect(result.data).toBeNull();
  });

  // ────── roster ──────
  // ⚠️ Issue #17 AC-E1：「roster: Sheets 失敗 → fallback static」case 已移除
  //   roster 的 SHEETS_RANGES 為空 [] 屬於合法 static fallback 情境（kind 無 transformer），
  //   非 AC-E1 直接 verdict 範圍；新行為驗證在 tests/integration/api-no-fallback.integration.test.ts

  it('roster: Sheets + JSON 都失敗 → source: error', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('roster.json')) {
        return new Response('not found', { status: 404 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('roster');

    expect(result.source).toBe('error');
    expect(result.data).toBeNull();
  });

  // ────── dragon ──────
  // ⚠️ Issue #17 AC-E1：「dragon: Sheets 失敗 → fallback static」case 已移除
  //   新行為驗證在 tests/integration/api-no-fallback.integration.test.ts

  it('dragon: Sheets + JSON 都失敗 → source: error', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('dragon.json')) {
        return new Response('not found', { status: 404 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('dragon');

    expect(result.source).toBe('error');
    expect(result.data).toBeNull();
  });
});
