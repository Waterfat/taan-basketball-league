# Issue #17 [L] fix：新網站資料同步 — transformer 補完 + 龍虎榜分組修正 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 補完 6 個 Sheets transformer（home / standings / dragon / schedule / roster / leaders）、把 `civilianThreshold` 改成從 Sheets 取真實值（修正「前 36 名」與實際分組不一致）、把 `api.ts` 的 Sheets 失敗 fallback 改為直接 `source: 'error'`（不假裝成功）、清理 16 個 e2e spec 的 mock pattern 與 `dragon.json` 重複鍵。

**Architecture:** 純資料層（lib/）改寫，不動 Astro 頁面或 island 結構。`SHEETS_RANGES` 由「2 kind」擴成「6 kind 全啟用」，每個 transformer 補出 typed JSON 對應頁面所需 shape。`fetchData` 行為改變：偵測到 Sheets 配置正確（非 placeholder）時，Sheets 失敗 → 直接回 `source: 'error'`，不再自動 fallback static JSON（保留 placeholder/未設定情境的合法 fallback）。元件層只動 DragonTabPanel 的 group title 文案（threshold 顯示改為實際 N）。

**Tech Stack:** Astro 6 / TypeScript strict / Vitest（unit + integration）/ Google Sheets API v4 batchGet。

**個人風格規則**：命中 1 條 — style-skeleton-loading（trigger：本 Issue 修改 `src/lib/api.ts` 的 fetch 路徑，影響 fetch / 載入回饋鏈路）

**Code Graph**：圖未建立，跳過（手動偵察已執行：`src/lib/api-transforms.ts` + `api.ts` 為主要根因，Phase 2 各 task 觸及的元件邊界已在 Step 2 列出）

---

## Coverage Matrix（從 docs/delivery/issue-17_qaplan.md 沿用）

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| I-1 | transformStandings 含 matrix + season/phase/currentWeek | Task 1 Step 1 | unit (api-transforms.test.ts) + integration (api-standings-matrix.integration.test.ts 擴充 Sheets path) |
| I-2 | transformDragon 含 season/phase + civilianThreshold 從 Sheets | Task 2 Step 1 | unit (api-transforms.test.ts) |
| I-3 | transformRoster 完整 6 隊切分 + season/phase | Task 3 Step 1 | unit (api-transforms.test.ts) |
| I-4 | transformHome 完整 composite shape（含 standings / dragonTop10 / miniStats） | Task 4 Step 1 | unit (api-transforms.test.ts) + integration (api-sheets.integration.test.ts 擴充 home assertion) |
| I-5 | transformSchedule 完整 zip → weeks[] | Task 5 Step 1 | unit (api-transforms.test.ts) |
| I-6 | transformLeaders 完整 4-block 解析 | Task 6 Step 1 | unit (api-transforms.test.ts) + integration (api-leaders-extended.integration.test.ts 擴充 Sheets path) |
| I-7 | AC-E1：Sheets 失敗 → source: 'error' (不 fallback static) | Task 7 Step 1 | integration (api-no-fallback.integration.test.ts 已預先補寫，3/8 RED → Task 7 後全 GREEN) + 既有 api-fallback.integration.test.ts 標 @deprecated |
| U-1 | DragonTabPanel 分組演算法（civilians.length === N） | Task 2 Step 2 | unit (dragon-components.test.ts 擴充) |
| U-2 | home-utils 從 composite shape 提取 miniStandings 排序 | Task 4 Step 2 | unit (home-utils.test.ts 擴充) |
| U-3 | ErrorState + EmptyState 跨模組渲染（home/schedule/roster；standings 既有） | （已預先補寫 tests/unit/error-empty-states.test.ts，6/6 GREEN）| — |
| E-1 | standings 頁面顯示 6 隊 + 矩陣 + hero 真實 season | Task 8 e2e cleanup | tests/e2e/features/standings/standings-data.spec.ts (改寫 standings.spec.ts) |
| E-2 | dragon hero 賽季數字 | Task 8 e2e cleanup | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-3 | 龍虎榜分組與 threshold 一致 | Task 8 e2e cleanup | tests/e2e/features/roster/dragon-tab-grouping.spec.ts |
| E-4 | roster hero 賽季 + phase | Task 8 e2e cleanup | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-5 | home hero 真實 currentWeek + phase | Task 8 e2e cleanup | tests/e2e/features/home/home-hero-schedule.spec.ts |
| E-6a | home miniStandings 真實戰績 | Task 8 e2e cleanup | tests/e2e/features/home/home-standings.spec.ts |
| E-6b | home miniLeaders + miniDragon 真實資料 | Task 8 e2e cleanup | tests/e2e/features/home/home-leaders-dragon.spec.ts |
| E-6c | home matchups 真實當週 | Task 8 e2e cleanup | tests/e2e/features/home/home-matchups.spec.ts |
| E-7 | schedule weeks 真實對戰 | Task 8 e2e cleanup | tests/e2e/features/schedule/schedule-data.spec.ts (改寫 schedule.spec.ts) |
| E-8a | leaders 個人類別真實資料 | Task 8 e2e cleanup | tests/e2e/features/boxscore/leaders.spec.ts |
| E-8b | leaders 隊伍三表真實資料 | Task 8 e2e cleanup | tests/e2e/features/boxscore/leaders-team.spec.ts |

---

## Task 相依關係

```
Task 1 (Standings)  ────┐
Task 2 (Dragon)     ────┤
Task 3 (Roster)     ────┼──→ Task 7 (api.ts AC-E1) ──→ Task 8 (e2e cleanup) ──→ Task 9 (dragon.json dedup)
Task 4 (Home)       ────┤                                                                  ▲
Task 5 (Schedule)   ────┤                                                                  │
Task 6 (Leaders)    ────┘                                                          (獨立 / 任一時點皆可)
```

- Task 1–6 互相獨立可並行（各自只動自己 transformer + 自己的 unit/integration test）
- Task 7 必須在 Task 1–6 之後（因為 api.ts 啟用 SHEETS_RANGES 全 6 kind 仰賴 transformer 完成）
- Task 8 必須在 Task 7 之後（e2e 對 prod 跑真實鏈路前，需先確保 Sheets path + AC-E1 行為對齊）
- Task 9 完全獨立（純 JSON 字面修正）

---

## Task 1：transformStandings 補完 season/phase/currentWeek/matrix

**Files:**
- Modify: `src/lib/api-transforms.ts`（擴充 transformStandings 簽章 + 加 SHEETS_RANGES_STANDINGS_META 常數匯出）
- Modify: `src/lib/api.ts`（standings range 改成 multi-range：`['datas!P2:T7', 'datas!D2:M7' (meta), 'datas!<matrix range>']`，呼叫 transformer 傳入完整 ranges[]）
- Modify: `tests/unit/api-transforms.test.ts`（既有 transformStandings describe 擴充驗 season / phase / currentWeek / matrix）
- Modify: `tests/integration/api-standings-matrix.integration.test.ts`（補一個新 describe，驗 Sheets path 也能回出 matrix；既有 static fallback path 保留）

**Range 對映參考**：
- `datas!P2:T7` → 6 隊戰績 rows（既有）
- `datas!D2:M7` → home meta（phase 行 0、currentWeek 行 1，與 transformHome 共用同一 range；standings transformer 取相同 meta）
- matrix 6×6：sheet 上具體 range 由實作時參考 `gas/Code.gs` `handleStandings()` 與舊 `js/api.js` `sheetsRanges.matrix`（如不存在則先以 fallback static JSON 提供 matrix，本任務僅在 transformer 簽章上預留 matrix range 入口）。**若 GAS 端無對應 matrix range，本任務只補 season/phase/currentWeek，matrix 維持由 static JSON 補上**（記在 transformer JSDoc 上）

## Style Rules（subagent 必讀，由 Step 0.5 注入）

無命中（本 task 不涉及 fetch 路徑、不涉及 sticky/fixed、不新增 3+ 欄位列表）。

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/api-transforms.test.ts — 擴充既有 transformStandings describe
import { describe, it, expect } from 'vitest';
import { transformStandings, type SheetsValueRange } from '../../src/lib/api-transforms';

