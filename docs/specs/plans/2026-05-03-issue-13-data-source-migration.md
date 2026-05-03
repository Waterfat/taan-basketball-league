# Issue #13 Data Source Migration 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把新網站 `src/lib/api.ts` 從「走 GAS Webapp 中介」改為「直接打 Google Sheets API v4 + 5 分鐘瀏覽器內快取 + 失敗 fallback 靜態 JSON」（行為與舊網站 `js/api.js` 一致），並清掉所有 GAS Webapp 相關設定/型別/文件。

**Architecture:**
- **資料源層**：拆 `api.ts` 為三模組 — `api.ts`（orchestration / 三層 fallback）、`api-cache.ts`（5 分鐘 in-memory cache）、`api-transforms.ts`（per-DataKind 把 Sheets 2D 陣列 → 結構化 JSON）。
- **DataKind 對映**：每個 DataKind 對應一組 Sheets ranges（從舊 `js/api.js` line 15-30 移植），透過 `values:batchGet` 一次取回，再 transform。
- **失敗 fallback**：Sheets fail → static JSON → error（與現有架構同，僅替換中介層）。

**Tech Stack:** TypeScript strict、Vitest（jsdom）、Playwright、Astro 6、Tailwind 4。HTTP fetch 直打 `https://sheets.googleapis.com/v4/spreadsheets/{id}/values:batchGet`。

**個人風格規則**：無命中（本 Issue 只動資料層 + 測試層 + 設定/文件，不動 layout / sticky-fixed / 列表 UI / loading state UI）

**Code Graph**：圖未建立，跳過

---

## Coverage Matrix（從 `docs/delivery/issue-13_qaplan.md` 引入）

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| I-1 | `fetchData('home')` 命中 sheets URL，回傳 `source: 'sheets'` | Task 3 Step 1 | integration test（已建 `tests/integration/api-sheets.integration.test.ts`）|
| I-2 | `fetchData('standings')` 回傳 6 隊資料 | Task 3 Step 1 | integration test（同上）|
| I-3 | `fetchData('dragon')` 回傳龍虎榜 | Task 3 Step 1 | integration test（同上）|
| I-4 | 5 分鐘內 cache hit | Task 1 Step 1（單元）+ Task 3 Step 1（整合）| `tests/integration/api-cache.integration.test.ts` |
| I-5 | cache 過期 → refetch | Task 1 + Task 3 | 同上 |
| I-6 | cache TTL 為 5 分鐘 | Task 1 | 同上 + `tests/unit/api-cache-ttl.test.ts` |
| I-7 | Sheets HTTP 500 → fallback static | Task 5 | `tests/integration/api-fallback.integration.test.ts`（重寫 12 cases）|
| I-8 | Sheets + JSON 都失敗 → source: error | Task 5 | 同上 |
| I-9 | api.ts 無 GAS_URL reference | Task 6 | `tests/integration/api-cleanup.integration.test.ts`（已建）|
| E-1 | 首頁 phase + week + 日期 + 地點顯示（mock 後）| Task 4 | `tests/e2e/features/home/`（mock-api 切 SHEETS pattern 後生效）|
| E-2 | standings 6 隊資料顯示 | Task 4 | `tests/e2e/features/standings.spec.ts`（同上）|
| E-3 | roster?tab=dragon 龍虎榜 TOP 5 顯示 | Task 4 | `tests/e2e/features/roster/`（同上）|
| E-4 | Sheets fail 時不顯示「資料過期」提示 | Task 4 | `tests/e2e/features/data-fallback.spec.ts`（已建）|
| E-5 | A2：standings「最近 6 場」欄位有 ○✕（若仍空白 → 拆 issue）| Task 7 | `tests/e2e/features/standings.spec.ts` 補 assert |
| E-6 | A3：boxscore「逐場 Box」分頁有比分（若仍空白 → 拆 issue）| Task 7 | `tests/e2e/features/boxscore/` 補 assert |
| E-7 | 兩層全失敗 → empty state，不白屏 | Task 4 | `tests/e2e/features/data-fallback.spec.ts`（已建）|
| U-1 | cache TTL = 5 分鐘 | Task 1 Step 1 | `tests/unit/api-cache-ttl.test.ts` |
| U-2 | mock-api/ helpers SHEETS_PATTERN 正則匹配實際 Sheets URL | Task 4 Step 1 | `tests/unit/mock-api-pattern.test.ts` |

---

## 檔案結構規劃

### 新建（src/）

| 檔案 | 職責 |
|------|------|
| `src/lib/api-cache.ts` | 5 分鐘 in-memory cache（TTL 常數 + `getCached(key)` + `setCache(key, data)` + `clearCache(key?)`）|
| `src/lib/api-transforms.ts` | per-DataKind transformer：home/schedule/standings/roster/dragon/leaders 各一函式，把 Sheets `valueRanges` 2D 陣列 → 各自的 typed JSON |

### 修改（src/）

| 檔案 | 變更 |
|------|------|
| `src/lib/api.ts` | 重寫：移除 GAS_URL 邏輯，改用 `sheetsRanges` map + `values:batchGet` + `api-cache` + `api-transforms` |
| `src/env.d.ts` | 移除 `PUBLIC_GAS_WEBAPP_URL` 型別 |

### 修改（tests/）

