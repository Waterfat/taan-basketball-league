/**
 * Integration: src/lib/api.ts 三層 fallback 行為
 *
 * Tag: @api-fallback @schedule @standings
 * Coverage: 涵蓋 AC-11（GAS 失敗 → JSON fallback → 全失敗）的後端邏輯部分
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockFullSchedule } from '../fixtures/schedule';
import { mockFullStandings } from '../fixtures/standings';

// 動態 mock import.meta.env 與 fetch
const ORIG_FETCH = globalThis.fetch;

describe('api.ts 三層 fallback (integration)', () => {
  beforeEach(() => {
    vi.resetModules();
    // 模擬有效 GAS URL
    vi.stubEnv('PUBLIC_GAS_WEBAPP_URL', 'https://script.google.com/macros/s/test/exec');
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    vi.unstubAllEnvs();
  });

  it('GAS 成功 → 直接回傳 GAS 資料（source: gas）', async () => {
    const schedule = mockFullSchedule();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('script.google.com')) {
        return new Response(JSON.stringify(schedule), { status: 200 });
      }
      throw new Error('should not hit JSON');
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('schedule');

    expect(result.source).toBe('gas');
    expect(result.data).toMatchObject({ season: 25, currentWeek: 5 });
  });

  it('GAS 失敗 → fallback 到靜態 JSON（source: static）', async () => {
    const schedule = mockFullSchedule();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('script.google.com')) {
        return new Response('GAS error', { status: 500 });
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

  it('GAS throw + JSON 也 throw → source: error', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('schedule');

    expect(result.source).toBe('error');
    expect(result.data).toBeNull();
    expect(result.error).toContain('network down');
  });

  it('GAS_URL 未設定（含預設 placeholder）→ 直接走 JSON fallback', async () => {
    vi.stubEnv('PUBLIC_GAS_WEBAPP_URL', 'https://script.google.com/macros/s/REPLACE_WITH_DEPLOY_ID/exec');

    const schedule = mockFullSchedule();
    let gasCalled = false;
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('script.google.com')) {
        gasCalled = true;
        return new Response('should not be called', { status: 500 });
      }
      if (u.includes('schedule.json')) {
        return new Response(JSON.stringify(schedule), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('schedule');

    expect(gasCalled).toBe(false);
    expect(result.source).toBe('static');
  });

  // Covers: I-2（standings）— 確認 fetchData('standings') 走 GAS → JSON fallback
  it('standings: GAS 失敗 → 從 standings.json fallback（source: static）', async () => {
    const standings = mockFullStandings();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('script.google.com')) {
        return new Response('GAS error', { status: 500 });
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
    expect(result.data?.phase).toBe('例行賽');
  });

  // Covers: I-3（standings）— GAS + JSON 都失敗 → source: error
  it('standings: GAS + JSON 都失敗 → source: error（驅動 UI error state）', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('script.google.com')) {
        return new Response('GAS error', { status: 500 });
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
});
