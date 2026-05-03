/**
 * Integration: src/lib/api.ts 直打 Google Sheets API（v4 values:batchGet）
 *
 * Tag: @api-sheets @home @standings @dragon
 * Coverage:
 *   Issue #13 I-1: fetchData('home') 命中 sheets URL，回傳 source: 'sheets'
 *   Issue #13 I-2: fetchData('standings') 命中 sheets URL，回傳 6 隊資料
 *   Issue #13 I-3: fetchData('dragon') 命中 sheets URL，回傳龍虎榜
 *
 * 註：本檔測試的是 Issue #13 完成後的新行為（移除 GAS Webapp 中介，直接打 Sheets v4 API）。
 *     Phase 2 task 實作前會 RED；實作後 GREEN。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIG_FETCH = globalThis.fetch;
const TEST_SHEET_ID = 'TEST_SHEET_ID_123';
const TEST_API_KEY = 'TEST_API_KEY_xyz';

describe('api.ts 直打 Sheets API (integration)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PUBLIC_SHEET_ID', TEST_SHEET_ID);
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', TEST_API_KEY);
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    vi.unstubAllEnvs();
  });

  /** 模擬 Sheets v4 batchGet 回應的 helper */
  function mockSheetsBatch(valueRanges: { range: string; values: string[][] }[]): typeof fetch {
    return vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com/v4/spreadsheets')) {
        return new Response(JSON.stringify({ valueRanges }), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;
  }

  // ────── I-1: fetchData('standings') 命中 Sheets URL，驗 URL composition ──────
  it('fetchData(standings) 命中 sheets URL（含 SHEET_ID + API_KEY），回傳 source: sheets', async () => {
    let capturedUrl = '';
    globalThis.fetch = vi.fn(async (url) => {
      capturedUrl = String(url);
      if (capturedUrl.includes('sheets.googleapis.com')) {
        return new Response(
          JSON.stringify({
            valueRanges: [
              { range: 'datas!P2:T7', values: [['紅', '15', '5', '75.0%', '8連勝']] },
            ],
          }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected: ${capturedUrl}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('standings');

    expect(capturedUrl).toContain('sheets.googleapis.com/v4/spreadsheets/');
    expect(capturedUrl).toContain(TEST_SHEET_ID);
    expect(capturedUrl).toContain(`key=${TEST_API_KEY}`);
    expect(result.source).toBe('sheets');
    expect(result.data).toBeTruthy();
  });

  // ────── I-2: fetchData('standings') ──────
  it('fetchData(standings) 回傳 6 隊資料', async () => {
    globalThis.fetch = mockSheetsBatch([
      {
        range: 'datas!P2:T7',
        values: [
          ['紅', '15', '5', '75.0%', '8連勝'],
          ['黑', '11', '9', '55.0%', '2連敗'],
          ['藍', '5', '15', '25.0%', '2連敗'],
          ['綠', '16', '4', '80.0%', '2連勝'],
          ['黃', '6', '14', '30.0%', '1連勝'],
          ['白', '7', '13', '35.0%', '1連敗'],
        ],
      },
    ]);

    const { fetchData } = await import('../../src/lib/api');
    type Standings = { teams: Array<{ team: string; wins: number; losses: number }> };
    const result = await fetchData<Standings>('standings');

    expect(result.source).toBe('sheets');
    expect(result.data?.teams).toHaveLength(6);
  });

  // ────── I-3: fetchData('dragon') ──────
  it('fetchData(dragon) 回傳龍虎榜資料', async () => {
    globalThis.fetch = mockSheetsBatch([
      {
        range: 'datas!D13:L76',
        values: [
          // 模擬 1 個球員 row（實際 Code.gs 期待 multi-col 結構，這裡只驗 source 與 fetch 命中）
          ['李子昂', '黑', '20', '10', '1', '—', '31', '', ''],
        ],
      },
    ]);

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('dragon');

    expect(result.source).toBe('sheets');
    expect(result.data).toBeTruthy();
  });

  // ────── 邊界：missing env vars ──────
  it('PUBLIC_SHEET_ID 未設定 → 直接 fallback 靜態 JSON（不打 Sheets API）[qa-v2 補充]', async () => {
    vi.stubEnv('PUBLIC_SHEET_ID', '');

    let sheetsCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        sheetsCalled = true;
        return new Response('should not be called', { status: 500 });
      }
      if (u.includes('standings.json')) {
        return new Response(JSON.stringify({ teams: [] }), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('standings');

    expect(sheetsCalled).toBe(false);
    expect(result.source).toBe('static');
  });

  it('PUBLIC_SHEET_ID 為 placeholder（REPLACE_WITH_）→ fallback 靜態 [qa-v2 補充]', async () => {
    vi.stubEnv('PUBLIC_SHEET_ID', 'REPLACE_WITH_SPREADSHEET_ID');

    let sheetsCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        sheetsCalled = true;
        return new Response('should not be called', { status: 500 });
      }
      if (u.includes('standings.json')) {
        return new Response(JSON.stringify({ teams: [] }), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('standings');

    expect(sheetsCalled).toBe(false);
    expect(result.source).toBe('static');
  });
});