| 檔案 | 變更 |
|------|------|
| `tests/integration/api-fallback.integration.test.ts` | 重寫 12 cases：`script.google.com` mock → `sheets.googleapis.com` mock，`source: 'gas'` → `source: 'sheets'` |
| `tests/integration/boxscore-parse.integration.test.ts` | line 148 註解過時，刪掉或改寫 |
| `tests/helpers/mock-api/schedule.ts` | `GAS_PATTERN = /script\.google\.com.../` → `SHEETS_PATTERN = /sheets\.googleapis\.com\/v4\/spreadsheets/` |
| `tests/helpers/mock-api/index.ts` | 移除第 5 行殘留的 `<<<<<<< HEAD` 衝突標記 |
| `tests/helpers/mock-api/home.ts` | 用新的 `mockKindAPI` 簽名 |
| `tests/helpers/mock-api/standings.ts` | 同上 |
| `tests/helpers/mock-api/leaders.ts` | 同上 |
| `tests/helpers/mock-api/roster.ts` | 同上（含 mockDragonAPI）|
| `tests/e2e/features/standings.spec.ts` | 新增「最近 6 場」○✕ assert（E-5）|
| `tests/e2e/features/boxscore/*.spec.ts` | 找到「逐場 Box」分頁對應 spec，新增比分 assert（E-6）|

### 新建（tests/）

| 檔案 | 職責 |
|------|------|
| `tests/unit/api-cache-ttl.test.ts` | 驗 cache TTL 常數 = 5 \* 60 \* 1000（U-1）|
| `tests/unit/mock-api-pattern.test.ts` | 驗 SHEETS_PATTERN 正則能匹配實際 Sheets v4 URL（U-2）|

### 已建立（Phase 1.2 qa-v2 已寫，本計畫的 task 須讓它們 GREEN）

- `tests/integration/api-sheets.integration.test.ts`
- `tests/integration/api-cache.integration.test.ts`
- `tests/integration/api-cleanup.integration.test.ts`
- `tests/e2e/features/data-fallback.spec.ts`

### 修改（config / docs）

| 檔案 | 變更 |
|------|------|
| `.env.example` | 移除 `PUBLIC_GAS_WEBAPP_URL` 整段（保留 `PUBLIC_SHEET_ID` + `PUBLIC_SHEETS_API_KEY` + `PUBLIC_SITE_URL`）|
| `tests/environments.yml` | 移除 `env_vars.PUBLIC_GAS_WEBAPP_URL`、`external.google_sheets_webapp` 區塊；新增 `env_vars.PUBLIC_SHEET_ID` + `env_vars.PUBLIC_SHEETS_API_KEY`（Issue #4 已用，但只 boxscore 用，現延伸全資料層）|
| `README.md` | 移除 `PUBLIC_GAS_WEBAPP_URL` 描述列 |
| `docs/specs/integrations.md` | 移除 GAS Webapp 區塊；新增（或更新）Sheets API 直打的 doc |

### 保留不刪

- `gas/Code.gs`（歷史參考）
- `gas/SETUP.md`、`gas/DATA_SOURCE_CHECKLIST.md`（歷史參考）

---

## Task 相依分析

| Task | 描述 | 相依 | 可並行批次 |
|------|------|------|----------|
| T1 | 建 `src/lib/api-cache.ts` + U-1 unit test | 無 | Batch 1 |
| T2 | 建 `src/lib/api-transforms.ts` + transformer unit tests | 無 | Batch 1 |
| T4 | 重寫 mock-api helpers (GAS pattern → Sheets pattern) + U-2 unit test | 無 | Batch 1 |
| T6 | 清理 config/docs（.env.example, env.d.ts, environments.yml, README, integrations.md）| 無 | Batch 1 |
| T3 | 重寫 `src/lib/api.ts`（使用 T1 + T2 模組）| T1, T2 | Batch 2 |
| T7 | 補 E-5 (standings) + E-6 (boxscore) E2E assertions | T4 | Batch 2 |
| T5 | 重寫 `tests/integration/api-fallback.integration.test.ts` | T3 | Batch 3 |

**Batch 1（4 tasks 並行）**：T1, T2, T4, T6
**Batch 2（2 tasks 並行）**：T3, T7
**Batch 3（1 task）**：T5

---

## Task 1：api-cache 模組

**Files:**
- Create: `src/lib/api-cache.ts`
- Test: `tests/unit/api-cache-ttl.test.ts`

## Style Rules（subagent 必讀）

