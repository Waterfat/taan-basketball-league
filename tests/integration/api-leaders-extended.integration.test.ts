/**
 * Integration: src/lib/api.ts 取 leaders 時應保留 11 類個人 + 3 張隊伍表
 *
 * Tag: @api-leaders @issue-14
 * Coverage:
 *   Issue #14 I-2: fetchData('stats') 從靜態 JSON 路徑回傳完整 11 類個人 leader
 *   Issue #14 I-2: fetchData('stats') 同時回傳 offense / defense / net 三張隊伍表
 *
 * 註：當前 api.ts 對 leaders 的 Sheets path 為 stub（SHEETS_RANGES.leaders = []），
 *     資料透過靜態 JSON fallback 提供。本測試驗證 fallback path 能正確保留 11 類 + 3 張表。
 *     'stats' DataKind 與 'leaders' 共用相同資料源（gas/Code.gs handleStats），
 *     URL 為 `data/leaders.json` 或 `data/stats.json`（依 Code.gs 設計，本測試攔截 leaders.json）。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mockExtendedLeaders,
  mockExtendedLeadersWithTeams,
  LEADER_CATEGORIES_ORDERED,
} from '../fixtures/leaders';

const ORIG_FETCH = globalThis.fetch;

describe('api.ts leaders extended (integration)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PUBLIC_SHEET_ID', '');
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', '');
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    vi.unstubAllEnvs();
  });

  // ────── I-2 (a): 11 類個人都保留 ──────
  it('fetchData(stats) 從靜態 JSON 取得 11 類個人 leader（既有 6 類 + 新 5 類）', async () => {
    const fixture = mockExtendedLeaders();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('leaders.json') || u.includes('stats.json')) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type LeadersExtended = typeof fixture;
    const result = await fetchData<LeadersExtended>('stats');

    expect(result.source).toBe('static');
    const season = result.data?.['25'];
    expect(season).toBeTruthy();

    // 既有 6 類
    expect(season?.scoring).toBeDefined();
    expect(season?.rebound).toBeDefined();
    expect(season?.assist).toBeDefined();
    expect(season?.steal).toBeDefined();
    expect(season?.block).toBeDefined();
    expect(season?.eff).toBeDefined();

    // 新 5 類
    expect(season?.turnover).toBeDefined();
    expect(season?.foul).toBeDefined();
    expect(season?.p2pct).toBeDefined();
    expect(season?.p3pct).toBeDefined();
    expect(season?.ftpct).toBeDefined();

    // LEADER_CATEGORIES_ORDERED 順序對齊（既有 6 類在前）
    const categories = LEADER_CATEGORIES_ORDERED;
    expect(categories).toHaveLength(11);
    expect(categories.slice(0, 6)).toEqual(['scoring', 'rebound', 'assist', 'steal', 'block', 'eff']);
    expect(categories.slice(6)).toEqual(['turnover', 'foul', 'p2pct', 'p3pct', 'ftpct']);
  });

  // ────── I-2 (b): 3 張隊伍表都保留 ──────
  it('fetchData(stats) 同時保留 offense / defense / net 三張隊伍表（每張 6 列）', async () => {
    const fixture = mockExtendedLeadersWithTeams();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('leaders.json') || u.includes('stats.json')) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type LeadersExtended = typeof fixture;
    const result = await fetchData<LeadersExtended>('stats');
    const season = result.data?.['25'];

    expect(season?.offense).toBeDefined();
    expect(season?.offense?.headers.length).toBeGreaterThan(0);
    expect(season?.offense?.rows).toHaveLength(6);

    expect(season?.defense).toBeDefined();
    expect(season?.defense?.rows).toHaveLength(6);

    expect(season?.net).toBeDefined();
    expect(season?.net?.rows).toHaveLength(6);
  });

  // ────── 邊界：percentage 類型 val 為數字 ──────
  it('p2pct / p3pct / ftpct 三類 val 為 number（百分比數字，不是 %字串）[qa-v2 補充]', async () => {
    const fixture = mockExtendedLeaders();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('leaders.json') || u.includes('stats.json')) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type LeadersExtended = typeof fixture;
    const result = await fetchData<LeadersExtended>('stats');
    const season = result.data?.['25'];

    for (const cat of ['p2pct', 'p3pct', 'ftpct'] as const) {
      const list = season?.[cat] ?? [];
      expect(list.length).toBeGreaterThan(0);
      for (const entry of list) {
        expect(typeof entry.val).toBe('number');
      }
    }
  });

  // ────── 邊界：缺失新類別不影響既有 6 類 ──────
  it('JSON 只含既有 6 類（無 turnover/foul/p*pct/teams）→ fetch 仍成功且向後相容 [qa-v2 補充]', async () => {
    const minimalFixture = {
      '25': {
        label: '第 25 屆 · 本季個人排行榜',
        scoring: [],
        rebound: [],
        assist: [],
        steal: [],
        block: [],
        eff: [],
      },
    };
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('leaders.json') || u.includes('stats.json')) {
        return new Response(JSON.stringify(minimalFixture), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type LeadersMinimal = typeof minimalFixture;
    const result = await fetchData<LeadersMinimal>('stats');
    const season = result.data?.['25'] as Record<string, unknown> | undefined;

    expect(result.source).toBe('static');
    expect(season?.scoring).toEqual([]);
    expect(season?.turnover).toBeUndefined();
    expect(season?.offense).toBeUndefined();
  });
});
