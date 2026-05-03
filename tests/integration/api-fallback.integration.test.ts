/**
 * Integration: src/lib/api.ts 三層 fallback 行為（Issue #13 後）
 *
 * Tag: @api-fallback @schedule @standings @roster @dragon
 * Coverage:
 *   I-7（Sheets HTTP 500 → JSON fallback）
 *   I-8（Sheets + JSON 都失敗 → source: error）
 *   Issue #5 I-1: fetchData('roster') fallback chain
 *   Issue #5 I-2: fetchData('dragon') fallback chain
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockFullSchedule } from '../fixtures/schedule';
import { mockFullStandings } from '../fixtures/standings';
import { mockFullRoster } from '../fixtures/roster';
import { mockFullDragonboard } from '../fixtures/dragon';

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

  // ────── I-7: Sheets HTTP 500 → JSON fallback ──────
  it('schedule: Sheets 失敗 → fallback static JSON（source: static）', async () => {
    const schedule = mockFullSchedule();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('schedule.json')) {
        return new Response(JSON.stringify(schedule), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('schedule');

    expect(result.source).toBe('static');
    expect(result.data).toMatchObject({ season: 25 });
  });

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
  it('standings: Sheets 失敗 → fallback standings.json（source: static）', async () => {
    const standings = mockFullStandings();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('standings.json')) {
        return new Response(JSON.stringify(standings), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData<typeof standings>('standings');

    expect(result.source).toBe('static');
    expect(result.data?.teams).toHaveLength(6);
  });

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
  it('roster: Sheets 失敗 → fallback roster.json', async () => {
    const roster = mockFullRoster();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('roster.json')) {
        return new Response(JSON.stringify(roster), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData<typeof roster>('roster');

    expect(result.source).toBe('static');
    expect(result.data?.teams).toHaveLength(6);
  });

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
  it('dragon: Sheets 失敗 → fallback dragon.json', async () => {
    const dragon = mockFullDragonboard();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('dragon.json')) {
        return new Response(JSON.stringify(dragon), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData<typeof dragon>('dragon');

    expect(result.source).toBe('static');
    expect(result.data?.players.length).toBeGreaterThanOrEqual(1);
  });

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