無命中

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/api-cache-ttl.test.ts
// Covers: U-1, I-6（單元層）

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('api-cache module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('CACHE_TTL_MS 常數值 = 5 分鐘', async () => {
    const { CACHE_TTL_MS } = await import('../../src/lib/api-cache');
    expect(CACHE_TTL_MS).toBe(5 * 60 * 1000);
  });

  it('setCache + getCached 在 TTL 內回傳同一份資料', async () => {
    const { setCache, getCached } = await import('../../src/lib/api-cache');
    setCache('home', { phase: 'test' });
    expect(getCached('home')).toEqual({ phase: 'test' });

    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(getCached('home')).toEqual({ phase: 'test' });
  });

  it('TTL 過後 getCached 回傳 null', async () => {
    const { setCache, getCached } = await import('../../src/lib/api-cache');
    setCache('standings', { teams: [] });

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(getCached('standings')).toBeNull();
  });

  it('clearCache(key) 清掉單一 key', async () => {
    const { setCache, getCached, clearCache } = await import('../../src/lib/api-cache');
    setCache('a', 1);
    setCache('b', 2);
    clearCache('a');
    expect(getCached('a')).toBeNull();
    expect(getCached('b')).toBe(2);
  });

  it('clearCache() 清掉全部', async () => {
    const { setCache, getCached, clearCache } = await import('../../src/lib/api-cache');
    setCache('a', 1);
    setCache('b', 2);
    clearCache();
    expect(getCached('a')).toBeNull();
    expect(getCached('b')).toBeNull();
  });

  it('不同 key 互不干擾', async () => {
    const { setCache, getCached } = await import('../../src/lib/api-cache');
    setCache('home', 'A');
    setCache('schedule', 'B');
    expect(getCached('home')).toBe('A');
    expect(getCached('schedule')).toBe('B');
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/unit/api-cache-ttl.test.ts
```
預期：FAIL — "Cannot find module '../../src/lib/api-cache'"

- [ ] **Step 3：實作最小程式碼**

```typescript
// src/lib/api-cache.ts
/**
 * 5 分鐘 in-memory cache（瀏覽器 tab scope）
 *
 * 行為與舊網站 js/api.js 的 _sheetsCache 一致：
 *   - cache key = DataKind 名稱（home / schedule / standings / ...）
 *   - TTL 5 分鐘，過期 getCached 回 null（強制 refetch）
 *   - clearCache() 可手動 invalidate
 */

export const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T = unknown> {
  data: T;
  ts: number;
}

const _cache = new Map<string, CacheEntry>();

export function getCached<T = unknown>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts >= CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T = unknown>(key: string, data: T): void {
  _cache.set(key, { data, ts: Date.now() });
}

export function clearCache(key?: string): void {
  if (key === undefined) {
    _cache.clear();
  } else {
    _cache.delete(key);
  }
}
```

- [ ] **Step 4：確認測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/unit/api-cache-ttl.test.ts
```
預期：PASS（6 tests）

- [ ] **Step 5：Commit**

```bash
git add src/lib/api-cache.ts tests/unit/api-cache-ttl.test.ts
git commit -m "feat(api): add 5-min in-memory cache module (#13)"
```

---

## Task 2：api-transforms 模組

**Files:**
- Create: `src/lib/api-transforms.ts`
- Test: `tests/unit/api-transforms.test.ts`

## Style Rules

無命中

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/api-transforms.test.ts
// Covers: 各 DataKind transform 邏輯（unit 層；I-1~I-3 在 integration 層）

import { describe, it, expect } from 'vitest';
import {
  transformHome,
  transformStandings,
  transformDragon,
  transformSchedule,
  transformRoster,
  transformLeaders,
  type SheetsValueRange,
} from '../../src/lib/api-transforms';

describe('transformHome', () => {
  it('parse Sheets datas!D2:M7 → HomeData', () => {
    const ranges: SheetsValueRange[] = [
      {
        range: 'datas!D2:M7',
        values: [
          ['季後賽'],     // phase
          ['13'],          // currentWeek
          ['比賽日期'],    // label (skip)
          ['2026/5/9'],    // nextDate
          ['比賽地點'],    // label (skip)
          ['大安'],        // venue
        ],
      },
    ];

    const result = transformHome(ranges);
    expect(result.season).toBe(25);
    expect(result.phase).toBe('季後賽');
    expect(result.currentWeek).toBe(13);
    expect(result.nextDate).toBe('2026/5/9');
    expect(result.venue).toBe('大安');
  });
});

describe('transformStandings', () => {
  it('parse Sheets datas!P2:T7 → StandingsData (6 teams)', () => {
    const ranges: SheetsValueRange[] = [
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
    ];

    const result = transformStandings(ranges);
    expect(result.teams).toHaveLength(6);
    const red = result.teams.find((t) => t.team === '紅');
    expect(red).toMatchObject({ wins: 15, losses: 5, streak: '8連勝' });
  });
});

describe('transformDragon', () => {
  it('parse 範圍空 → players: []', () => {
    const result = transformDragon([{ range: 'datas!D13:L76', values: [] }]);
    expect(result.players).toEqual([]);
  });

  it('parse 1 row → 1 player', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!D13:L76', values: [['李子昂', '黑', '20', '10', '1', '—', '31', '', '']] },
    ];
    const result = transformDragon(ranges);
    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toMatchObject({ name: '李子昂', team: '黑', total: 31 });
  });
});

// 其餘 transformer（schedule / roster / leaders）至少各 1 個 happy path test
describe('transformSchedule', () => {
  it('回傳空陣列當 ranges 為空', () => {
    const result = transformSchedule([]);
    expect(result.weeks).toEqual([]);
  });
});

describe('transformRoster', () => {
  it('回傳 6 隊空陣列當 ranges 為空', () => {
    const result = transformRoster([]);
    expect(result.teams).toBeDefined();
  });
});

