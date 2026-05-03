/**
 * Integration: src/lib/api.ts 取 standings 時應保留 matrix 欄位
 *
 * Tag: @api-standings @matrix @issue-14
 * Coverage:
 *   Issue #14 I-1: fetchData('standings') 從靜態 JSON 路徑回傳資料時，matrix 欄位完整保留
 *   邊界：matrix 為 6×6 net-points 矩陣（number | null），對角線必為 null
 *
 * 註：當前 api.ts 對 standings 的 Sheets path 只 transform `teams[]`（不含 matrix），
 *     matrix 透過靜態 JSON fallback 提供。本測試驗證 fallback path 能正確保留 matrix。
 *     未來若 Sheets transformer 補完整 matrix 解析，本測試可擴充覆蓋 Sheets path。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockMatrix6x6, mockStandingsWithMatrix } from '../fixtures/standings';

const ORIG_FETCH = globalThis.fetch;

describe('api.ts standings matrix (integration)', () => {
  beforeEach(() => {
    vi.resetModules();
    // 清掉 Sheets 環境，強制走 static JSON fallback
    vi.stubEnv('PUBLIC_SHEET_ID', '');
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', '');
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    vi.unstubAllEnvs();
  });

  // ────── I-1: matrix 欄位完整保留 ──────
  it('fetchData(standings) 從靜態 JSON 路徑取得時，matrix 欄位完整保留', async () => {
    const fixture = mockStandingsWithMatrix();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('standings.json')) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type StandingsWithMatrix = typeof fixture;
    const result = await fetchData<StandingsWithMatrix>('standings');

    expect(result.source).toBe('static');
    expect(result.data).toBeTruthy();
    expect(result.data?.matrix).toBeDefined();
    expect(result.data?.matrix?.teams).toEqual(['紅', '黑', '藍', '綠', '黃', '白']);
    expect(result.data?.matrix?.results).toHaveLength(6);
    expect(result.data?.matrix?.results[0]).toHaveLength(6);
  });

  // ────── 邊界：對角線必為 null ──────
  it('matrix 對角線（self vs self）必為 null', async () => {
    const fixture = mockStandingsWithMatrix();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('standings.json')) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type StandingsWithMatrix = typeof fixture;
    const result = await fetchData<StandingsWithMatrix>('standings');
    const results = result.data?.matrix?.results ?? [];

    for (let i = 0; i < 6; i++) {
      expect(results[i][i]).toBeNull();
    }
  });

  // ────── 邊界：非對角線為 number ──────
  it('matrix 非對角線 cell 為 number（淨勝分） [qa-v2 補充]', async () => {
    const fixture = mockStandingsWithMatrix();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('standings.json')) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type StandingsWithMatrix = typeof fixture;
    const result = await fetchData<StandingsWithMatrix>('standings');
    const results = result.data?.matrix?.results ?? [];

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (i === j) continue;
        expect(typeof results[i][j]).toBe('number');
      }
    }
  });

  // ────── 邊界：matrix 缺失時不影響 teams ──────
  it('JSON 無 matrix 欄位 → fetch 仍成功，data.matrix 為 undefined（向後相容） [qa-v2 補充]', async () => {
    const fixture = mockStandingsWithMatrix();
    delete (fixture as { matrix?: unknown }).matrix;

    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('standings.json')) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type StandingsWithMatrix = typeof fixture & { matrix?: ReturnType<typeof mockMatrix6x6> };
    const result = await fetchData<StandingsWithMatrix>('standings');

    expect(result.source).toBe('static');
    expect(result.data?.teams).toHaveLength(6);
    expect(result.data?.matrix).toBeUndefined();
  });
});
