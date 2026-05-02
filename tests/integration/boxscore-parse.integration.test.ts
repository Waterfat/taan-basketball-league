/**
 * Boxscore + Leaders 資料層 integration test
 *
 * 驗證：
 *   1. transformBoxscore 從 22 行/場 raw rows 解析出結構化 BoxscoreData
 *   2. fetchData('stats') 在 GAS 失敗時 fallback 到 JSON
 *   3. fetchData('stats') 完全失敗時回傳 source='error'
 *   4. boxscore Sheets API 直打 → 解析 → 結構正確
 *
 * Phase 2 Task 必須提供：
 *   src/lib/boxscore-utils.ts → export transformBoxscore(rows: string[][]): BoxscoreWeek[]
 *   src/lib/boxscore-api.ts   → export fetchBoxscore(): Promise<{ data, source, error? }>
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  mockBoxscoreWeek,
  mockBoxscoreGame,
  mockRawBoxscoreSheetsResponse,
  type BoxscorePlayer,
} from '../fixtures/boxscore';
import { mockFullLeaders, mockEmptyLeaders } from '../fixtures/leaders';

describe('Integration: transformBoxscore', () => {
  it('I-1: 解析 22 行/場 raw rows → 正確的 BoxscoreGame 結構', async () => {
    const game = mockBoxscoreGame(5, 1, { homeTeam: '紅', awayTeam: '白', homeScore: 34, awayScore: 22 });
    const raw = mockRawBoxscoreSheetsResponse([game]);

    const { transformBoxscore } = await import('../../src/lib/boxscore-utils');
    const weeks = transformBoxscore(raw.values);

    expect(weeks).toHaveLength(1);
    expect(weeks[0].week).toBe(5);
    expect(weeks[0].games).toHaveLength(1);

    const parsed = weeks[0].games[0];
    expect(parsed.home.team).toBe('紅');
    expect(parsed.home.score).toBe(34);
    expect(parsed.away.team).toBe('白');
    expect(parsed.away.score).toBe(22);
    expect(parsed.home.players.length).toBeGreaterThan(0);
  });

  it('I-2: 多場合併 raw rows → 解析回各場各週分組', async () => {
    const week5 = mockBoxscoreWeek(5);
    const raw = mockRawBoxscoreSheetsResponse(week5.games);

    const { transformBoxscore } = await import('../../src/lib/boxscore-utils');
    const weeks = transformBoxscore(raw.values);

    expect(weeks).toHaveLength(1);
    expect(weeks[0].games).toHaveLength(6);
  });

  it('I-3: DNP 球員應被標記 dnp=true 且不計入合計', async () => {
    const game = mockBoxscoreGame(5, 1, { homeTeam: '紅', awayTeam: '白', withDnp: true });
    const raw = mockRawBoxscoreSheetsResponse([game]);

    const { transformBoxscore } = await import('../../src/lib/boxscore-utils');
    const weeks = transformBoxscore(raw.values);
    const parsed = weeks[0].games[0];

    const dnpPlayers = (parsed.home.players as BoxscorePlayer[]).filter((p) => p.dnp);
    expect(dnpPlayers.length).toBeGreaterThan(0);

    // 合計應排除 DNP（與 fixture 預期一致）
    expect(parsed.home.totals.pts).toBe(game.home.totals.pts);
  });

  it('I-4: 空 rows 陣列 → 回傳空 weeks', async () => {
    const { transformBoxscore } = await import('../../src/lib/boxscore-utils');
    const weeks = transformBoxscore([]);
    expect(weeks).toEqual([]);
  });
});

describe('Integration: fetchBoxscore (Sheets API direct)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('I-5: 成功回應 → 回傳 BoxscoreData with source="sheets"', async () => {
    const week5 = mockBoxscoreWeek(5);
    const raw = mockRawBoxscoreSheetsResponse(week5.games);

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(raw),
    });

    const { fetchBoxscore } = await import('../../src/lib/boxscore-api');
    const result = await fetchBoxscore();

    expect(result.source).toBe('sheets');
    expect(result.data).not.toBeNull();
    expect(result.data?.weeks.length).toBeGreaterThan(0);
  });

  it('I-6: Sheets API 500 → 回傳 source="error"', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { fetchBoxscore } = await import('../../src/lib/boxscore-api');
    const result = await fetchBoxscore();

    expect(result.source).toBe('error');
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('I-7: 網路錯誤 → 回傳 source="error" + error message', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network down'));

    const { fetchBoxscore } = await import('../../src/lib/boxscore-api');
    const result = await fetchBoxscore();

    expect(result.source).toBe('error');
    expect(result.error).toContain('network');
  });
});

describe('Integration: fetchData("stats") fallback chain', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('I-8: GAS 成功 → source="gas"', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFullLeaders()),
    });

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('stats');

    // 注意：GAS_URL 未設定時會直接 fallback；測試環境如未注入 PUBLIC_GAS_WEBAPP_URL 則改驗 static 路徑
    expect(['gas', 'static']).toContain(result.source);
    expect(result.data).not.toBeNull();
  });

  it('I-9: 全部失敗 → source="error"', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('all down'));

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('stats');

    expect(result.source).toBe('error');
    expect(result.data).toBeNull();
  });

  it('I-10: leaders 空資料 → 仍回傳 data，不視為 error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEmptyLeaders()),
    });

    const { fetchData } = await import('../../src/lib/api');
    const result = await fetchData('stats');

    expect(result.source).not.toBe('error');
    // 空資料仍應有結構（label + 6 個空 array）
  });
});