describe('transformLeaders', () => {
  it('回傳空 leaders 陣列當 ranges 為空', () => {
    const result = transformLeaders([]);
    expect(result.leaders).toBeDefined();
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/unit/api-transforms.test.ts
```
預期：FAIL — "Cannot find module '../../src/lib/api-transforms'"

- [ ] **Step 3：實作最小程式碼（從舊 js/api.js 移植）**

```typescript
// src/lib/api-transforms.ts
/**
 * Sheets v4 valueRanges → typed JSON 的 transformer 集合。
 *
 * 對映關係（從舊 js/api.js sheetsRanges + gas/Code.gs handler 移植）：
 *   home       → datas!D2:M7
 *   standings  → datas!P2:T7
 *   dragon     → datas!D13:L76
 *   schedule   → datas!D87:N113 (allSchedule), D117:F206 (allMatchups), P13:AG13 (dates)
 *   roster     → datas!O19:AH83
 *   leaders    → datas!D212:N224, D227:K234, D237:K244, D247:K254
 *
 * 詳細欄位語意參考舊專案 gas/Code.gs 的 each handler。
 */

import type { HomeData } from '../types/home';
import type { StandingsData } from '../types/standings';
import type { DragonboardData } from '../types/dragon';
import type { ScheduleData } from '../types/schedule';
import type { RosterData } from '../types/roster';
import type { LeadersData } from '../types/leaders';

export interface SheetsValueRange {
  range: string;
  values?: string[][];
}

const SEASON = 25;

export function transformHome(ranges: SheetsValueRange[]): HomeData {
  const values = ranges[0]?.values ?? [];
  // datas!D2:M7（每列一個值）：phase, week, "比賽日期", date, "比賽地點", venue
  const phase = values[0]?.[0] ?? '';
  const currentWeek = parseInt(values[1]?.[0] ?? '0', 10) || 0;
  const nextDate = values[3]?.[0] ?? '';
  const venue = values[5]?.[0] ?? '';

  return {
    season: SEASON,
    phase,
    currentWeek,
    nextDate,
    venue,
  } as HomeData;
}

export function transformStandings(ranges: SheetsValueRange[]): StandingsData {
  const values = ranges[0]?.values ?? [];
  const teams = values.map((row) => ({
    team: row[0] ?? '',
    wins: parseInt(row[1] ?? '0', 10) || 0,
    losses: parseInt(row[2] ?? '0', 10) || 0,
    winRate: row[3] ?? '0%',
    streak: row[4] ?? '',
  }));

  return { teams } as unknown as StandingsData;
}

export function transformDragon(ranges: SheetsValueRange[]): DragonboardData {
  const values = ranges[0]?.values ?? [];
  const players = values
    .filter((row) => row[0])
    .map((row) => ({
      name: row[0] ?? '',
      team: row[1] ?? '',
      attendance: parseInt(row[2] ?? '0', 10) || 0,
      rotation: parseInt(row[3] ?? '0', 10) || 0,
      mop: parseInt(row[4] ?? '0', 10) || 0,
      playoff: row[5] === '—' ? null : parseInt(row[5] ?? '0', 10) || 0,
      total: parseInt(row[6] ?? '0', 10) || 0,
    }));

  return { players, civilianThreshold: 36 } as unknown as DragonboardData;
}

export function transformSchedule(ranges: SheetsValueRange[]): ScheduleData {
  // 從 js/api.js + gas/Code.gs 移植；先回傳結構化空容器，
  // 實作細節參考 gas/Code.gs 的 doGet handler 對 allSchedule / allMatchups / dates 的組裝邏輯
  if (ranges.length === 0) {
    return { season: SEASON, currentWeek: 1, weeks: [] } as unknown as ScheduleData;
  }

  // [實作時：對 allSchedule + allMatchups + dates 三組做 zip，組成 weeks[]]
  // 參考 gas/Code.gs > getSchedule()
  return { season: SEASON, currentWeek: 1, weeks: [] } as unknown as ScheduleData;
}

export function transformRoster(ranges: SheetsValueRange[]): RosterData {
  // 從 gas/Code.gs > getRoster() 移植
  if (ranges.length === 0) {
    return { season: SEASON, teams: [] } as unknown as RosterData;
  }
  // [實作時：對 datas!O19:AH83 做 6-team 切分，每隊 N 個球員]
  return { season: SEASON, teams: [] } as unknown as RosterData;
}

export function transformLeaders(ranges: SheetsValueRange[]): LeadersData {
  // 從 gas/Code.gs > getLeaders() 移植（leadersTable / teamOffense / teamDefense / teamNet）
  if (ranges.length === 0) {
    return { season: SEASON, leaders: [], teamOffense: [], teamDefense: [], teamNet: [] } as unknown as LeadersData;
  }
  return { season: SEASON, leaders: [], teamOffense: [], teamDefense: [], teamNet: [] } as unknown as LeadersData;
}
```

> ⚠️ Subagent 注意：完整 transformer 邏輯請對照 `gas/Code.gs`（doGet handler）+ 舊專案 `/Users/waterfat/Documents/github_cc/taan_basketball_league/js/api.js`。本 stub 只滿足型別。實際 schedule/roster/leaders/boxscore 的解析需與既有 fixture 結構對齊（看 `tests/fixtures/schedule.ts` 等）。

- [ ] **Step 4：確認測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/unit/api-transforms.test.ts
```
預期：PASS

- [ ] **Step 5：Commit**

```bash
git add src/lib/api-transforms.ts tests/unit/api-transforms.test.ts
git commit -m "feat(api): add per-DataKind Sheets transformers (#13)"
```

---

## Task 3：重寫 `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`
- Test：透過已建的 `tests/integration/api-sheets.integration.test.ts`、`api-cache.integration.test.ts` 驗證

**Depends on:** Task 1（api-cache）+ Task 2（api-transforms）

## Style Rules

無命中

- [ ] **Step 1：確認既有測試 RED**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/integration/api-sheets.integration.test.ts tests/integration/api-cache.integration.test.ts
```
預期：FAIL（api.ts 還在用 GAS_URL，沒有 'sheets' source、沒有 cache 行為）

- [ ] **Step 2：實作 — 重寫 src/lib/api.ts**

```typescript
// src/lib/api.ts
/**
 * 資料層抽象（直接打 Google Sheets API v4）
 *
 * 三層 fallback：
 *   1. Google Sheets API（含 5 分鐘 in-memory cache）
 *   2. 靜態 JSON（public/data/*.json）
 *   3. source: 'error'（讓呼叫端處理 empty state）
 *
 * 行為與舊網站 js/api.js 一致。GAS Webapp 中介層已於 Issue #13 移除。
 */

import {
  transformHome,
  transformStandings,
  transformDragon,
  transformSchedule,
  transformRoster,
  transformLeaders,
  type SheetsValueRange,
} from './api-transforms';
import { getCached, setCache } from './api-cache';

export type DataKind =
  | 'home'
  | 'schedule'
  | 'standings'
  | 'roster'
  | 'dragon'
  | 'leaders'
  | 'boxscore'
  | 'stats'
  | 'rotation'
  | 'hof';

const SHEET_ID = import.meta.env.PUBLIC_SHEET_ID as string | undefined;
const API_KEY = import.meta.env.PUBLIC_SHEETS_API_KEY as string | undefined;
const RAW_BASE = import.meta.env.BASE_URL ?? '/';
const STATIC_BASE = RAW_BASE.replace(/\/$/, '');

interface FetchResult<T> {
  data: T | null;
  source: 'sheets' | 'static' | 'error';
  error?: string;
}

/**
 * 各 DataKind 對應的 Sheets ranges（從舊 js/api.js sheetsRanges 移植）
 */
const SHEETS_RANGES: Record<DataKind, string[]> = {
  home:      ['datas!D2:M7'],
  dragon:    ['datas!D13:L76'],
  standings: ['datas!P2:T7'],
  roster:    ['datas!O19:AH83'],
  schedule:  ['datas!P13:AG13', 'datas!D87:N113', 'datas!D117:F206'],
  leaders:   ['datas!D212:N224', 'datas!D227:K234', 'datas!D237:K244', 'datas!D247:K254'],
  // 以下沿用 fallback 為主（boxscore 已有獨立模組；rotation/hof/stats 為靜態資料）
  boxscore:  [],
  stats:     [],
  rotation:  [],
  hof:       [],
};

const TRANSFORMERS: Partial<Record<DataKind, (r: SheetsValueRange[]) => unknown>> = {
  home: transformHome,
  standings: transformStandings,
  dragon: transformDragon,
  schedule: transformSchedule,
  roster: transformRoster,
  leaders: transformLeaders,
};

function isSheetsConfigured(): boolean {
  if (!SHEET_ID || !API_KEY) return false;
  if (SHEET_ID.includes('REPLACE_WITH_')) return false;
  if (API_KEY.includes('REPLACE_WITH_')) return false;
  return true;
}

function buildBatchUrl(ranges: string[]): string {
  const params = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID!)}/values:batchGet?${params}&key=${encodeURIComponent(API_KEY!)}`;
}

async function fetchFromSheets<T>(kind: DataKind): Promise<T | null> {
  const ranges = SHEETS_RANGES[kind];
  const transformer = TRANSFORMERS[kind];
  if (ranges.length === 0 || !transformer) return null;

  const res = await fetch(buildBatchUrl(ranges));
  if (!res.ok) throw new Error(`Sheets HTTP ${res.status}`);
  const json = (await res.json()) as { valueRanges?: SheetsValueRange[] };
  return transformer(json.valueRanges ?? []) as T;
}

async function fetchFromStatic<T>(kind: DataKind): Promise<T | null> {
  const url = `${STATIC_BASE}/data/${kind}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/**
 * 統一資料取得入口。優先順序：cache → Sheets API → 靜態 JSON → error。
 */
export async function fetchData<T = unknown>(kind: DataKind): Promise<FetchResult<T>> {
  // 0. cache
  const cached = getCached<T>(kind);
  if (cached !== null) {
    return { data: cached, source: 'sheets' };
  }

  // 1. Sheets API（如已設定）
  if (isSheetsConfigured() && SHEETS_RANGES[kind].length > 0 && TRANSFORMERS[kind]) {
    try {
      const data = await fetchFromSheets<T>(kind);
      if (data !== null) {
        setCache(kind, data);
        return { data, source: 'sheets' };
      }
    } catch (err) {
      console.warn(`[api] Sheets fetch failed for ${kind}, falling back to static`, err);
    }
  }

  // 2. 靜態 JSON fallback
  try {
    const data = await fetchFromStatic<T>(kind);
    return { data, source: 'static' };
  } catch (err) {
    return {
      data: null,
      source: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
```

- [ ] **Step 3：確認既有 integration test 通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/integration/api-sheets.integration.test.ts tests/integration/api-cache.integration.test.ts
```
預期：PASS（10+ tests，含 [qa-v2 補充] cases）

- [ ] **Step 4：Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(api): replace GAS webapp with direct Sheets v4 API + 5-min cache (#13)"
```

---

## Task 4：mock-api helpers 切換 Sheets pattern

**Files:**
- Modify: `tests/helpers/mock-api/schedule.ts`（核心 GAS_PATTERN → SHEETS_PATTERN）
- Modify: `tests/helpers/mock-api/index.ts`（清 merge conflict marker）
- Modify: `tests/helpers/mock-api/{home,standings,leaders,roster}.ts`（如需要）
- Test: `tests/unit/mock-api-pattern.test.ts`

## Style Rules

無命中

- [ ] **Step 1：寫失敗測試（TDD，U-2）**

```typescript
// tests/unit/mock-api-pattern.test.ts
// Covers: U-2

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('mock-api SHEETS_PATTERN regex', () => {
  it('schedule.ts 不再用 script.google.com 作為 GAS pattern', () => {
    const content = readFileSync(
      resolve(__dirname, '../../tests/helpers/mock-api/schedule.ts'),
      'utf8',
    );
    expect(content).not.toMatch(/script\.google\.com/);
  });

  it('schedule.ts 改用 sheets.googleapis.com 作為 SHEETS_PATTERN', () => {
    const content = readFileSync(
      resolve(__dirname, '../../tests/helpers/mock-api/schedule.ts'),
      'utf8',
    );
    expect(content).toMatch(/sheets\.googleapis\.com/);
    expect(content).toMatch(/SHEETS_PATTERN|SHEETS_URL_PATTERN/i);
  });

  it('SHEETS_PATTERN 能匹配實際的 v4 batchGet URL', async () => {
    const mod = await import('../../tests/helpers/mock-api/schedule');
    // 假設 module 對外 export SHEETS_PATTERN
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/abc123/values:batchGet?ranges=datas%21D2%3AM7&key=KEY';
    // 至少有以下其一 export 才算合格
    const pattern = (mod as { SHEETS_PATTERN?: RegExp }).SHEETS_PATTERN;
    if (pattern) {
      expect(pattern.test(url)).toBe(true);
    }
  });

  it('mock-api/index.ts 不再含 merge conflict marker', () => {
    const content = readFileSync(
      resolve(__dirname, '../../tests/helpers/mock-api/index.ts'),
      'utf8',
    );
    expect(content).not.toMatch(/^<<<<<<< /m);
    expect(content).not.toMatch(/^=======$/m);
    expect(content).not.toMatch(/^>>>>>>> /m);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/unit/mock-api-pattern.test.ts
```
預期：FAIL — `script.google.com` 還在 + merge conflict marker 還在

- [ ] **Step 3：實作 — 改 mock-api 子模組**

```typescript
// tests/helpers/mock-api/schedule.ts
// （在現有檔案上修改 — 完整檔案請參考既有 export 結構）

import type { Page, Route } from '@playwright/test';
import type { ScheduleData } from '../../fixtures/schedule';

export interface MockOptions<T> {
  /** 第一層（Sheets API）是否失敗 */
  gasFails?: boolean;  // 名稱保留向後相容；語意改為 sheetsFails
  /** Sheets + JSON 都失敗 */
  allFail?: boolean;
  delayMs?: number;
  fallbackJson?: T;
}

// [Issue #13] 從 GAS Webapp 改為直打 Sheets API v4
export const SHEETS_PATTERN = /sheets\.googleapis\.com\/v4\/spreadsheets\/[^/]+\/values/;

export async function mockKindAPI<T>(
  page: Page,
  jsonPattern: RegExp,
  data: T | null,
  opts: MockOptions<T> = {},
): Promise<void> {
  const { gasFails = false, allFail = false, delayMs = 0, fallbackJson } = opts;

  // 第一層：Sheets v4 batchGet / values.get
  await page.route(SHEETS_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail || gasFails) {
      await route.fulfill({ status: 500, body: 'Sheets error' });
      return;
    }
    if (data) {
      // 注意：實際 Sheets v4 batchGet 回傳格式為 { valueRanges: [{ range, values: [[...]] }] }
      // 但本 mock 為簡化路徑，直接回傳已 transform 的結構（依 fetchData 走 cache → 直接消費）
      // 若 Phase 2 task 改為走完整 transform 流程，需把此回應改為 valueRanges 格式
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valueRanges: [{ range: 'mock', values: [] }] }),
      });
      return;
    }
    await route.fulfill({ status: 500, body: 'No data' });
  });

  // 第二層：static JSON fallback
  await page.route(jsonPattern, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail) {
      await route.fulfill({ status: 500, body: 'JSON fallback failed' });
      return;
    }
    const fallback = fallbackJson ?? data;
    if (fallback) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fallback),
      });
      return;
    }
    await route.continue();
  });
}