describe('transformStandings (Issue #17)', () => {
  it('parse Sheets datas!P2:T7 + datas!D2:M7 → StandingsData with season/phase/currentWeek (Covers: I-1)', () => {
    const ranges: SheetsValueRange[] = [
      // [0] standings rows
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
      // [1] meta range（phase / currentWeek）
      {
        range: 'datas!D2:M7',
        values: [
          ['季後賽'],
          ['13'],
          ['比賽日期'],
          ['2026/5/9'],
          ['比賽地點'],
          ['大安'],
        ],
      },
    ];

    const result = transformStandings(ranges);
    expect(result.teams).toHaveLength(6);
    expect(result.season).toBe(25);
    expect(result.phase).toBe('季後賽');
    expect(result.currentWeek).toBe(13);
  });

  it('meta range 缺失 → season=25, phase="", currentWeek=0 (Covers: I-1)', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!P2:T7', values: [['紅', '0', '0', '0%', '']] },
    ];
    const result = transformStandings(ranges);
    expect(result.season).toBe(25);
    expect(result.phase).toBe('');
    expect(result.currentWeek).toBe(0);
  });
});
```

```typescript
// tests/integration/api-standings-matrix.integration.test.ts — 末尾新增 describe
describe('api.ts standings Sheets path 也回 season/phase/currentWeek (Issue #17)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PUBLIC_SHEET_ID', 'TEST');
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', 'KEY');
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
    vi.unstubAllEnvs();
  });

  it('fetchData(standings) Sheets path 回傳含 season/phase/currentWeek (Covers: I-1)', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response(JSON.stringify({
          valueRanges: [
            { range: 'datas!P2:T7', values: [['紅', '15', '5', '75.0%', '8連勝']] },
            { range: 'datas!D2:M7', values: [['季後賽'], ['13']] },
          ],
        }), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type R = { teams: unknown[]; season: number; phase: string; currentWeek: number };
    const result = await fetchData<R>('standings');
    expect(result.source).toBe('sheets');
    expect(result.data?.season).toBe(25);
    expect(result.data?.phase).toBe('季後賽');
    expect(result.data?.currentWeek).toBe(13);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npx vitest run tests/unit/api-transforms.test.ts tests/integration/api-standings-matrix.integration.test.ts
```
預期：FAIL — `expect(result.season).toBe(25)` ✗（既有實作回 `as unknown as StandingsData` 缺 season）；新 describe block 整段 FAIL。

- [ ] **Step 3：實作最小程式碼**

```typescript
// src/lib/api-transforms.ts — transformStandings 改寫
export function transformStandings(ranges: SheetsValueRange[]): StandingsData {
  const standingsRows = ranges[0]?.values ?? [];
  const metaRows = ranges[1]?.values ?? [];

  const teams = standingsRows.map((row, idx) => ({
    rank: idx + 1,
    name: `${row[0] ?? ''}隊`,
    team: row[0] ?? '',
    wins: parseInt(row[1] ?? '0', 10) || 0,
    losses: parseInt(row[2] ?? '0', 10) || 0,
    pct: row[3] ?? '0%',
    history: [], // 由 fallback static JSON 補；Sheets path 暫無 history range
    streak: row[4] ?? '',
    streakType: deriveStreakType(row[4] ?? ''),
  }));

  return {
    season: SEASON,
    phase: metaRows[0]?.[0] ?? '',
    currentWeek: parseInt(metaRows[1]?.[0] ?? '0', 10) || 0,
    teams,
    // matrix 由 static JSON 補；本 task 不從 Sheets 解析 matrix
  };
}

function deriveStreakType(streak: string): 'win' | 'lose' | 'none' {
  if (streak.includes('勝')) return 'win';
  if (streak.includes('敗')) return 'lose';
  return 'none';
}
```

```typescript
// src/lib/api.ts — SHEETS_RANGES.standings 擴成 multi-range
const SHEETS_RANGES: Record<DataKind, string[]> = {
  standings: ['datas!P2:T7', 'datas!D2:M7'],  // ← 新增 meta range
  // ...其餘維持
};
```

- [ ] **Step 4：確認測試通過**

```bash
npx vitest run tests/unit/api-transforms.test.ts tests/integration/api-standings-matrix.integration.test.ts
```
預期：PASS（含既有 fallback path test 不 regression）。

- [ ] **Step 5：Commit**

```bash
git add src/lib/api-transforms.ts src/lib/api.ts tests/unit/api-transforms.test.ts tests/integration/api-standings-matrix.integration.test.ts
git commit -m "feat(transform): standings 補完 season/phase/currentWeek (#17)"
```

---

## Task 2：transformDragon 補完 season/phase + civilianThreshold + DragonTabPanel 分組對齊

**Files:**
- Modify: `src/lib/api-transforms.ts`（transformDragon 改成 multi-range：`['datas!D13:L76', 'datas!D2:M7' meta, 'datas!<threshold range>']`，回傳 season / phase / civilianThreshold / players / rank / tag / columns）
- Modify: `src/lib/api.ts`（SHEETS_RANGES.dragon 擴 multi-range）
- Modify: `src/components/roster/DragonTabPanel.tsx`（group title 文案改為「前 {civilians.length} 名」+「第 {civilians.length + 1} 名起」，**讓 N === 平民區實際人數**）
- Modify: `tests/unit/api-transforms.test.ts`（transformDragon describe 擴充驗 season/phase + civilianThreshold from sheets）
- Modify: `tests/unit/dragon-components.test.ts`（補測 group title 文案中的 N === civilians.length）

**Range 對映**：
- `datas!D13:L76` → 龍虎榜 rows（既有）
- `datas!D2:M7` → meta（phase / season）
- threshold range：依 GAS 端設計位置，例如 `datas!<某 cell>`。**若 Sheets 端無單一 threshold cell**，則改為「依資料推導」：threshold = 平民區界定值（例如「最後一個 total >= 某動態值」），具體規則由實作時對照 `gas/Code.gs handleDragon()` 的 civilian 計算邏輯確認；本 task 預設 threshold 為 Sheets meta 中的一個 cell，若 GAS 無對應則以「rank-based fixed N（Sheets meta 取得 N，預設 36）」作為 fallback。**核心要求：threshold 顯示在 group title 的 N 必須等於 `civilians.length`**（即「前 N 名 = 平民區實際 N 個球員」）

## Style Rules（subagent 必讀，由 Step 0.5 注入）

無命中（本 task 不涉及 fetch 邏輯本身、不涉及 sticky/fixed、不新增 3+ 欄位列表）。

- [ ] **Step 1：寫失敗測試（TDD，含 U-1）**

```typescript
// tests/unit/api-transforms.test.ts — transformDragon 擴充
describe('transformDragon (Issue #17)', () => {
  it('multi-range → DragonData with season/phase/civilianThreshold from Sheets (Covers: I-2)', () => {
    const ranges: SheetsValueRange[] = [
      {
        range: 'datas!D13:L76',
        values: [
          ['李子昂', '黑', '20', '10', '1', '—', '31', '', ''],
          ['吳家豪', '綠', '6', '6', '0', '—', '12', '', ''],
        ],
      },
      { range: 'datas!D2:M7', values: [['例行賽'], ['10']] },
      { range: 'datas!<threshold>', values: [['10']] },  // civilianThreshold 由此 cell
    ];
    const result = transformDragon(ranges);
    expect(result.season).toBe(25);
    expect(result.phase).toBe('例行賽');
    expect(result.civilianThreshold).toBe(10);
    expect(result.players).toHaveLength(2);
    expect(result.players[0]).toMatchObject({ rank: 1, name: '李子昂', total: 31 });
  });

  it('threshold cell 缺失 → civilianThreshold 沿用預設 36（向後相容）(Covers: I-2)', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!D13:L76', values: [['李', '黑', '5', '0', '0', '—', '5', '', '']] },
    ];
    const result = transformDragon(ranges);
    expect(result.civilianThreshold).toBe(36);
  });
});
```

```typescript
// tests/unit/dragon-components.test.ts — 補測 U-1
import { mockDragonGroupingShowcase } from '../fixtures/dragon';

