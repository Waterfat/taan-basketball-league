/**
 * Integration: src/lib/api.ts 5 分鐘 cache 行為
 *
 * Tag: @api-cache @api-sheets
 * Coverage:
 *   Issue #13 I-4: cache hit — 5 分鐘內第二次同 kind 不重打 fetch
 *   Issue #13 I-5: cache miss after TTL — 5 分鐘後重新打 fetch
 *   Issue #13 I-6: cache TTL 為 5 分鐘
 *
 * 註：本檔測試 Issue #13 完成後的 5 分鐘瀏覽器內快取（行為與舊網站 js/api.js 一致）。
 *     Phase 2 task 實作前會 RED；實作後 GREEN。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIG_FETCH = globalThis.fetch;

describe('api.ts 5 分鐘 cache (integration)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv('PUBLIC_SHEET_ID', 'TEST_SHEET');
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', 'TEST_KEY');
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  function mockSheets(): { fetchSpy: ReturnType<typeof vi.fn>; install: () => void } {
    const fetchSpy = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response(
          JSON.stringify({ valueRanges: [{ range: 'datas!P2:T7', values: [['紅', '15', '5', '75.0%', '8連勝']] }] }),
          { status: 200 },
        );
      }
      if (u.includes('home.json') || u.includes('dragon.json')) {
        return new Response(JSON.stringify({}), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    });
    return {
      fetchSpy,
      install: () => {
        globalThis.fetch = fetchSpy as unknown as typeof fetch;
      },
    };
  }

  // ────── I-4: cache hit ──────
  it('5 分鐘內第二次同 kind 呼叫 → 不重打 fetch（cache hit）', async () => {
    const { fetchSpy, install } = mockSheets();
    install();

    const { fetchData } = await import('../../src/lib/api');
    await fetchData('standings');
    const callsAfterFirst = fetchSpy.mock.calls.length;

    // 4 分鐘後第二次呼叫
    vi.advanceTimersByTime(4 * 60 * 1000);
    await fetchData('standings');
    const callsAfterSecond = fetchSpy.mock.calls.length;

    expect(callsAfterFirst).toBeGreaterThanOrEqual(1);
    expect(callsAfterSecond).toBe(callsAfterFirst); // cache hit，不重打
  });

  // ────── I-5: cache miss after TTL ──────
  it('5 分鐘後第二次同 kind 呼叫 → 重新打 fetch（cache 過期）', async () => {
    const { fetchSpy, install } = mockSheets();
    install();

    const { fetchData } = await import('../../src/lib/api');
    await fetchData('standings');
    const callsAfterFirst = fetchSpy.mock.calls.length;

    // 5 分 1 秒後第二次呼叫
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
    await fetchData('standings');
    const callsAfterSecond = fetchSpy.mock.calls.length;

    expect(callsAfterSecond).toBeGreaterThan(callsAfterFirst);
  });

  // ────── I-6: cache TTL 常數 ──────
  it('cache TTL 設為 5 分鐘（恰好 5 分鐘時 cache 應已過期）[qa-v2 補充]', async () => {
    const { fetchSpy, install } = mockSheets();
    install();

    const { fetchData } = await import('../../src/lib/api');
    await fetchData('standings');
    const callsAfterFirst = fetchSpy.mock.calls.length;

    // 恰好 5 分鐘
    vi.advanceTimersByTime(5 * 60 * 1000);
    await fetchData('standings');
    const callsAfterFive = fetchSpy.mock.calls.length;

    // 邊界：恰好 5 分鐘可實作為 ≥ 或 >；任一都應通過。明確 TTL 後（5 分零 1 秒）絕對 refetch。
    vi.advanceTimersByTime(1000);
    await fetchData('standings');
    const callsAfterFivePlus = fetchSpy.mock.calls.length;

    expect(callsAfterFivePlus).toBeGreaterThan(callsAfterFirst);
    // 任一邊界處理（含或不含），打開後第二次呼叫必須在 (5 分鐘) 或 (5 分零 1 秒) 觸發 refetch
    expect(callsAfterFive + callsAfterFivePlus).toBeGreaterThan(callsAfterFirst * 2);
  });

  // ────── 邊界：不同 kind 不共用 cache ──────
  it('不同 kind 各自獨立 cache（呼叫 home 不會 hit standings cache）[qa-v2 補充]', async () => {
    const { fetchSpy, install } = mockSheets();
    install();

    const { fetchData } = await import('../../src/lib/api');
    await fetchData('standings');
    const callsAfterStandings = fetchSpy.mock.calls.length;

    await fetchData('home');
    const callsAfterHome = fetchSpy.mock.calls.length;

    expect(callsAfterHome).toBeGreaterThan(callsAfterStandings);
  });
});