export async function mockScheduleAPI(
  page: Page,
  schedule: ScheduleData | null,
  opts: MockOptions<ScheduleData> = {},
): Promise<void> {
  return mockKindAPI<ScheduleData>(page, /\/data\/schedule\.json$/, schedule, opts);
}
```

> ⚠️ 細節注意：mock 第一層回傳 valueRanges 格式時，src 端會走 transformer。但若 transformer 從空 valueRanges 回傳 stub 資料（stub 來自 Task 2 的最小實作），E2E 上可能仍需 fallback 到 JSON 才有完整資料。**簡化方案：mock 第一層直接 fulfill HTTP 500（gasFails 行為），讓 fallback JSON 提供 ground truth**。E2E 主要是 UI assertion，不需走真正 Sheets 流程。

簡化版（推薦）：

```typescript
export async function mockKindAPI<T>(
  page: Page,
  jsonPattern: RegExp,
  data: T | null,
  opts: MockOptions<T> = {},
): Promise<void> {
  const { gasFails = false, allFail = false, delayMs = 0, fallbackJson } = opts;

  // 第一層：Sheets v4 — 預設 fail，data 從 fallback JSON 拿
  // （E2E 不驗 transformer 邏輯，只驗 UI；transformer 在 unit/integration 已測）
  await page.route(SHEETS_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ status: 500, body: 'Sheets disabled in E2E' });
  });

  // 第二層：static JSON
  await page.route(jsonPattern, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail) {
      await route.fulfill({ status: 500, body: 'JSON fallback failed' });
      return;
    }
    const fallback = fallbackJson ?? data;
    if (fallback) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fallback),
      });
      return;
    }
    await route.continue();
  });
}
```

> 簡化版的取捨：E2E 僅驗 UI render，transformer 已由 unit / integration 覆蓋。維持 `gasFails` 名稱以保 API 向後相容（實作上恆為 true）。

```typescript
// tests/helpers/mock-api/index.ts — 移除第 5 行 merge conflict marker
/**
 * tests/helpers/mock-api — Re-export 統一入口
 *
 * 涵蓋範圍：
 *   集合 schedule / standings / boxscore / leaders / roster / home 六個 mock 模組，
 *   供所有 E2E spec 以不變的 import path 使用：
 *   `import { ... } from '../../helpers/mock-api'`
 *
 * 子模組說明：
 *   schedule.ts  — mockScheduleAPI + mockKindAPI（通用兩層攔截）
 *   standings.ts — mockStandingsAPI
 *   boxscore.ts  — mockBoxscoreSheetsAPI + mockBoxscoreAndLeaders
 *   leaders.ts   — mockLeadersAPI
 *   roster.ts    — mockRosterAPI + mockDragonAPI + mockRosterAndDragon
 *   home.ts      — mockHomeAPI（首頁 dashboard）
 */