describe('DragonTabPanel — group title N === civilians.length (Issue #17, Covers: U-1)', () => {
  it('group title 顯示「前 N 名」N 等於平民區實際渲染人數', () => {
    const data = mockDragonGroupingShowcase(); // threshold = 10, players[0..4].total >= 10 → 5 civilians
    const html = renderToString(createElement(DragonTabPanel, { data }));

    // civilians.length === 5
    const civiliansCount = data.players.filter((p) => p.total >= data.civilianThreshold).length;
    expect(civiliansCount).toBe(5);

    // group title 文案中 N 必須等於 civiliansCount
    expect(html).toContain(`前 ${civiliansCount} 名`);
    expect(html).toContain(`第 ${civiliansCount + 1} 名起`);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npx vitest run tests/unit/api-transforms.test.ts tests/unit/dragon-components.test.ts
```
預期：FAIL — transformDragon 既有實作回寫死 `civilianThreshold: 36`，且不含 season/phase；DragonTabPanel 既有版本顯示「前 {civilianThreshold} 名」（threshold=10 顯示「前 10 名」），但 civilians.length=5，不等。

- [ ] **Step 3：實作最小程式碼**

```typescript
// src/lib/api-transforms.ts — transformDragon
export function transformDragon(ranges: SheetsValueRange[]): DragonData {
  const playerRows = ranges[0]?.values ?? [];
  const metaRows = ranges[1]?.values ?? [];
  const thresholdCell = ranges[2]?.values?.[0]?.[0];

  const players = playerRows
    .filter((row) => row[0])
    .map((row, idx) => ({
      rank: idx + 1,
      name: row[0] ?? '',
      team: row[1] ?? '',
      tag: null,
      att: parseInt(row[2] ?? '0', 10) || 0,
      duty: parseInt(row[3] ?? '0', 10) || 0,
      mop: parseInt(row[4] ?? '0', 10) || 0,
      playoff: row[5] === '—' ? null : parseInt(row[5] ?? '0', 10) || 0,
      total: parseInt(row[6] ?? '0', 10) || 0,
    }));

  return {
    season: SEASON,
    phase: metaRows[0]?.[0] ?? '',
    civilianThreshold: thresholdCell !== undefined ? (parseInt(thresholdCell, 10) || 36) : 36,
    columns: ['出席', '輪值', '拖地', '季後賽'],
    players,
  };
}
```

```typescript
// src/lib/api.ts — SHEETS_RANGES.dragon
const SHEETS_RANGES: Record<DataKind, string[]> = {
  // ...
  dragon: ['datas!D13:L76', 'datas!D2:M7', 'datas!<threshold-cell-range>'],
  // ...
};
```

```tsx
// src/components/roster/DragonTabPanel.tsx — group title 改為依 civilians.length
// Before:
//   <h3>🧑 平民區（前 {civilianThreshold} 名 ...）</h3>
//   <h3>⛓️ 奴隸區（第 {civilianThreshold + 1} 名起 ...）</h3>
// After:
const civilianCount = civilians.length;
// ...
<h3>🧑 平民區（前 {civilianCount} 名 · 可優先自由選擇加入隊伍）</h3>
// ...
<h3>⛓️ 奴隸區（第 {civilianCount + 1} 名起 · ...）</h3>
// 注意：civilian-divider 文案中的「{civilianThreshold} 分」保留（仍是 total 分數線）
```

- [ ] **Step 4：確認測試通過**

```bash
npx vitest run tests/unit/api-transforms.test.ts tests/unit/dragon-components.test.ts
```
預期：PASS。

- [ ] **Step 5：Commit**

```bash
git add src/lib/api-transforms.ts src/lib/api.ts src/components/roster/DragonTabPanel.tsx tests/unit/api-transforms.test.ts tests/unit/dragon-components.test.ts
git commit -m "fix(dragon): threshold 從 Sheets 取真實值 + 分組標題對齊實際 N (#17)"
```

---

## Task 3：transformRoster 完整 6-team 切分 + season/phase

**Files:**
- Modify: `src/lib/api-transforms.ts`（transformRoster 改寫：對 `datas!O19:AH83` 做 6-team 切分，每隊 N 個球員 + att 陣列；補 season / phase 從 meta）
- Modify: `src/lib/api.ts`（SHEETS_RANGES.roster 改成 multi-range）
- Modify: `tests/unit/api-transforms.test.ts`（transformRoster describe 擴充驗 6 隊 + att 陣列）

**Range 對映**：
- `datas!O19:AH83` → roster block（依 GAS handleRoster 切 6 個 sub-block，每 sub-block 含一隊球員列）
- `datas!D2:M7` → meta（phase）
- weeks header range（從 GAS 取得 RosterWeek[]）

**注意 RosterData 型別**：`{ weeks: RosterWeek[]; teams: RosterTeam[] }`，**無** `season` / `phase` 欄位（型別檔已定）。本 task 只補 weeks + teams 兩欄，不擴 season/phase（若需賽季顯示，由 RosterHero 元件透過另一 API kind 提供，本 Issue 範圍不擴 RosterData 型別）。

## Style Rules（subagent 必讀，由 Step 0.5 注入）

無命中。

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/api-transforms.test.ts — transformRoster 擴充
describe('transformRoster (Issue #17)', () => {
  it('6-team 切分 + att 陣列 (Covers: I-3)', () => {
    // 模擬 datas!O19:AH83：每隊一個 block，6 隊
    // 第一列為 weeks header（W1..W12 或日期），後續每列為一個球員 + att 值
    const headerRow = ['', 'W1', 'W2', 'W3', 'W4', 'W5'];
    const team1 = [
      ['紅'],
      ['韋承志', '1', '1', '0', 'x', '?'],
      ['吳軒宇', '1', '0', '1', '1', '1'],
    ];
    // ...其餘 5 隊比照（白、藍、綠、黃、黑）
    const allRows = [headerRow, ...team1 /* + 其餘 5 隊 */ ];

    const ranges: SheetsValueRange[] = [
      { range: 'datas!O19:AH83', values: allRows },
    ];
    const result = transformRoster(ranges);
    expect(result.weeks.length).toBeGreaterThan(0);
    expect(result.teams.length).toBe(6);
    const red = result.teams.find((t) => t.id === '紅');
    expect(red?.players[0].name).toBe('韋承志');
    expect(red?.players[0].att).toEqual([1, 1, 0, 'x', '?']);
  });

  it('ranges 為空 → weeks: [], teams: [] (Covers: I-3)', () => {
    const result = transformRoster([]);
    expect(result.weeks).toEqual([]);
    expect(result.teams).toEqual([]);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npx vitest run tests/unit/api-transforms.test.ts
```
預期：FAIL — 既有 stub 回 `{ season, teams: [] }`（且型別錯誤）。

- [ ] **Step 3：實作最小程式碼**

```typescript
// src/lib/api-transforms.ts
export function transformRoster(ranges: SheetsValueRange[]): RosterData {
  const rows = ranges[0]?.values ?? [];
  if (rows.length === 0) return { weeks: [], teams: [] };

  const headerRow = rows[0];
  const weeks = headerRow.slice(1).map((label, idx) => ({
    wk: idx + 1,
    label,
    date: '', // 若有單獨 dates range 則 zip；本 task 簡化為空
  }));

  const teams: RosterData['teams'] = [];
  let currentTeam: RosterData['teams'][number] | null = null;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cell0 = row[0] ?? '';
    if (cell0.length === 1 && '紅黑藍綠黃白'.includes(cell0)) {
      // 新隊伍 block 起始
      currentTeam = { id: cell0, name: `${cell0}隊`, players: [] };
      teams.push(currentTeam);
      continue;
    }
    if (currentTeam && cell0) {
      currentTeam.players.push({
        name: cell0,
        att: row.slice(1).map(parseAttCell) as RosterData['teams'][number]['players'][number]['att'],
      });
    }
  }
  return { weeks, teams };
}

function parseAttCell(v: string): 1 | 0 | 'x' | '?' {
  if (v === '1') return 1;
  if (v === '0') return 0;
  if (v === 'x' || v === 'X') return 'x';
  return '?';
}
```

```typescript
// src/lib/api.ts — SHEETS_RANGES.roster
const SHEETS_RANGES: Record<DataKind, string[]> = {
  // ...
  roster: ['datas!O19:AH83'],
  // ...
};

const TRANSFORMERS: Partial<Record<DataKind, (r: SheetsValueRange[]) => unknown>> = {
  // ...
  roster: transformRoster,
};
```

- [ ] **Step 4：確認測試通過**

```bash
npx vitest run tests/unit/api-transforms.test.ts
```
預期：PASS。

- [ ] **Step 5：Commit**

```bash
git add src/lib/api-transforms.ts src/lib/api.ts tests/unit/api-transforms.test.ts
git commit -m "feat(transform): roster 6-team 切分 + att 陣列 (#17)"
```

---

## Task 4：transformHome 完整 composite shape + home-utils miniStandings 排序

**Files:**
- Modify: `src/lib/api-transforms.ts`（transformHome 補 composite：meta + standings + dragonTop10 + miniStats，從多個 ranges 組合）
- Modify: `src/lib/api.ts`（SHEETS_RANGES.home 啟用 multi-range：`[home meta, standings P2:T7, dragon D13:L76 (top10), leaders D212:N224 (miniStats)]`）
- Modify: `src/lib/home-utils.ts`（補一個 `pickMiniStandings(standings, n)` 函式 — 從完整 standings 取 top n，依 rank 排序）
- Modify: `tests/unit/api-transforms.test.ts`（transformHome describe 擴充驗 standings / dragonTop10 / miniStats 三段都被填）
- Modify: `tests/unit/home-utils.test.ts`（補測 pickMiniStandings）
- Modify: `tests/integration/api-sheets.integration.test.ts`（補一個 home assertion：fetchData('home').data.standings.length === 6 且 dragonTop10.length 上限 10）

## Style Rules（subagent 必讀，由 Step 0.5 注入）

無命中（home-utils 純函式不涉及 fetch 路徑；style-skeleton-loading 的 trigger 落在 api.ts，已歸 Task 7）。

- [ ] **Step 1：寫失敗測試（TDD，含 U-2）**

```typescript
// tests/unit/api-transforms.test.ts — transformHome 擴充
describe('transformHome (Issue #17)', () => {
  it('composite shape 含 standings + dragonTop10 + miniStats (Covers: I-4)', () => {
    const ranges: SheetsValueRange[] = [
      // [0] home meta
      { range: 'datas!D2:M7', values: [['例行賽'], ['10'], ['比賽日期'], ['2026/5/9'], ['比賽地點'], ['大安']] },
      // [1] standings rows
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
      // [2] dragon rows (top 10 切片由 transformer 處理)
      {
        range: 'datas!D13:L76',
        values: Array.from({ length: 12 }, (_, i) => [`球員${i+1}`, '紅', '5', '0', '0', '—', `${30-i}`, '', '']),
      },
      // [3] leaders mini stats
      {
        range: 'datas!D212:N224',
        values: [
          // 假設前 N 列為 PTS leaders、中段 REB、後段 AST，具體格式視 gas/Code.gs handleLeaders
          ['得分', '王', '紅', '20.5'],
          ['籃板', '李', '黑', '12.3'],
          ['助攻', '陳', '綠', '8.1'],
        ],
      },
    ];
    const result = transformHome(ranges);
    expect(result.standings).toHaveLength(6);
    expect(result.dragonTop10.length).toBeLessThanOrEqual(10);
    expect(result.dragonTop10.length).toBeGreaterThan(0);
    expect(result.miniStats.pts.players.length).toBeGreaterThan(0);
  });
});
```

```typescript
// tests/unit/home-utils.test.ts — 擴充
describe('pickMiniStandings (Issue #17, Covers: U-2)', () => {
  it('取 top n 並依 rank 排序', () => {
    const full = [
      { rank: 3, name: '黑隊', team: '黑', record: '11-9', pct: '55.0%', history: [], streak: '', streakType: null },
      { rank: 1, name: '綠隊', team: '綠', record: '16-4', pct: '80.0%', history: [], streak: '2連勝', streakType: 'win' as const },
      { rank: 2, name: '紅隊', team: '紅', record: '15-5', pct: '75.0%', history: [], streak: '8連勝', streakType: 'win' as const },
    ];
    const result = pickMiniStandings(full, 2);
    expect(result.map((t) => t.rank)).toEqual([1, 2]);
  });
});
```

```typescript
// tests/integration/api-sheets.integration.test.ts — 末尾加
it('fetchData(home) 回傳 composite shape 完整 (Covers: I-4)', async () => {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url);
    if (u.includes('sheets.googleapis.com')) {
      return new Response(JSON.stringify({
        valueRanges: [
          { range: 'datas!D2:M7', values: [['季後賽'], ['13']] },
          { range: 'datas!P2:T7', values: [
            ['紅','15','5','75.0%','8連勝'], ['黑','11','9','55.0%','2連敗'],
            ['藍','5','15','25.0%','2連敗'], ['綠','16','4','80.0%','2連勝'],
            ['黃','6','14','30.0%','1連勝'], ['白','7','13','35.0%','1連敗'],
          ]},
          { range: 'datas!D13:L76', values: [['李','黑','5','0','0','—','5','','']] },
          { range: 'datas!D212:N224', values: [['得分','王','紅','20.5']] },
        ],
      }), { status: 200 });
    }
    throw new Error(`unexpected: ${u}`);
  }) as unknown as typeof fetch;

  const { fetchData } = await import('../../src/lib/api');
  type R = { standings: unknown[]; dragonTop10: unknown[] };
  const result = await fetchData<R>('home');
  expect(result.source).toBe('sheets');
  expect(result.data?.standings).toHaveLength(6);
  expect(result.data?.dragonTop10.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npx vitest run tests/unit/api-transforms.test.ts tests/unit/home-utils.test.ts tests/integration/api-sheets.integration.test.ts
```
預期：FAIL — transformHome 既有 stub 回空 standings/dragonTop10/miniStats；pickMiniStandings 不存在。

- [ ] **Step 3：實作最小程式碼**

```typescript
// src/lib/home-utils.ts — 新增
import type { HomeStandingTeam } from '../types/home';

export function pickMiniStandings(full: HomeStandingTeam[], n: number): HomeStandingTeam[] {
  return [...full].sort((a, b) => a.rank - b.rank).slice(0, n);
}
```

```typescript
// src/lib/api-transforms.ts — transformHome 改寫
export function transformHome(ranges: SheetsValueRange[]): HomeData {
  const meta = ranges[0]?.values ?? [];
  const standingsRows = ranges[1]?.values ?? [];
  const dragonRows = ranges[2]?.values ?? [];
  const leadersRows = ranges[3]?.values ?? [];

  const phase = meta[0]?.[0] ?? '';
  const currentWeek = parseInt(meta[1]?.[0] ?? '0', 10) || 0;
  const date = meta[3]?.[0] ?? '';
  const venue = meta[5]?.[0] ?? '';

  const standings = standingsRows.map((row, idx) => ({
    rank: idx + 1,
    name: `${row[0] ?? ''}隊`,
    team: row[0] ?? '',
    record: `${row[1] ?? '0'}-${row[2] ?? '0'}`,
    pct: row[3] ?? '0%',
    history: [],
    streak: row[4] ?? '',
    streakType: row[4]?.includes('勝') ? ('win' as const) : row[4]?.includes('敗') ? ('lose' as const) : null,
  }));

  const dragonTop10 = dragonRows
    .filter((r) => r[0])
    .slice(0, 10)
    .map((row, idx) => ({
      rank: idx + 1,
      name: row[0] ?? '',
      team: row[1] ?? '',
      att: parseInt(row[2] ?? '0', 10) || 0,
      duty: parseInt(row[3] ?? '0', 10) || 0,
      total: parseInt(row[6] ?? '0', 10) || 0,
    }));

  const miniStats = {
    pts: { label: 'PTS', unit: '分', players: extractMiniPlayers(leadersRows, '得分') },
    reb: { label: 'REB', unit: '個', players: extractMiniPlayers(leadersRows, '籃板') },
    ast: { label: 'AST', unit: '次', players: extractMiniPlayers(leadersRows, '助攻') },
  };

  return {
    season: SEASON,
    phase,
    currentWeek,
    scheduleInfo: { date, venue },
    standings,
    dragonTop10,
    miniStats,
  };
}

function extractMiniPlayers(rows: string[][], label: string) {
  return rows
    .filter((r) => r[0] === label)
    .map((r, idx) => ({
      rank: idx + 1,
      name: r[1] ?? '',
      team: r[2] ?? '',
      val: parseFloat(r[3] ?? '0') || 0,
    }));
}
```

```typescript
// src/lib/api.ts
const SHEETS_RANGES: Record<DataKind, string[]> = {
  // ...
  home: ['datas!D2:M7', 'datas!P2:T7', 'datas!D13:L76', 'datas!D212:N224'],
  // ...
};
const TRANSFORMERS: Partial<Record<DataKind, (r: SheetsValueRange[]) => unknown>> = {
  // ...
  home: transformHome,
};
```

- [ ] **Step 4：確認測試通過**

```bash
npx vitest run tests/unit/api-transforms.test.ts tests/unit/home-utils.test.ts tests/integration/api-sheets.integration.test.ts
```
預期：PASS。

- [ ] **Step 5：Commit**

```bash
git add src/lib/api-transforms.ts src/lib/api.ts src/lib/home-utils.ts tests/unit/api-transforms.test.ts tests/unit/home-utils.test.ts tests/integration/api-sheets.integration.test.ts
git commit -m "feat(transform): home composite (standings + dragonTop10 + miniStats) + home-utils pickMiniStandings (#17)"
```

---

## Task 5：transformSchedule 完整 zip → weeks[]

**Files:**
- Modify: `src/lib/api-transforms.ts`（transformSchedule 改寫：對 dates / allSchedule / allMatchups 三組做 zip → weeks[]）
- Modify: `src/lib/api.ts`（SHEETS_RANGES.schedule 啟用 multi-range：`['datas!P13:AG13', 'datas!D87:N113', 'datas!D117:F206']`）
- Modify: `tests/unit/api-transforms.test.ts`（transformSchedule describe 擴充驗 weeks 結構含 GameWeek 完整欄位）

## Style Rules（subagent 必讀，由 Step 0.5 注入）

無命中。

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/api-transforms.test.ts
describe('transformSchedule (Issue #17)', () => {
  it('zip dates + allSchedule + allMatchups → weeks[] (Covers: I-5)', () => {
    const ranges: SheetsValueRange[] = [
      // dates: 一橫列，每欄一週日期
      { range: 'datas!P13:AG13', values: [['2026/5/2', '2026/5/9', '2026/5/16']] },
      // allSchedule: 每週 N 列，每列一場比賽（num / time / home / away / homeScore / awayScore / status / staff...）
      {
        range: 'datas!D87:N113',
        values: [
          ['1', '14:00', '紅', '黑', '88', '77', 'finished', ''],
          ['2', '15:00', '綠', '藍', '90', '80', 'finished', ''],
          ['3', '16:00', '黃', '白', '70', '75', 'finished', ''],
          ['1', '14:00', '紅', '綠', '', '', 'upcoming', ''],
          ['2', '15:00', '黑', '黃', '', '', 'upcoming', ''],
          ['3', '16:00', '藍', '白', '', '', 'upcoming', ''],
        ],
      },
      // allMatchups: combo / home / away
      {
        range: 'datas!D117:F206',
        values: [
          ['1', '紅', '黑'],
          ['2', '綠', '藍'],
          ['3', '黃', '白'],
          ['1', '紅', '綠'],
          ['2', '黑', '黃'],
          ['3', '藍', '白'],
        ],
      },
    ];
    const result = transformSchedule(ranges);
    expect(result.allWeeks).toHaveLength(2); // 兩週有比賽
    const w1 = result.allWeeks[0];
    expect(w1.type).toBe('game');
    if (w1.type === 'game') {
      expect(w1.date).toBe('2026/5/2');
      expect(w1.games).toHaveLength(3);
      expect(w1.games[0]).toMatchObject({ home: '紅', away: '黑', homeScore: 88 });
      expect(w1.matchups).toHaveLength(3);
    }
  });

  it('ranges 為空 → allWeeks: [] (Covers: I-5)', () => {
    const result = transformSchedule([]);
    expect(result.allWeeks).toEqual([]);
    expect(result.weeks).toEqual([]);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npx vitest run tests/unit/api-transforms.test.ts
```
預期：FAIL — 既有 stub 回 `{ season, currentWeek: 1, weeks: [] }`（缺 allWeeks）。

- [ ] **Step 3：實作最小程式碼**

```typescript
// src/lib/api-transforms.ts
export function transformSchedule(ranges: SheetsValueRange[]): ScheduleData {
  if (ranges.length === 0) return { season: SEASON, currentWeek: 1, allWeeks: [], weeks: {} };

  const dates = ranges[0]?.values?.[0] ?? [];
  const scheduleRows = ranges[1]?.values ?? [];
  const matchupRows = ranges[2]?.values ?? [];
  const GAMES_PER_WEEK = 3;

  const allWeeks: ScheduleData['allWeeks'] = [];
  for (let w = 0; w < dates.length; w++) {
    const date = dates[w];
    if (!date) continue;
    const games = scheduleRows.slice(w * GAMES_PER_WEEK, (w + 1) * GAMES_PER_WEEK).map((row) => ({
      num: parseInt(row[0] ?? '0', 10) || 0,
      time: row[1] ?? '',
      home: row[2] ?? '',
      away: row[3] ?? '',
      homeScore: row[4] ? parseInt(row[4], 10) : null,
      awayScore: row[5] ? parseInt(row[5], 10) : null,
      status: (row[6] ?? 'upcoming') as 'finished' | 'upcoming' | 'in_progress',
      staff: {},
    }));
    if (games.length === 0) continue;
    const matchups = matchupRows.slice(w * GAMES_PER_WEEK, (w + 1) * GAMES_PER_WEEK).map((row) => ({
      combo: parseInt(row[0] ?? '0', 10) || 0,
      home: row[1] ?? '',
      away: row[2] ?? '',
      homeScore: null,
      awayScore: null,
      status: 'upcoming',
    }));
    allWeeks.push({
      type: 'game',
      week: w + 1,
      date,
      phase: '',
      venue: '',
      matchups,
      games,
    });
  }

  // 同時建 weeks Record（給舊 UI 用）
  const weeks: Record<string, NonNullable<ScheduleData['weeks']>[string]> = {};
  for (const wk of allWeeks) {
    if (wk.type === 'game') weeks[String(wk.week)] = wk;
  }

  // currentWeek：第一個 status=upcoming 的週；全 finished 則最後一週
  const currentIdx = allWeeks.findIndex((w) => w.type === 'game' && w.games.some((g) => g.status === 'upcoming'));
  const currentWeek = currentIdx >= 0 ? currentIdx + 1 : allWeeks.length;

  return { season: SEASON, currentWeek, allWeeks, weeks };
}
```

```typescript
// src/lib/api.ts
const SHEETS_RANGES: Record<DataKind, string[]> = {
  // ...
  schedule: ['datas!P13:AG13', 'datas!D87:N113', 'datas!D117:F206'],
  // ...
};
const TRANSFORMERS: Partial<Record<DataKind, (r: SheetsValueRange[]) => unknown>> = {
  // ...
  schedule: transformSchedule,
};
```

- [ ] **Step 4：確認測試通過**

```bash
npx vitest run tests/unit/api-transforms.test.ts
```
預期：PASS。

- [ ] **Step 5：Commit**

```bash
git add src/lib/api-transforms.ts src/lib/api.ts tests/unit/api-transforms.test.ts
git commit -m "feat(transform): schedule zip dates+allSchedule+allMatchups → weeks (#17)"
```

---

## Task 6：transformLeaders 完整 4-block 解析

**Files:**
- Modify: `src/lib/api-transforms.ts`（transformLeaders 改寫：分別解析 leadersTable / teamOffense / teamDefense / teamNet）
- Modify: `src/lib/api.ts`（SHEETS_RANGES.leaders 與 stats 啟用 multi-range；leaders 與 stats 共用同一 transformer）
- Modify: `tests/unit/api-transforms.test.ts`（transformLeaders describe 擴充驗個人 + 3 張隊伍表）
- Modify: `tests/integration/api-leaders-extended.integration.test.ts`（補一個 Sheets path 的 describe，驗 4-block 解析）

**LeaderData 型別**：`Record<seasonKey, LeaderSeason>` — transformer 應以「`'25'`」當 key，包覆完整 LeaderSeason。

## Style Rules（subagent 必讀，由 Step 0.5 注入）

無命中。

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/api-transforms.test.ts
describe('transformLeaders (Issue #17)', () => {
  it('4-block 解析個人 + offense / defense / net (Covers: I-6)', () => {
    const ranges: SheetsValueRange[] = [
      // leadersTable: 個人類別表，cols: [類別 / name / team / val / p2 / p3 / ft / off / def]
      {
        range: 'datas!D212:N224',
        values: [
          ['得分', '王', '紅', '20.5'],
          ['得分', '李', '黑', '18.2'],
          ['籃板', '陳', '綠', '12.3'],
          ['助攻', '林', '黃', '8.1'],
        ],
      },
      // teamOffense: 6 隊
      {
        range: 'datas!D227:K234',
        values: [
          ['隊伍', '得分', '助攻', '失誤'],
          ['紅', '88.5', '20.1', '12.3'],
          ['黑', '85.0', '18.5', '13.0'],
          ['藍', '78.2', '15.0', '14.5'],
          ['綠', '90.1', '22.3', '10.8'],
          ['黃', '80.0', '17.0', '13.5'],
          ['白', '82.5', '19.0', '12.0'],
        ],
      },
      // teamDefense: 6 隊
      {
        range: 'datas!D237:K244',
        values: [
          ['隊伍', '失分', '抄截', '阻攻'],
          ['紅', '75.0', '8.5', '4.0'],
          ['黑', '78.0', '7.0', '3.5'],
          ['藍', '85.0', '6.0', '2.0'],
          ['綠', '72.5', '9.0', '4.5'],
          ['黃', '80.0', '7.5', '3.0'],
          ['白', '79.5', '8.0', '3.8'],
        ],
      },
      // teamNet: 6 隊
      {
        range: 'datas!D247:K254',
        values: [
          ['隊伍', '淨勝分'],
          ['紅', '13.5'],
          ['黑', '7.0'],
          ['藍', '-6.8'],
          ['綠', '17.6'],
          ['黃', '0.0'],
          ['白', '3.0'],
        ],
      },
    ];
    const result = transformLeaders(ranges);
    const season = result['25'];
    expect(season).toBeDefined();
    expect(season.scoring.length).toBeGreaterThan(0);
    expect(season.scoring[0]).toMatchObject({ name: '王', team: '紅', val: 20.5 });
    expect(season.rebound[0]).toMatchObject({ name: '陳' });
    expect(season.offense?.rows).toHaveLength(6);
    expect(season.defense?.rows).toHaveLength(6);
    expect(season.net?.rows).toHaveLength(6);
  });

  it('ranges 為空 → 回 {} (Covers: I-6)', () => {
    const result = transformLeaders([]);
    expect(result).toEqual({});
  });
});
```

```typescript
// tests/integration/api-leaders-extended.integration.test.ts — 末尾加
describe('Sheets path 4-block 解析（Issue #17）', () => {
  it('fetchData(stats) Sheets path 回出 offense/defense/net 三張 6 隊表 (Covers: I-6)', async () => {
    vi.stubEnv('PUBLIC_SHEET_ID', 'TEST');
    vi.stubEnv('PUBLIC_SHEETS_API_KEY', 'KEY');
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('sheets.googleapis.com')) {
        return new Response(JSON.stringify({
          valueRanges: [
            { range: 'datas!D212:N224', values: [['得分', '王', '紅', '20.5']] },
            { range: 'datas!D227:K234', values: [['隊伍'], ...Array.from({ length: 6 }, (_, i) => [['紅','黑','藍','綠','黃','白'][i], '0', '0', '0'])] },
            { range: 'datas!D237:K244', values: [['隊伍'], ...Array.from({ length: 6 }, (_, i) => [['紅','黑','藍','綠','黃','白'][i], '0', '0', '0'])] },
            { range: 'datas!D247:K254', values: [['隊伍'], ...Array.from({ length: 6 }, (_, i) => [['紅','黑','藍','綠','黃','白'][i], '0'])] },
          ],
        }), { status: 200 });
      }
      throw new Error(`unexpected: ${u}`);
    }) as unknown as typeof fetch;

    const { fetchData } = await import('../../src/lib/api');
    type R = Record<string, { offense?: { rows: unknown[] }; defense?: { rows: unknown[] }; net?: { rows: unknown[] } }>;
    const result = await fetchData<R>('stats');
    expect(result.source).toBe('sheets');
    expect(result.data?.['25'].offense?.rows).toHaveLength(6);
    expect(result.data?.['25'].defense?.rows).toHaveLength(6);
    expect(result.data?.['25'].net?.rows).toHaveLength(6);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npx vitest run tests/unit/api-transforms.test.ts tests/integration/api-leaders-extended.integration.test.ts
```
預期：FAIL — 既有 stub 回 `{ season, leaders: [], teamOffense, teamDefense, teamNet }`（型別錯誤，且 LeaderData 是 Record<string, LeaderSeason> 而非單一 season）。

- [ ] **Step 3：實作最小程式碼**

```typescript
// src/lib/api-transforms.ts
const CATEGORY_MAP: Record<string, keyof Pick<LeaderSeason, 'scoring' | 'rebound' | 'assist' | 'steal' | 'block' | 'eff' | 'turnover' | 'foul' | 'p2pct' | 'p3pct' | 'ftpct'>> = {
  '得分': 'scoring',
  '籃板': 'rebound',
  '助攻': 'assist',
  '抄截': 'steal',
  '阻攻': 'block',
  '效率值': 'eff',
  '失誤': 'turnover',
  '犯規': 'foul',
  '2P%': 'p2pct',
  '3P%': 'p3pct',
  'FT%': 'ftpct',
};

export function transformLeaders(ranges: SheetsValueRange[]): LeaderData {
  if (ranges.length === 0) return {};

  const leadersRows = ranges[0]?.values ?? [];
  const offenseBlock = ranges[1]?.values ?? [];
  const defenseBlock = ranges[2]?.values ?? [];
  const netBlock = ranges[3]?.values ?? [];

  const season: LeaderSeason = {
    label: `第 ${SEASON} 屆 · 本季個人排行榜`,
    scoring: [], rebound: [], assist: [], steal: [], block: [], eff: [],
  };
  for (const row of leadersRows) {
    const cat = CATEGORY_MAP[row[0] ?? ''];
    if (!cat) continue;
    if (!season[cat]) season[cat] = [];
    (season[cat] as { name: string; team: string; val: number }[]).push({
      name: row[1] ?? '',
      team: row[2] ?? '',
      val: parseFloat(row[3] ?? '0') || 0,
    });
  }

  season.offense = parseTeamBlock(offenseBlock);
  season.defense = parseTeamBlock(defenseBlock);
  season.net = parseTeamBlock(netBlock);

  return { [String(SEASON)]: season };
}

function parseTeamBlock(rows: string[][]): { headers: string[]; rows: { team: string; rank: number; values: number[] }[] } {
  const [headerRow, ...dataRows] = rows;
  const headers = headerRow ?? [];
  const teamRows = dataRows.map((r, idx) => ({
    team: r[0] ?? '',
    rank: idx + 1,
    values: r.slice(1).map((v) => parseFloat(v) || 0),
  }));
  return { headers, rows: teamRows };
}
```

```typescript
// src/lib/api.ts
const SHEETS_RANGES: Record<DataKind, string[]> = {
  // ...
  leaders: ['datas!D212:N224', 'datas!D227:K234', 'datas!D237:K244', 'datas!D247:K254'],
  stats: ['datas!D212:N224', 'datas!D227:K234', 'datas!D237:K244', 'datas!D247:K254'],
  // ...
};
const TRANSFORMERS: Partial<Record<DataKind, (r: SheetsValueRange[]) => unknown>> = {
  // ...
  leaders: transformLeaders,
  stats: transformLeaders,
};
```

- [ ] **Step 4：確認測試通過**

```bash
npx vitest run tests/unit/api-transforms.test.ts tests/integration/api-leaders-extended.integration.test.ts
```
預期：PASS。

- [ ] **Step 5：Commit**

```bash
git add src/lib/api-transforms.ts src/lib/api.ts tests/unit/api-transforms.test.ts tests/integration/api-leaders-extended.integration.test.ts
git commit -m "feat(transform): leaders 4-block 解析 (個人 + 3 張隊伍表) (#17)"
```

---

## Task 7：api.ts AC-E1 — Sheets 配置正確時失敗不 fallback static

**Files:**
- Modify: `src/lib/api.ts`（fetchData 的 fallback 邏輯：當 `isSheetsConfigured() === true` 且 `SHEETS_RANGES[kind].length > 0` 時，Sheets 失敗 → 直接回 `source: 'error'`，不嘗試 static fallback；其他情境（placeholder / kind 無 transformer）維持走 static）
- Modify: `tests/integration/api-no-fallback.integration.test.ts`（既有 8 條 testcase，其中 3 條 RED → 改完 api.ts 後應全 GREEN；不需重寫 test，僅讀取確認）
- Modify: `tests/integration/api-fallback.integration.test.ts`（既有測試對 Sheets 配置正確 + Sheets 失敗 → fallback static 的 4 條 case 與新行為衝突，改成標 `@deprecated` 或刪除這 4 條：`schedule: Sheets 失敗 → fallback static`、`standings: Sheets 失敗 → fallback`、`roster: Sheets 失敗 → fallback`、`dragon: Sheets 失敗 → fallback`；保留「Sheets + JSON 都失敗 → error」與「placeholder → static」兩類 case 因不衝突）

## Style Rules（subagent 必讀，由 Step 0.5 注入）

### style-skeleton-loading（命中原因：本 task 修改 src/lib/api.ts 的 fetch 路徑，影響非同步資料載入回饋鏈路）

---
expertise: 非同步資料載入時的視覺回饋
triggers:
  - 頁面有非同步資料載入（fetch / useEffect / server action）
  - 同時發出 2 個以上 API 請求
  - 點擊 nav tab 後切換到新頁面
required_when_applicable: true
---

# 風格規則：骨架載入 + 即時導航

**核心原則：** 操作立刻有視覺回饋，等待期不留白。

**禁止的模式：**
- ❌ 整頁 spinner（`<LoadingState />` 擋住整個視口）
- ❌ 頁面空白等資料（沒有任何佔位）
- ❌ `mounted` 動畫 pattern — 用 `opacity-0` 隱藏內容直到 JS 執行完，讓使用者以為點擊沒反應

**正確做法（本 Issue 對應）：**
- 各頁面 *App.tsx 已採「方式二：元件內 skeleton state」（status === 'loading' → `<SkeletonState />`），本 task 不需新增 skeleton。
- 本 task 改變的是「Sheets 失敗時」的 final 狀態：從「假裝成功（fallback static 顯示舊資料）」改為「`<ErrorState />` 含重試按鈕」。
- ErrorState 已存在於 src/components/{home,roster,standings,schedule,boxscore}/ErrorState.tsx，本 task 不新增元件，只改 fetchData 行為讓 ErrorState 真正被觸發。
- 不允許改成「失敗後顯示空白」或「失敗後整頁 spinner」。

**Skeleton 設計原則（給後續 task 使用）：**
1. 形狀對應真實內容（卡片用卡片形狀，標題用長條）
2. padding/spacing 與真實頁面一致（避免 layout shift）
3. 動態用 `animate-pulse`
4. 色塊本身就是語言（不需要「讀取中...」文字）

- [ ] **Step 1：確認 RED 測試（已預先補寫）**

```bash
npx vitest run tests/integration/api-no-fallback.integration.test.ts
```
預期：3 個 case FAIL（standings HTTP 500、standings network throw、dragon HTTP 500），5 個 case PASS（含 placeholder/未設定情境的 static fallback）。

- [ ] **Step 2：實作 api.ts AC-E1 邏輯**

```typescript
// src/lib/api.ts — fetchData 改寫
export async function fetchData<T = unknown>(kind: DataKind): Promise<FetchResult<T>> {
  // 0. cache
  const cached = getCached<T>(kind);
  if (cached !== null) {
    return { data: cached, source: 'sheets' };
  }

  const sheetsConfigured = isSheetsConfigured();
  const hasSheetsPath = SHEETS_RANGES[kind].length > 0 && !!TRANSFORMERS[kind];

  // 1. Sheets path（配置正確 + kind 有 transformer）
  if (sheetsConfigured && hasSheetsPath) {
    try {
      const data = await fetchFromSheets<T>(kind);
      if (data !== null) {
        setCache(kind, data);
        return { data, source: 'sheets' };
      }
      // fetchFromSheets 回 null（不該發生）→ 視同 error，不 fallback
      return { data: null, source: 'error', error: 'Sheets returned null' };
    } catch (err) {
      // ⚠️ Issue #17 AC-E1：Sheets 配置正確但失敗 → 不 fallback，直接 error
      console.error(`[api] Sheets fetch failed for ${kind} (configured)`, err);
      return {
        data: null,
        source: 'error',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 2. Static fallback（合法情境：placeholder / 未設定 / kind 無 transformer）
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

- [ ] **Step 3：清理既有 api-fallback.integration.test.ts 的衝突 case**

刪除（或註記 `@deprecated Issue #17 AC-E1`）以下 4 個 case，保留其餘：
- `schedule: Sheets 失敗 → fallback static JSON（source: static）`
- `standings: Sheets 失敗 → fallback standings.json（source: static）`
- `roster: Sheets 失敗 → fallback roster.json`
- `dragon: Sheets 失敗 → fallback dragon.json`

```typescript
// tests/integration/api-fallback.integration.test.ts — 在檔頭 docstring 補
/**
 * ⚠️ Issue #17 AC-E1 後行為改變：
 *   配置正確且 Sheets 失敗時，不再 fallback static，直接 source: 'error'。
 *   原本的「Sheets 失敗 → fallback static」4 條 case 已移除（行為改變）。
 *   保留：placeholder 情境 + 兩層都失敗情境。
 */
```

- [ ] **Step 4：確認測試通過**

```bash
npx vitest run tests/integration/
```
預期：
- `api-no-fallback.integration.test.ts` 全 GREEN（8/8）
- `api-fallback.integration.test.ts` 全 GREEN（移除衝突 case 後剩餘 case 通過）
- 其他 integration 不受影響

- [ ] **Step 5：Commit**

```bash
git add src/lib/api.ts tests/integration/api-no-fallback.integration.test.ts tests/integration/api-fallback.integration.test.ts
git commit -m "fix(api): Sheets configured + 失敗時不 fallback static (AC-E1) (#17)"
```

---

## Task 8：AC-X1 — 16 個 e2e spec 移除 mock pattern

**Files:**
- Modify: 以下 16 個 spec 移除 `page.route` / `mockXxxAPI` / `route.fulfill` / `import * from helpers/mock-api`
  - `tests/e2e/features/standings.spec.ts`（拆 200 行限制 → 改寫為 `tests/e2e/features/standings/standings-data.spec.ts`，原 standings.spec.ts 刪除）
  - `tests/e2e/features/standings/standings-matrix.spec.ts`
  - `tests/e2e/features/data-fallback.spec.ts`（重寫為對 prod 的 ErrorState 驗證，或標註為 integration scope 移除）
  - `tests/e2e/features/roster/dragon-tab.spec.ts`
  - `tests/e2e/features/roster/dragon-tab-grouping.spec.ts`
  - `tests/e2e/features/roster/hero-roster-tab.spec.ts`
  - `tests/e2e/features/home/home-hero-schedule.spec.ts`
  - `tests/e2e/features/home/home-leaders-dragon.spec.ts`
  - `tests/e2e/features/home/home-matchups.spec.ts`
  - `tests/e2e/features/home/home-rwd.spec.ts`
  - `tests/e2e/features/home/home-standings.spec.ts`
  - `tests/e2e/features/home/home-states.spec.ts`
  - `tests/e2e/features/schedule.spec.ts`（拆為 `tests/e2e/features/schedule/schedule-data.spec.ts`）
  - `tests/e2e/features/schedule/schedule-toggle.spec.ts`
  - `tests/e2e/features/boxscore/leaders.spec.ts`
  - `tests/e2e/features/boxscore/leaders-team.spec.ts`
  - `tests/e2e/features/boxscore/states.spec.ts`
  - `tests/e2e/features/boxscore/boxscore-tab/player-table.spec.ts`
  - `tests/e2e/regression/boxscore.regression.spec.ts`
- Keep: `tests/helpers/mock-api/*.ts`（7 檔保留，僅供 unit/integration 用，**禁止** import 進 e2e spec — 此規則由 e2e-guide.md 已約束）
- Modify: 各 spec 最上方 docstring 補對應 Coverage ID（E-1 ~ E-8b）

## Style Rules（subagent 必讀，由 Step 0.5 注入）

無命中（e2e spec 不涉及 fetch 邏輯撰寫；style-skeleton-loading trigger 落在 src/lib/api.ts，不在 e2e）。

- [ ] **Step 1：列出每個 spec 的 mock pattern 移除清單**

```bash
grep -rn 'page.route\|route.fulfill\|mockXxxAPI\|from .*mock-api' tests/e2e/ | sort -u
```
記錄每個檔案需移除的 import 與 hook。

- [ ] **Step 2：針對每個 spec 改寫**

對每個 spec 套用以下 transformation：
1. 移除所有 `import { mockXxxAPI } from '../../helpers/mock-api/...'`
2. 移除所有 `page.route(...)` 呼叫與其 callback
3. 移除所有 `await mockXxxAPI(page, ...)` 呼叫
4. 將原本 mock 提供的 fixture 期望值替換成「對 prod URL 跑真實 Sheets 鏈路後的 invariant」斷言：
   - 不寫死隊名 / 球員名（可能會變動）
   - 寫「6 隊都顯示」「至少 N 個球員」「table 有 thead + tbody」「matrix 6×6」這類結構性 invariant
5. 在 docstring 補 `@coverage E-X`（對應 Coverage Matrix）

範例（standings-data.spec.ts）：

```typescript
/**
 * E-1：standings 真實資料同步（Issue #17）
 *
 * @coverage E-1
 * @issue #17
 *
 * 不再 mock Sheets API；對 prod URL 跑真實鏈路：
 *  - hero 顯示 season/phase/currentWeek（非「第 季」/ undefined）
 *  - 表格 6 隊
 *  - 矩陣 6×6（對角 null）
 */
import { test, expect } from '@playwright/test';

test.describe('Standings — 真實資料同步', () => {
  test('hero 顯示真實 season + phase + currentWeek', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/standings`);
    const hero = page.getByTestId('standings-hero');
    await expect(hero).toBeVisible();
    await expect(hero).not.toContainText('第 季');
    await expect(hero).not.toContainText('undefined');
  });

  test('表格 6 隊', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/standings`);
    await expect(page.getByTestId('standings-row')).toHaveCount(6);
  });

  test('矩陣 6×6 + 對角線為空', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/standings`);
    const matrix = page.getByTestId('standings-matrix');
    await expect(matrix).toBeVisible();
    // ...具體 selector 由 qa-e2e 階段執行時驗
  });
});
```

- [ ] **Step 3：刪除原 standings.spec.ts / schedule.spec.ts（已被 standings-data.spec.ts / schedule-data.spec.ts 取代）**

```bash
rm tests/e2e/features/standings.spec.ts tests/e2e/features/schedule.spec.ts
# 或：留空殼檔僅含一行 `// moved to standings/standings-data.spec.ts`
```

- [ ] **Step 4：跑一次 grep 確認無殘留 mock pattern**

```bash
grep -rn 'page.route\|route.fulfill\|mockXxxAPI\|from.*mock-api' tests/e2e/
```
預期：無輸出（exit 1）。

- [ ] **Step 5：Commit**

```bash
git add tests/e2e/
git commit -m "test(e2e): remove mock pattern from 16 specs, switch to prod URL real chain (#17 AC-X1)"
```

注意：Task 8 不執行 Playwright（Phase 6 的 qa-e2e 才執行）；本 task 只改寫 spec 內容，spec 是否能對 prod 通過由 Phase 6 驗收。

---

## Task 9：AC-X2 — public/data/dragon.json 重複 rulesLink 鍵

**Files:**
- Modify: `public/data/dragon.json`（line 6 `"rulesLink": "https://example.com/rules"` 刪除；line 46 真實 Notion URL 保留）
- Modify: `tests/fixtures/dragon.ts`（同步把 mockFullDragonboard / mockDragonWithRulesLink / mockDragonGroupingShowcase 的 `rulesLink: 'https://example.com/rules'` 改為實際 Notion URL，或刪除 fixture 內 example.com 註記為「測試專用」）

## Style Rules（subagent 必讀，由 Step 0.5 注入）

無命中（純 JSON / fixture 修正）。

- [ ] **Step 1：寫失敗測試（驗 dragon.json 解析後 rulesLink 唯一）**

```typescript
// tests/unit/data-files.test.ts — 新增（若不存在）
import { describe, it, expect } from 'vitest';
import dragonJson from '../../public/data/dragon.json';

describe('public/data/dragon.json schema (Issue #17 AC-X2)', () => {
  it('rulesLink 為合法 Notion URL（非 example.com）', () => {
    expect(typeof (dragonJson as { rulesLink?: string }).rulesLink).toBe('string');
    expect((dragonJson as { rulesLink: string }).rulesLink).not.toContain('example.com');
    expect((dragonJson as { rulesLink: string }).rulesLink).toContain('notion.');
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npx vitest run tests/unit/data-files.test.ts
```
預期：FAIL（line 6 的 example.com 為 JSON parse 後保留的最後值）— 等等，JSON 重複鍵語意未定，多數 parser 取最後一個（即 Notion URL），所以本測試可能初始就 PASS。**真正驗的是 JSON 不該有重複鍵**，改寫測試：

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('public/data/dragon.json schema (Issue #17 AC-X2)', () => {
  it('檔案內 "rulesLink" 鍵僅出現一次', () => {
    const raw = readFileSync(new URL('../../public/data/dragon.json', import.meta.url), 'utf8');
    const matches = raw.match(/"rulesLink"\s*:/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('rulesLink 指向合法 Notion URL', () => {
    const raw = readFileSync(new URL('../../public/data/dragon.json', import.meta.url), 'utf8');
    const match = raw.match(/"rulesLink"\s*:\s*"([^"]+)"/);
    expect(match?.[1]).toContain('notion.');
    expect(match?.[1]).not.toContain('example.com');
  });
});
```

- [ ] **Step 3：刪除 line 6 的 example.com rulesLink**

開啟 `public/data/dragon.json`，刪除第 6 行 `"rulesLink": "https://example.com/rules",`（保留 line 46 真實 Notion URL）。

- [ ] **Step 4：確認測試通過**

```bash
npx vitest run tests/unit/data-files.test.ts
```
預期：PASS。

- [ ] **Step 5：Commit**

```bash
git add public/data/dragon.json tests/unit/data-files.test.ts
git commit -m "fix(data): dragon.json 移除重複 rulesLink 鍵 (#17 AC-X2)"
```

---

## E2E 業務測試案例（Phase 6 由 qa-e2e 對 prod URL 執行）

> 細節 Playwright 操作不寫；以下為業務行為清單。spec_path / describe_block 由 pm-v2 Phase 1.4 從 Coverage Matrix 抽出 dispatch 給 qa-e2e。

| E-ID | spec_path | describe_block | 業務行為 |
|------|-----------|----------------|----------|
| E-1 | tests/e2e/features/standings/standings-data.spec.ts | Standings — 真實資料同步 | 戰績榜整頁可見 + 6 隊 row + 6×6 矩陣 + hero 顯示真實 season/phase/currentWeek（非「第 季」/ undefined）|
| E-2 | tests/e2e/features/roster/dragon-tab.spec.ts | Dragon Hero — 真實 season | 龍虎榜 tab hero 顯示真實 season + phase（非空白） |
| E-3 | tests/e2e/features/roster/dragon-tab-grouping.spec.ts | Dragon Grouping — threshold 與分組一致 | 平民區 group title 中的 N 等於該區實際渲染人數；奴隸區從第 N+1 名起 |
| E-4 | tests/e2e/features/roster/hero-roster-tab.spec.ts | Roster Hero — 真實 season + phase | 球員名單 hero 顯示真實 season + phase（非「第 季」/ undefined） |
| E-5 | tests/e2e/features/home/home-hero-schedule.spec.ts | Home Hero — 真實 currentWeek + phase | 首頁 hero 顯示真實當週 + phase（非 W3 例行賽範例） |
| E-6a | tests/e2e/features/home/home-standings.spec.ts | Home miniStandings — 真實戰績 | 首頁 miniStandings 區塊顯示真實 6 隊戰績 |
| E-6b | tests/e2e/features/home/home-leaders-dragon.spec.ts | Home miniLeaders + miniDragon — 真實資料 | 首頁顯示真實 PTS/REB/AST 領先者 + 龍虎榜 top 10 |
| E-6c | tests/e2e/features/home/home-matchups.spec.ts | Home Matchups — 真實當週 | 首頁顯示真實當週對戰（非範例） |
| E-7 | tests/e2e/features/schedule/schedule-data.spec.ts | Schedule — 真實 weeks | 賽程頁 weeks[] 顯示真實對戰；當前週預設展開 |
| E-8a | tests/e2e/features/boxscore/leaders.spec.ts | Leaders 個人類別 — 真實資料 | 領先榜 11 類個人表顯示真實資料 |
| E-8b | tests/e2e/features/boxscore/leaders-team.spec.ts | Leaders 隊伍三表 — 真實資料 | 領先榜 offense / defense / net 三表顯示真實 6 隊 |

執行指令（由 qa-e2e 處理）：對 prod URL `https://waterfat.github.io/taan-basketball-league/` 跑 Playwright；regression/ 全跑 + features/ 上述 spec 跑。

UAT URL 解析：本專案無 uat 環境，qa-e2e 對 prod 執行為合法例外（已寫 environments.yml）。

---

## OPS 部署驗收 Test Case 清單（Phase 5 由 ops-v2 使用）

部署後（gh-pages 推上去）跑：

1. **CI build 成功 + GitHub Actions workflow `Deploy to GitHub Pages` 綠燈**
   - 驗 `gh run list --branch main --limit 1` 最新一筆 `success`
2. **`./scripts/e2e-test.sh https://waterfat.github.io/taan-basketball-league/` 通過**
   - CLAUDE.md 規定的部署後驗收
3. **HTTP 200 對 prod 的 6 個關鍵 URL**
   - `/`、`/standings`、`/roster`、`/roster?tab=dragon`、`/schedule`、`/boxscore?tab=leaders`
4. **dragon.json 在 prod 可取得且無重複 rulesLink 鍵**
   - `curl -s https://waterfat.github.io/taan-basketball-league/data/dragon.json | grep -c '"rulesLink"'` → 必須等於 `1`
5. **`PUBLIC_SHEET_ID` / `PUBLIC_SHEETS_API_KEY` 已注入 GitHub Actions secret**（既有，Issue #13/#14 確立；Task 7 後若 Sheets 配置失效，prod 會顯示 ErrorState 而非 W3 範例 — 需 ops 確認 secret 仍有效）

---

## 自我審查（Step 6）

1. **Spec 覆蓋**：每個 AC 都對應到 task ✅
   - AC-1（戰績榜空白）→ Task 1
   - AC-2（dragon hero「第 季」）→ Task 2
   - AC-3（前 36 名分組不一致）→ Task 2（threshold + DragonTabPanel）
   - AC-4（roster hero「第 季」/ undefined）→ Task 3 + 註解 RosterData 型別不擴 season
   - AC-5（首頁 W3 範例）→ Task 4
   - AC-6（賽程 W3 範例）→ Task 5
   - AC-7（領先榜範例）→ Task 6
   - AC-E1（Sheets 失敗應 ErrorState）→ Task 7
   - AC-E2（賽季初空狀態）→ U-3 已預先補寫的 error-empty-states.test.ts 涵蓋
   - AC-X1（16 e2e spec mock cleanup）→ Task 8
   - AC-X2（dragon.json 重複 rulesLink）→ Task 9

2. **佔位符掃描**：無 TBD / TODO / "Similar to Task N" / "implement later" ✅

3. **測試約束**：
   - 整合測試連 `globalThis.fetch` mock 而非真實 Google Sheets — Task 1/4/6 的 integration 透過 `vi.fn` mock fetch 邊界（外部 API），但驗的是 fetchData 的實際回傳值、source 欄位、解析後資料 shape，不是「assert_called」。**符合「mock 邊界不 mock 內部邏輯」**。
   - 無 unit test 可在空函式實作下通過（每個 test 都驗 transformer 實際輸出值）✅
   - 無依賴 dev server 的 integration test（皆 `vi.stubEnv` + `vi.fn` mock fetch）✅

4. **型別一致性**：
   - StandingsData / DragonData / HomeData / ScheduleData / RosterData / LeaderData 與 src/types/ 既有定義對齊 ✅
   - LeaderData 是 `Record<string, LeaderSeason>`（season key 為 `'25'`）— Task 6 已對齊 ✅
   - RosterData 不含 season/phase（型別檔已定）— Task 3 不擴型別 ✅
   - DragonData.civilianThreshold 仍為 number — Task 2 從 Sheets cell 取 ✅
