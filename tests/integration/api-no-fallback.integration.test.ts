/**
 * Integration: api.ts AC-E1 — Sheets 配置正確但失敗時，不 fallback 到 static JSON
 *
 * Tag: @api-no-fallback @issue-17 @ac-e1
 * Coverage:
 *   I-7（Issue #17 B-28）：fetchData 在 Sheets API 配置正確（非 placeholder）但失敗時，
 *                          回 source: 'error'，**不**走 static JSON fallback。
 *   理由：static JSON 是賽季初範例，Sheets 失敗時 fallback 等於假裝成功，
 *   違反 AC-E1（使用者應看到「資料載入失敗 + 重試」而非 W3 例行賽範例）。
 *
 * 行為改變（與既有 tests/integration/api-fallback.integration.test.ts 衝突）：
 *   既有測試驗 Sheets 失敗 → fallback static（source: 'static'），是 Issue #17 前的舊行為。
 *   Phase 2 task 改寫 api.ts 後，既有測試需更新或標 @deprecated。
 *
 * 例外條件（仍走 static 的合法情境）：
 *   - SHEET_ID / API_KEY 未設定或為 placeholder（dev 本機未設定 .env.local）
 *   - 該 kind 的 transformer 為 stub（SHEETS_RANGES 未登錄）
 *
 * 測試資料策略：
 *   stubEnv 注入 PUBLIC_SHEET_ID / PUBLIC_SHEETS_API_KEY；
 *   globalThis.fetch mock：sheets URL → throw，static JSON URL → 200 with fixture（驗 fallback **不**被觸發）
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockFullStandings } from '../fixtures/standings';
import { mockFullDragonboard } from '../fixtures/dragon';

const ORIG_FETCH = globalThis.fetch;
const TEST_SHEET_ID = 'TEST_SHEET_ID_xyz';
const TEST_API_KEY = 'TEST_API_KEY_xyz';

describe('api.ts AC-E1：Sheets 配置正確但失敗時不 fallback (integration, Issue #17)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PUBLIC_SHEET_ID', TEST_SHEET_ID);
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', TEST_API_KEY);
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    vi.unstubAllEnvs();
  });

  it('standings: Sheets HTTP 500 → 不 fallback static，回 source: "error"', async () => {
    let staticCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('standings.json')) {
        staticCalled = true;
        return new Response(JSON.stringify(mockFullStandings()), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('standings');

    expect(staticCalled).toBe(false);
    expect(result.source).toBe('error');
    expect(result.data).toBeNull();
  });

  it('standings: Sheets network throw → 不 fallback static，回 source: "error"', async () => {
    let staticCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        throw new Error('network down');
      }
      if (u.includes('standings.json')) {
        staticCalled = true;
        return new Response(JSON.stringify(mockFullStandings()), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('standings');

    expect(staticCalled).toBe(false);
    expect(result.source).toBe('error');
  });

  it('dragon: Sheets HTTP 500 → 不 fallback static，回 source: "error"', async () => {
    let staticCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response('Sheets error', { status: 500 });
      }
      if (u.includes('dragon.json')) {
        staticCalled = true;
        return new Response(JSON.stringify(mockFullDragonboard()), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('dragon');

    expect(staticCalled).toBe(false);
    expect(result.source).toBe('error');
  });

  it('SHEET_ID 為 placeholder → 仍走 static fallback（合法例外）', async () => {
    vi.stubEnv('PUBLIC_SHEET_ID', 'REPLACE_WITH_SPREADSHEET_ID');
    let staticCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        throw new Error('should not be called');
      }
      if (u.includes('standings.json')) {
        staticCalled = true;
        return new Response(JSON.stringify(mockFullStandings()), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('standings');

    expect(staticCalled).toBe(true);
    expect(result.source).toBe('static');
  });

  it('SHEET_ID 未設定 → 仍走 static fallback（合法例外）', async () => {
    vi.stubEnv('PUBLIC_SHEET_ID', '');
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', '');
    let staticCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('standings.json')) {
        staticCalled = true;
        return new Response(JSON.stringify(mockFullStandings()), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('standings');

    expect(staticCalled).toBe(true);
    expect(result.source).toBe('static');
  });
});