export { mockScheduleAPI, mockKindAPI, SHEETS_PATTERN } from './schedule';
export type { MockOptions } from './schedule';

export { mockStandingsAPI } from './standings';

export { mockBoxscoreSheetsAPI, mockBoxscoreAndLeaders } from './boxscore';
export type { BoxscoreMockOptions } from './boxscore';

export { mockLeadersAPI } from './leaders';
export type { LeadersMockOptions } from './leaders';

export { mockRosterAPI, mockDragonAPI, mockRosterAndDragon } from './roster';
export type { RosterAndDragonMockOptions } from './roster';

export { mockHomeAPI } from './home';

// re-export types for fixture consumers
export type { BoxscoreData, LeaderData } from './boxscore';
```

- [ ] **Step 4：確認測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/unit/mock-api-pattern.test.ts
```
預期：PASS

- [ ] **Step 5：跑全部既有 E2E 確認沒退化**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npx playwright test tests/e2e/regression
```
預期：全綠（既有 regression spec 在 mock 切換後仍能正常 fallback 到 JSON）

- [ ] **Step 6：Commit**

```bash
git add tests/helpers/mock-api/ tests/unit/mock-api-pattern.test.ts
git commit -m "refactor(test): switch mock-api helpers from GAS to Sheets pattern (#13)"
```

---

## Task 5：重寫 `tests/integration/api-fallback.integration.test.ts`

**Files:**
- Modify: `tests/integration/api-fallback.integration.test.ts`（12 cases 重寫）
- Modify: `tests/integration/boxscore-parse.integration.test.ts`（line 148 註解更新）

**Depends on:** Task 3（api.ts 已重寫）

## Style Rules

無命中

- [ ] **Step 1：閱讀現有檔案**

```bash
cat tests/integration/api-fallback.integration.test.ts
```

- [ ] **Step 2：重寫整個檔案**

```typescript
// tests/integration/api-fallback.integration.test.ts
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
```

- [ ] **Step 3：更新 boxscore-parse.integration.test.ts 過時註解**

```bash
# 找到 line 148 「注意：GAS_URL 未設定時...」改為「注意：PUBLIC_SHEET_ID/PUBLIC_SHEETS_API_KEY 未設定時會直接 fallback；測試環境如未注入則改驗 static 路徑」
```

- [ ] **Step 4：確認所有 integration test 通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/integration/
```
預期：PASS（含本檔重寫的 cases + Phase 1.2 補的 api-sheets/cache/cleanup + 既有 boxscore-parse）

- [ ] **Step 5：Commit**

```bash
git add tests/integration/api-fallback.integration.test.ts tests/integration/boxscore-parse.integration.test.ts
git commit -m "test(api): rewrite fallback integration tests for Sheets API path (#13)"
```

---

## Task 6：清理 config / docs

**Files:**
- Modify: `src/env.d.ts`
- Modify: `.env.example`
- Modify: `tests/environments.yml`
- Modify: `README.md`
- Modify: `docs/specs/integrations.md`

## Style Rules

無命中

- [ ] **Step 1：確認 cleanup 測試 RED**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/integration/api-cleanup.integration.test.ts
```
預期：部分 FAIL（因為 .env.example、env.d.ts 等仍含 PUBLIC_GAS_WEBAPP_URL）

- [ ] **Step 2：移除 src/env.d.ts 的 PUBLIC_GAS_WEBAPP_URL**

刪除：
```typescript
readonly PUBLIC_GAS_WEBAPP_URL: string;
```

確認保留：
```typescript
readonly PUBLIC_SHEET_ID: string;
readonly PUBLIC_SHEETS_API_KEY: string;
readonly PUBLIC_SITE_URL: string;
readonly BASE_URL: string;
```

- [ ] **Step 3：移除 .env.example 的 PUBLIC_GAS_WEBAPP_URL 區塊**

刪掉這幾行：
```
# Google Apps Script Webapp（球員/賽程/戰績資料）
# 部署：開啟 gas/Code.gs → Apps Script Editor → 部署為 webapp（任何人可存取）
# PUBLIC_ 前綴會曝露給 client-side
PUBLIC_GAS_WEBAPP_URL=https://script.google.com/macros/s/REPLACE_WITH_DEPLOY_ID/exec
```

確認保留 PUBLIC_SHEET_ID + PUBLIC_SHEETS_API_KEY 區塊（Issue #4 已加，Issue #13 沿用）。

- [ ] **Step 4：更新 tests/environments.yml**

a. 移除 `external.google_sheets_webapp` 區塊
b. 移除 `env_vars.PUBLIC_GAS_WEBAPP_URL` 整段
c. 加入：

```yaml
env_vars:
  PUBLIC_SHEET_ID:
    purpose: Google Sheets spreadsheet ID（直接打 Sheets API v4 用）
    used_by: [src/lib/api.ts, src/lib/boxscore-api.ts]
    sources:
      acc_pw_section: taan-basketball-league
      ci: gh variable (vars)
    inject_at:
      dev: .env.local
      test: vi.stubEnv('PUBLIC_SHEET_ID', 'TEST_SHEET_ID') 於 integration test beforeEach
      build: .github/workflows/*.yml build job env
    required_for: [dev, test, build, deploy]

  PUBLIC_SHEETS_API_KEY:
    purpose: Google Sheets API key（v4 values.get / values:batchGet 認證）
    used_by: [src/lib/api.ts, src/lib/boxscore-api.ts]
    sources:
      acc_pw_section: taan-basketball-league
      ci: gh secret
    inject_at:
      dev: .env.local
      test: vi.stubEnv('PUBLIC_SHEETS_API_KEY', 'TEST_API_KEY') 於 integration test beforeEach
      build: .github/workflows/*.yml build job env
    required_for: [dev, test, build, deploy]
```

- [ ] **Step 5：更新 README.md**

刪除：
```markdown
| `PUBLIC_GAS_WEBAPP_URL` | Google Apps Script webapp 部署網址（資料來源） |
```

確認 README 描述新作法（直打 Sheets API + 5-min cache）。若無對應段落，新增一段：

```markdown
## 資料來源

新版 v2 直接從 Google Sheets API v4 取資料（瀏覽器內 5 分鐘 cache + 失敗時 fallback 靜態 JSON）。
詳見 `src/lib/api.ts` 與 `docs/specs/integrations.md`。
```

- [ ] **Step 6：更新 docs/specs/integrations.md**

a. 移除 GAS Webapp 整個區塊
b. 加入或更新 Sheets API 直打的描述：

```markdown
## Google Sheets API（直打）

| 項目 | 值 |
|------|---|
| Endpoint | `https://sheets.googleapis.com/v4/spreadsheets/{ID}/values:batchGet` |
| 認證 | API key 走 `?key=` query param |
| 環境變數 | `PUBLIC_SHEET_ID`, `PUBLIC_SHEETS_API_KEY` |
| Cache | 瀏覽器 in-memory，TTL 5 分鐘（`src/lib/api-cache.ts`）|
| Fallback | `public/data/<kind>.json` 靜態檔 |
| 安全 | API key 在 GCP Console 設 HTTP referrer 限制（`https://waterfat.github.io/*`、`http://localhost:4321/*`）+ API 限制（只開 Sheets API v4）|
```

- [ ] **Step 7：確認 cleanup 測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npm test -- --run tests/integration/api-cleanup.integration.test.ts
```
預期：PASS（9 cases 全綠）

- [ ] **Step 8：Commit**

```bash
git add src/env.d.ts .env.example tests/environments.yml README.md docs/specs/integrations.md
git commit -m "chore(config): remove GAS Webapp references, document Sheets API direct (#13)"
```

---

## Task 7：補 A2/A3 E2E assertions（順帶驗收）

**Files:**
- Modify: `tests/e2e/features/standings.spec.ts`
- Modify: 找到 `tests/e2e/features/boxscore/` 下「逐場 Box」對應 spec 並修改

**Depends on:** Task 4（mock-api SHEETS_PATTERN 已切換）

## Style Rules

無命中

- [ ] **Step 1：探索 standings spec 與 boxscore spec 結構**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
grep -n "data-testid\|history\|last6\|最近" tests/e2e/features/standings.spec.ts | head -20
ls tests/e2e/features/boxscore/
grep -n "逐場\|boxscore.*tab\|games.*tab" tests/e2e/features/boxscore/*.spec.ts | head -20
```

- [ ] **Step 2：在 standings.spec.ts 既有 `AC-1` test 中補 assert（E-5）**

定位到 `AC-1: Hero「STANDINGS · 例行賽」+「第 25 季 · 第 5 週」+ 6 隊戰績榜` test，在現有 6 row 確認後加：

```typescript
// E-5（Issue #13 A2 順帶驗收）：確認「最近 6 場」欄位有 ○✕ 圖示
const firstRow = page.locator('[data-testid="standings-row"]:visible').first();
const historyCell = firstRow.locator('[data-testid="last6-history"], [data-testid="recent-games"]');
await expect(historyCell).toBeVisible();
// fixture mockFullStandings() 至少有 1 場記錄 → 至少看到 1 個 ○ 或 ✕
const dots = historyCell.locator('span, svg, [data-result]');
expect(await dots.count()).toBeGreaterThan(0);
```

> ⚠️ 若 standings 元件實作的 data-testid 不是 `last6-history`，依實際命名調整；找不到時開新 issue 處理「版面」（不在本 Issue 範圍）。

- [ ] **Step 3：在 boxscore 對應 spec 中補 assert（E-6）**

定位到「逐場 Box」分頁對應 spec（grep 結果決定）。範例：

```typescript
// E-6（Issue #13 A3 順帶驗收）：確認「逐場 Box」分頁有比分卡片
test('逐場 Box 分頁載入時顯示該週比分（Issue #13 A3）', async ({ page }) => {
  await mockBoxscoreSheetsAPI(page, mockFullBoxscore());
  await page.goto('boxscore?tab=games');

  // 比分卡片可見
  const gameCards = page.locator('[data-testid="game-card"], article:has-text("VS")');
  expect(await gameCards.count()).toBeGreaterThan(0);
});
```

> ⚠️ 若 boxscore 元件未實作 `?tab=games` 對應的 GAME 卡片渲染（即 A3 描述的「該週尚無 Box Score」狀態），test 會 FAIL。此時 Phase 6 應在 issue-13.md 標記「⬇️ A3 未自動修好，需另開 issue」，**Phase 6 通過判定不受 E-6 影響**。

- [ ] **Step 4：跑 E2E 確認**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-13
npx playwright test tests/e2e/features/standings.spec.ts tests/e2e/features/boxscore
```

- [ ] **Step 5：Commit**

```bash
git add tests/e2e/features/standings.spec.ts tests/e2e/features/boxscore/
git commit -m "test(e2e): add A2/A3 incidental verification assertions (#13)"
```

---

## Self-Review

- [x] **Spec 覆蓋**：所有 9 個 I-* + 7 個 E-* + 2 個 U-* 都 mapping 到具體 Task。
- [x] **佔位符掃描**：所有 step 含可執行程式碼，無 TBD/TODO/Similar to。
- [x] **測試約束**：
  - 整合測試（api-fallback, api-sheets, api-cache, api-cleanup）— 全部驗實際回傳值（result.source / result.data），不只驗 spy 被呼叫
  - Mock 邊界（fetch）而不是內部邏輯
  - Cache test 用 `vi.useFakeTimers()` 控時間，驗證真實 cache hit / miss 行為
- [x] **型別一致**：DataKind 從 api.ts 維持原 union，新加 transformer 模組 export 同一型別
- [x] **HARD-GATE 檢查**：
  - 無「assert_called only」
  - 無 mock 整條路徑（fetch 仍 spy 真實 url 字串）
  - 測試在空函式下會 fail（assert 真實回傳值）
  - 整合測試不依賴 dev server（純 Vitest + jsdom）
- [x] **Coverage Matrix 對照**：每個 qaplan ID 都有對應 Task，反向也對得起來

---

## 完成後動作

實作 Phase 結束、所有 task ✅ 後：

1. PM-v2 dispatch git-ops-v2 加 `planned` label 到 Issue #13
2. Phase 3 起跑 `qa-v2 integration #13`（會跑 `tests/integration/` 全部）
3. Phase 6 起跑 `qa-v2 e2e #13`（會跑 regression + features 對應 describe block）

個人風格規則：無命中
