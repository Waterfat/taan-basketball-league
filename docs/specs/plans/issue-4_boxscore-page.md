# Issue #4 /boxscore 數據頁實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實作 `/boxscore` 5-tab 結構的「數據」分頁，包含「逐場 Box」+「領先榜」兩個 sub-tab、deep link、三狀態獨立限縮、RWD。

**Architecture:**
頁面為 React island wrapper（`/boxscore.astro` mount `BoxscoreApp client:load`）。`BoxscoreApp` 為 sub-tab 控制器（state machine + URL sync），其下分 `BoxscorePanel`（直打 Google Sheets API → `transformBoxscore` 解析）與 `LeadersPanel`（透過 `fetchData('stats')` 取 GAS handleStats）。狀態機沿用 Issue #1 ScheduleApp pattern，但每個 sub-tab 獨立持有 `loading/error/empty/ok` 狀態，互不影響。

**Tech Stack:** Astro 6 / React 19 island（`client:load`）/ Tailwind 4 / TypeScript strict / Vitest（unit + integration）/ Playwright（E2E，已由 qa-v2 產出）。

**個人風格規則**：命中 2 條 — style-skeleton-loading, style-rwd-list（mobile boxscore 因 Issue 規格優先採橫向捲動，leaders 仍遵循垂直堆疊；下方 Style Rules section 詳述）

**Code Graph**：圖未建立，跳過

---

## Coverage Matrix（從 docs/delivery/issue-4_qaplan.md 完整載入）

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| U-1 | transformBoxscore 22 行偏移 | Task 1 Step 1 | unit `tests/unit/boxscore-utils.test.ts` |
| U-2 | totals 計算（排除 DNP） | Task 1 Step 1 | unit `tests/unit/boxscore-utils.test.ts` |
| U-3 | URL query parse helper | Task 3 Step 1 | unit `tests/unit/boxscore-deep-link.test.ts` |
| U-4 | URL update helper | Task 3 Step 1 | unit `tests/unit/boxscore-deep-link.test.ts` |
| U-5 | 預設 tab 解析（query → leaders/boxscore） | Task 3 Step 1 | unit `tests/unit/boxscore-deep-link.test.ts` |
| U-6 | leaders 進階指標格式化 | Task 5 Step 1 | unit `tests/unit/leaders-format.test.ts` |
| I-1 | transformBoxscore 解析單場 | Task 1（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-2 | 多場合併解析 | Task 1（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-3 | DNP 標記 + 不計入合計 | Task 1（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-4 | 空 rows → 空 weeks | Task 1（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-5 | fetchBoxscore 成功 | Task 2（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-6 | Sheets API 500 → error | Task 2（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-7 | 網路錯誤 → error | Task 2（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-8 | fetchData('stats') 成功 | Task 5（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-9 | fetchData('stats') 全失敗 | Task 5（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| I-10 | leaders 空資料仍非 error | Task 5（既存）| integration `tests/integration/boxscore-parse.integration.test.ts` |
| E-1 | Hero「DATA · 第 25 季」 | — | `tests/e2e/features/boxscore.spec.ts` › Hero |
| E-2 | 副標依 tab 動態 | — | `tests/e2e/features/boxscore.spec.ts` › Hero AC-1b |
| E-3 | 無 query → leaders | — | `tests/e2e/features/boxscore.spec.ts` › Sub-tab + Deep Link |
| E-4 | ?tab=leaders → leaders | — | `tests/e2e/features/boxscore.spec.ts` › Sub-tab + Deep Link |
| E-5 | ?tab=boxscore → boxscore | — | `tests/e2e/features/boxscore.spec.ts` › Sub-tab + Deep Link |
| E-6 | 切換 tab → URL + reload | — | `tests/e2e/features/boxscore.spec.ts` › Sub-tab + Deep Link |
| E-7 | deep link week+game → highlight | — | `tests/e2e/features/boxscore.spec.ts` › Sub-tab + Deep Link |
| E-8 | 切回 leaders → 移除 query | — | `tests/e2e/features/boxscore.spec.ts` › Sub-tab + Deep Link |
| E-9 | chip 顯示 + 預設當前週 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-10 | 點 chip → 6 場 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-11 | 標題 + 雙隊表格 + staff 摺疊 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-12 | staff toggle 展開/收起 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-13 | 球員表格 11 欄 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-14 | 合計 row 顯示 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-15 | DNP 視覺處理 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-16 | 球員不可點 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-17 | DNP 不計入合計 | — | `tests/e2e/features/boxscore.spec.ts` › Boxscore tab content |
| E-18 | 6 類別卡片 | — | `tests/e2e/features/boxscore.spec.ts` › Leaders tab content |
| E-19 | 每類 top 10 | — | `tests/e2e/features/boxscore.spec.ts` › Leaders tab content |
| E-20 | rank/名/隊色點/值 | — | `tests/e2e/features/boxscore.spec.ts` › Leaders tab content |
| E-21 | scoring 進階指標 | — | `tests/e2e/features/boxscore.spec.ts` › Leaders tab content |
| E-22 | rebound 進階指標 | — | `tests/e2e/features/boxscore.spec.ts` › Leaders tab content |
| E-23 | skeleton 載入 | — | `tests/e2e/features/boxscore.spec.ts` › Three-state |
| E-24 | boxscore Sheets 失敗限縮 | — | `tests/e2e/features/boxscore.spec.ts` › Three-state |
| E-25 | 失敗時 leaders 仍正常 | — | `tests/e2e/features/boxscore.spec.ts` › Three-state |
| E-26 | leaders 失敗限縮 | — | `tests/e2e/features/boxscore.spec.ts` › Three-state |
| E-27 | leaders 重試 | — | `tests/e2e/features/boxscore.spec.ts` › Three-state |
| E-28 | 該週 boxscore 空 | — | `tests/e2e/features/boxscore.spec.ts` › Three-state |
| E-29 | leaders 全空 | — | `tests/e2e/features/boxscore.spec.ts` › Three-state |
| E-30 | leaders 部分空 | — | `tests/e2e/features/boxscore.spec.ts` › Three-state |
| E-31 | 桌機 RWD | — | `tests/e2e/features/boxscore.spec.ts` › RWD |
| E-32 | 手機 RWD | — | `tests/e2e/features/boxscore.spec.ts` › RWD |
| R-1 | 頁面載入 + 預設 leaders | — | `tests/e2e/regression/boxscore.regression.spec.ts` |
| R-2 | 切換 tab + 切回 + 無錯誤 | — | `tests/e2e/regression/boxscore.regression.spec.ts` |
| R-3 | deep link from schedule | — | `tests/e2e/regression/boxscore.regression.spec.ts` |
| R-4 | 限縮 error | — | `tests/e2e/regression/boxscore.regression.spec.ts` |
| R-5 | leaders 全空 → empty | — | `tests/e2e/regression/boxscore.regression.spec.ts` |

說明：
- I-1~I-10 的 integration test 已由 qa-v2 Phase 1.2 寫好（紅燈中），Task 1/2/5 透過實作對應 src 模組讓它由紅轉綠（不再重寫測試）。
- U-1~U-6 的 unit test 在 qaplan 標記 ⬜（缺漏），由 Task 1 / 3 / 5 依 TDD 順序新增。
- E-1~E-32 + R-1~R-5 已存在 `tests/e2e/features/boxscore.spec.ts` + `tests/e2e/regression/boxscore.regression.spec.ts`（紅燈中），Phase 6 由 qa-v2 跑，Task 不需動。

---

## 檔案結構規劃（Step 2）

### 新增

| 路徑 | 職責 | 對應 Task |
|------|------|-----------|
| `src/types/boxscore.ts` | `BoxscoreData / BoxscoreWeek / BoxscoreGame / BoxscoreTeam / BoxscorePlayer / TeamId` 型別定義（與 fixture 同形）| Task 1 |
| `src/types/leaders.ts` | `LeaderData / LeaderSeason / LeaderEntry / LeaderCategory` 型別 | Task 5 |
| `src/lib/boxscore-utils.ts` | `transformBoxscore(rows: string[][]): BoxscoreWeek[]` + `computeTeamTotals(players)` | Task 1 |
| `src/lib/boxscore-api.ts` | `fetchBoxscore(): Promise<{ data, source: 'sheets' \| 'error', error? }>`（直打 Sheets API + 解析）| Task 2 |
| `src/lib/boxscore-deep-link.ts` | `parseBoxscoreQuery(search) / buildBoxscoreUrl(state) / resolveDefaultTab(query)` | Task 3 |
| `src/lib/leaders-format.ts` | `formatScoringAdvanced(entry) / formatReboundAdvanced(entry) / getCurrentSeasonKey(data)` | Task 5 |
| `src/components/boxscore/BoxscoreApp.tsx` | sub-tab 控制器（URL sync、state machine、popstate listener）| Task 6 |
| `src/components/boxscore/BoxscoreHero.tsx` | 上方 Hero header（title + 動態副標）| Task 7 |
| `src/components/boxscore/SubTabs.tsx` | 「逐場 Box / 領先榜」sub-tab 按鈕列 | Task 6 |
| `src/components/boxscore/BoxscorePanel.tsx` | 逐場 Box 面板（chip + 多場卡片 + 三狀態）| Task 4 |
| `src/components/boxscore/BoxscoreGameCard.tsx` | 單場卡片（標題 + 雙隊表格 + staff toggle）| Task 4 |
| `src/components/boxscore/BoxscoreTeamTable.tsx` | 單隊 11 欄表格 + 合計 row + DNP 樣式 | Task 4 |
| `src/components/boxscore/BoxscoreSkeleton.tsx` | boxscore 區塊 skeleton（chip + 6 卡片骨架）| Task 4 |
| `src/components/boxscore/BoxscoreError.tsx` | boxscore 區塊錯誤 + 重試按鈕 | Task 4 |
| `src/components/boxscore/BoxscoreEmpty.tsx` | boxscore 區塊空狀態（該週無 Box Score）| Task 4 |
| `src/components/boxscore/LeadersPanel.tsx` | 領先榜面板（6 類別卡片 + 三狀態）| Task 5 |
| `src/components/boxscore/LeaderCard.tsx` | 單類別卡片（title + top 10 rows + 進階指標）| Task 5 |
| `src/components/boxscore/LeadersSkeleton.tsx` | leaders 區塊 skeleton（6 卡片骨架）| Task 5 |
| `src/components/boxscore/LeadersError.tsx` | leaders 區塊錯誤 + 重試按鈕 | Task 5 |
| `src/components/boxscore/LeadersEmpty.tsx` | leaders 區塊空狀態（賽季初無資料）| Task 5 |
| `tests/unit/boxscore-utils.test.ts` | U-1, U-2 業務邏輯 unit | Task 1 |
| `tests/unit/boxscore-deep-link.test.ts` | U-3, U-4, U-5 業務邏輯 unit | Task 3 |
| `tests/unit/leaders-format.test.ts` | U-6 業務邏輯 unit | Task 5 |

### 修改

| 路徑 | 修改內容 | 對應 Task |
|------|---------|-----------|
| `src/pages/boxscore.astro` | 改為 `<BoxscoreApp client:load baseUrl={baseUrl} />` wrapper（移除「規劃中」placeholder）| Task 7 |
| `.env.example` | 新增 `PUBLIC_SHEETS_API_KEY` + `PUBLIC_SHEET_ID` 範例與註解 | Task 8 |

### 不動

- `src/lib/api.ts`（leaders 直接用既有 `fetchData('stats')`）
- `src/config/teams.ts`（隊伍配色直接套用 `TEAM_CONFIG` / `getTeam`）
- `tests/fixtures/boxscore.ts`、`tests/fixtures/leaders.ts`、`tests/helpers/mock-api.ts`（qa-v2 Phase 1.2 產出，型別與 src/types 對齊）
- `tests/integration/boxscore-parse.integration.test.ts`（qa-v2 Phase 1.2 產出，由 Task 1/2/5 由紅轉綠）
- `tests/e2e/features/boxscore.spec.ts`、`tests/e2e/regression/boxscore.regression.spec.ts`（qa-v2 Phase 1.2 產出，Phase 6 跑）

### Task 相依圖

```
Task 1 (types/boxscore + boxscore-utils + U-1, U-2)
  ↓
Task 2 (boxscore-api，依賴 Task 1 的 transformBoxscore + types)
  ↓
Task 4 (BoxscorePanel + 子元件，依賴 Task 1 types)
  ↓
Task 6 (BoxscoreApp 整合，依賴 Task 3 / Task 4)
  ↓
Task 7 (boxscore.astro 頁面 + Hero，依賴 Task 6)

Task 3 (boxscore-deep-link + U-3, U-4, U-5) 並行於 Task 1/2/4 之後，與 Task 4 並行
Task 5 (leaders types + format + LeadersPanel + 子元件 + U-6) 完全並行於 Task 1~4
Task 8 (.env.example) 完全獨立並行（除 Task 2 需要在 boxscore-api 讀環境變數）
```

並行群組：
- 群組 A（並行）：Task 1、Task 5、Task 8
- 群組 B（並行，等 A 中對應依賴）：Task 2（等 Task 1）、Task 3（無依賴，可在 A 並行）、Task 4（等 Task 1）
- 群組 C（序列）：Task 6（等 Task 3 + Task 4 + Task 5）→ Task 7（等 Task 6）

實際 subagent 派送建議：A 三個並行 → 完成後 B 三個並行 → 完成後 Task 6 → Task 7。

---

## Style Rules（subagent 必讀）

### style-skeleton-loading（命中：BoxscoreApp / BoxscorePanel / LeadersPanel 同頁同時 fetch 兩支 API）

**核心原則：** 操作立刻有視覺回饋，等待期不留白。

**禁止：**
- 整頁 spinner（`<LoadingState />` 擋住整個視口）
- 頁面空白等資料（沒有任何佔位）
- `mounted` 動畫 pattern（用 `opacity-0` 隱藏內容直到 JS 執行完）

**本 Issue 套用方式：**
- `BoxscoreApp` 在 React 掛載前由 Astro 已產出靜態 Hero + Sub-tab 殼（`<noscript>` 友善 + Hero 立即顯示）
- `BoxscoreSkeleton`：1 個 chip timeline 骨架（8 個 chip 形狀色塊）+ 2 個球場卡片骨架（標題 + 兩塊表格區的色塊）
- `LeadersSkeleton`：6 個卡片骨架（標題 + 10 行短條），桌機兩欄並排，手機單欄
- 兩個 sub-tab 各自獨立 skeleton，不會有「整頁等到兩個 API 都好」的情況；切換 tab 立刻顯示對應 panel 的 skeleton
- 一律 `animate-pulse` + `bg-gray-200`（沿用 Issue #1 ScheduleApp/SkeletonState 寫法）

### style-rwd-list（命中：boxscore 11 欄 + leaders top 10）

**規則：**
- PC（≥md）：標準橫排 table 展開所有欄位
- Mobile（<md）：改為 card 呈現

**本 Issue 套用方式：**
- **Leaders Panel（完全遵循）**：桌機 `md:grid-cols-2` 兩欄並排卡片；手機 `grid-cols-1` 單欄堆疊卡片，每張卡片標題 = 類別名（得分王/籃板王...）+ 內容 = top 10 「rank · 名字 · 隊色點 · 數值（+ 進階指標）」
- **Boxscore Panel（規格優先覆寫）**：Issue #4 AC-16 明確規定「手機 <768 → boxscore 表格橫向捲動（保留 11 欄）」，因為球員數據對照需要保留 column 結構（合計 row 對齊、DNP 行視覺對齊）。實作改為 `<div class="overflow-x-auto -mx-4 px-4">` 包 11 欄 table；手機 scrollbar 用 `scrollbar-thin` Tailwind class（已於 Issue #1 註冊）+ `pb-1` 預留空間。**這是 Issue 規格覆寫風格規則，而非違反**。

---

## Task 1：型別 + transformBoxscore + computeTeamTotals + Unit Tests

**Files:**
- Create: `src/types/boxscore.ts`
- Create: `src/lib/boxscore-utils.ts`
- Test: `tests/unit/boxscore-utils.test.ts`
- Test (existing, turn red→green): `tests/integration/boxscore-parse.integration.test.ts` (cases I-1~I-4)

### Style Rules（本 task 涉及的檔案）
無（純型別 + 解析邏輯，不涉及 UI）

- [ ] **Step 1：寫失敗測試（TDD）— Unit U-1, U-2**

```typescript
// tests/unit/boxscore-utils.test.ts
import { describe, it, expect } from 'vitest';
import { transformBoxscore, computeTeamTotals } from '../../src/lib/boxscore-utils';
import {
  mockBoxscorePlayer,
  mockDnpPlayer,
  mockBoxscoreGame,
  mockBoxscoreWeek,
  mockRawBoxscoreSheetsResponse,
} from '../fixtures/boxscore';

describe('transformBoxscore', () => {
  // Covers: U-1
  it('U-1a: 22 行/場偏移正確（單場）→ 解析出 home/away 雙隊', () => {
    const game = mockBoxscoreGame(5, 1, { homeTeam: '紅', awayTeam: '白', homeScore: 34, awayScore: 22 });
    const raw = mockRawBoxscoreSheetsResponse([game]);

    const weeks = transformBoxscore(raw.values);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].week).toBe(5);
    expect(weeks[0].games).toHaveLength(1);
    expect(weeks[0].games[0].home.team).toBe('紅');
    expect(weeks[0].games[0].away.team).toBe('白');
    expect(weeks[0].games[0].home.score).toBe(34);
    expect(weeks[0].games[0].away.score).toBe(22);
  });

  // Covers: U-1
  it('U-1b: 多場（同週 6 場）依 22 行 chunking 解析全部', () => {
    const week = mockBoxscoreWeek(5);
    const raw = mockRawBoxscoreSheetsResponse(week.games);

    const weeks = transformBoxscore(raw.values);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].games).toHaveLength(6);
    expect(weeks[0].games.map((g) => g.game).sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  // Covers: U-1
  it('U-1c: 跨週合併（W1 + W5 兩週）→ 依 week 分組', () => {
    const w1 = mockBoxscoreWeek(1);
    const w5 = mockBoxscoreWeek(5);
    const raw = mockRawBoxscoreSheetsResponse([...w1.games, ...w5.games]);

    const weeks = transformBoxscore(raw.values);
    expect(weeks).toHaveLength(2);
    const found1 = weeks.find((w) => w.week === 1);
    const found5 = weeks.find((w) => w.week === 5);
    expect(found1?.games).toHaveLength(6);
    expect(found5?.games).toHaveLength(6);
  });

  // Covers: U-1
  it('U-1d: 空列陣 → 空 weeks', () => {
    expect(transformBoxscore([])).toEqual([]);
  });

  // Covers: U-1
  it('U-1e: 不足 22 行的尾段（殘缺）→ 略過不報錯', () => {
    const game = mockBoxscoreGame(1, 1);
    const raw = mockRawBoxscoreSheetsResponse([game]);
    const truncated = raw.values.slice(0, 10); // 半場資料
    expect(() => transformBoxscore(truncated)).not.toThrow();
    expect(transformBoxscore(truncated)).toEqual([]);
  });
});

describe('computeTeamTotals', () => {
  // Covers: U-2
  it('U-2a: 純出賽球員 → 加總所有欄位', () => {
    const players = [
      mockBoxscorePlayer('A', { pts: 10, ast: 3, treb: 5 }),
      mockBoxscorePlayer('B', { pts: 8, ast: 2, treb: 4 }),
    ];
    const totals = computeTeamTotals(players);
    expect(totals.pts).toBe(18);
    expect(totals.ast).toBe(5);
    expect(totals.treb).toBe(9);
  });

  // Covers: U-2
  it('U-2b: 含 DNP 球員 → DNP 不計入合計', () => {
    const players = [
      mockBoxscorePlayer('A', { pts: 10 }),
      mockDnpPlayer('B'), // pts:0 dnp:true
      mockBoxscorePlayer('C', { pts: 5 }),
    ];
    const totals = computeTeamTotals(players);
    expect(totals.pts).toBe(15);
  });

  // Covers: U-2
  it('U-2c: 全 DNP → 合計全 0', () => {
    const players = [mockDnpPlayer('A'), mockDnpPlayer('B')];
    const totals = computeTeamTotals(players);
    expect(totals.pts).toBe(0);
    expect(totals.fg2).toBe(0);
    expect(totals.fg3).toBe(0);
    expect(totals.ast).toBe(0);
  });

  // Covers: U-2
  it('U-2d: 空陣列 → 全 0 totals', () => {
    const totals = computeTeamTotals([]);
    expect(totals.pts).toBe(0);
    expect(totals.treb).toBe(0);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test -- tests/unit/boxscore-utils.test.ts tests/integration/boxscore-parse.integration.test.ts
```
預期：FAIL — `Cannot find module '../../src/lib/boxscore-utils'`

- [ ] **Step 3：實作型別**

```typescript
// src/types/boxscore.ts
export type TeamId = '紅' | '黑' | '藍' | '綠' | '黃' | '白';

export interface BoxscorePlayer {
  name: string;
  pts: number;
  fg2: number;
  fg3: number;
  ft: number;
  oreb: number;
  dreb: number;
  treb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  /** true = 未出賽（DNP），totals 計算時排除 */
  dnp: boolean;
}

export type BoxscoreTotals = Omit<BoxscorePlayer, 'name' | 'dnp'>;

export interface BoxscoreTeam {
  team: TeamId;
  score: number;
  players: BoxscorePlayer[];
  totals: BoxscoreTotals;
}

export interface BoxscoreGame {
  week: number;
  game: number;
  home: BoxscoreTeam;
  away: BoxscoreTeam;
  staff: Record<string, string[]>;
}

export interface BoxscoreWeek {
  week: number;
  games: BoxscoreGame[];
}

export interface BoxscoreData {
  season: number;
  currentWeek: number;
  weeks: BoxscoreWeek[];
}
```

- [ ] **Step 4：實作 boxscore-utils**

```typescript
// src/lib/boxscore-utils.ts
import type {
  BoxscorePlayer,
  BoxscoreTotals,
  BoxscoreTeam,
  BoxscoreGame,
  BoxscoreWeek,
  TeamId,
} from '../types/boxscore';

const TEAM_IDS: TeamId[] = ['紅', '黑', '藍', '綠', '黃', '白'];
const ROWS_PER_GAME = 22;

function isTeamId(value: string): value is TeamId {
  return (TEAM_IDS as string[]).includes(value);
}

function toNum(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parsePlayerRow(row: string[]): BoxscorePlayer | null {
  const name = (row[0] ?? '').trim();
  if (!name) return null;
  if (name === '合計') return null;

  // DNP：名字存在但完全沒上場（所有數值為 0 或空）
  const cells = row.slice(1, 13);
  const allEmpty = cells.every((c) => !c || c.trim() === '' || c.trim() === '0');
  const dnp = allEmpty;

  return {
    name,
    pts: toNum(row[1]),
    fg2: toNum(row[2]),
    fg3: toNum(row[3]),
    ft: toNum(row[4]),
    oreb: toNum(row[5]),
    dreb: toNum(row[6]),
    treb: toNum(row[7]),
    ast: toNum(row[8]),
    stl: toNum(row[9]),
    blk: toNum(row[10]),
    tov: toNum(row[11]),
    pf: toNum(row[12]),
    dnp,
  };
}

/**
 * 排除 DNP 球員後加總
 * Covers U-2 / I-3 / B-12
 */
export function computeTeamTotals(players: BoxscorePlayer[]): BoxscoreTotals {
  const active = players.filter((p) => !p.dnp);
  const sum = (key: keyof BoxscoreTotals): number =>
    active.reduce((acc, p) => acc + (p[key] as number), 0);
  return {
    pts: sum('pts'),
    fg2: sum('fg2'),
    fg3: sum('fg3'),
    ft: sum('ft'),
    oreb: sum('oreb'),
    dreb: sum('dreb'),
    treb: sum('treb'),
    ast: sum('ast'),
    stl: sum('stl'),
    blk: sum('blk'),
    tov: sum('tov'),
    pf: sum('pf'),
  };
}

function parseTitleRow(row: string[]): { week: number; game: number; homeTeam: TeamId; homeScore: number; awayScore: number; awayTeam: TeamId } | null {
  const titleCell = (row[0] ?? '').trim(); // 例：「第5週 第1場」
  const m = titleCell.match(/第(\d+)週\s*第(\d+)場/);
  if (!m) return null;
  const week = Number(m[1]);
  const game = Number(m[2]);

  const homeTeamCell = (row[1] ?? '').trim();
  const awayTeamCell = (row[5] ?? '').trim();
  if (!isTeamId(homeTeamCell) || !isTeamId(awayTeamCell)) return null;

  return {
    week,
    game,
    homeTeam: homeTeamCell,
    homeScore: toNum(row[2]),
    awayScore: toNum(row[4]),
    awayTeam: awayTeamCell,
  };
}

function parseStaffRow(row: string[]): Record<string, string[]> {
  const text = (row[0] ?? '').trim();
  if (!text) return {};
  const result: Record<string, string[]> = {};
  for (const part of text.split('|')) {
    const m = part.match(/^\s*([^:：]+)[:：]\s*(.+)\s*$/);
    if (!m) continue;
    const role = m[1].trim();
    const names = m[2].split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
    if (names.length > 0) result[role] = names;
  }
  return result;
}

function parseGameChunk(rows: string[][]): BoxscoreGame | null {
  if (rows.length < ROWS_PER_GAME) return null;

  const title = parseTitleRow(rows[0]);
  if (!title) return null;

  // Home: rows[2..9]（8 列球員）
  const homePlayers: BoxscorePlayer[] = [];
  for (let i = 2; i <= 9; i++) {
    const p = parsePlayerRow(rows[i]);
    if (p) homePlayers.push(p);
  }

  // Away: rows[12..19]
  const awayPlayers: BoxscorePlayer[] = [];
  for (let i = 12; i <= 19; i++) {
    const p = parsePlayerRow(rows[i]);
    if (p) awayPlayers.push(p);
  }

  const home: BoxscoreTeam = {
    team: title.homeTeam,
    score: title.homeScore,
    players: homePlayers,
    totals: computeTeamTotals(homePlayers),
  };
  const away: BoxscoreTeam = {
    team: title.awayTeam,
    score: title.awayScore,
    players: awayPlayers,
    totals: computeTeamTotals(awayPlayers),
  };

  return {
    week: title.week,
    game: title.game,
    home,
    away,
    staff: parseStaffRow(rows[21]),
  };
}

/**
 * 從 Sheets API values（22 行/場）解析回 BoxscoreWeek[]
 * 沿用舊專案 js/page-boxscore.js 邏輯
 *
 * Covers U-1, I-1~I-4
 */
export function transformBoxscore(rows: string[][]): BoxscoreWeek[] {
  if (!Array.isArray(rows) || rows.length < ROWS_PER_GAME) return [];

  const weekMap = new Map<number, BoxscoreGame[]>();

  for (let i = 0; i + ROWS_PER_GAME <= rows.length; i += ROWS_PER_GAME) {
    const chunk = rows.slice(i, i + ROWS_PER_GAME);
    const game = parseGameChunk(chunk);
    if (!game) continue;
    const list = weekMap.get(game.week) ?? [];
    list.push(game);
    weekMap.set(game.week, list);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, games]) => ({
      week,
      games: games.sort((a, b) => a.game - b.game),
    }));
}
```

- [ ] **Step 5：確認測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test -- tests/unit/boxscore-utils.test.ts tests/integration/boxscore-parse.integration.test.ts
```
預期：unit 9 個 PASS、integration I-1~I-4 PASS（I-5~I-10 仍紅，下個 task 處理）

- [ ] **Step 6：Commit**

```bash
git add src/types/boxscore.ts src/lib/boxscore-utils.ts tests/unit/boxscore-utils.test.ts
git commit -m "feat(boxscore): add types + transformBoxscore parsing utility (Issue #4 Task 1)"
```

---

## Task 2：fetchBoxscore（直打 Google Sheets API）

**Files:**
- Create: `src/lib/boxscore-api.ts`
- Test (existing, turn red→green): `tests/integration/boxscore-parse.integration.test.ts` (cases I-5, I-6, I-7)

### Style Rules（本 task 涉及的檔案）
無（純資料層 fetcher）

- [ ] **Step 1：確認既有 integration 測試是紅燈**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test -- tests/integration/boxscore-parse.integration.test.ts -t "fetchBoxscore"
```
預期：FAIL — `Cannot find module '../../src/lib/boxscore-api'`

> 說明：I-5/I-6/I-7 已由 qa-v2 寫好，本 task 只需實作 `src/lib/boxscore-api.ts` 由紅轉綠。**不重寫測試**。

- [ ] **Step 2：實作 boxscore-api.ts**

```typescript
// src/lib/boxscore-api.ts
import type { BoxscoreData } from '../types/boxscore';
import { transformBoxscore } from './boxscore-utils';

const SHEET_ID = import.meta.env.PUBLIC_SHEET_ID as string | undefined;
const API_KEY = import.meta.env.PUBLIC_SHEETS_API_KEY as string | undefined;

/**
 * boxscore tab 的固定範圍（A1:AO1980 = 90 場 × 22 行 = 1980 列；41 欄）
 */
const RANGE = 'boxscore!A1:AO1980';

interface FetchResult {
  data: BoxscoreData | null;
  source: 'sheets' | 'error';
  error?: string;
}

/**
 * 直打 Google Sheets API（v4 values.get）取得 boxscore tab 原始資料，
 * 套 transformBoxscore 解析為結構化資料。
 *
 * Covers I-5, I-6, I-7
 */
export async function fetchBoxscore(): Promise<FetchResult> {
  if (!SHEET_ID || !API_KEY) {
    return {
      data: null,
      source: 'error',
      error: 'Missing PUBLIC_SHEET_ID or PUBLIC_SHEETS_API_KEY',
    };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(RANGE)}?key=${encodeURIComponent(API_KEY)}`;

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      return { data: null, source: 'error', error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { values?: string[][] };
    const rows = json.values ?? [];
    const weeks = transformBoxscore(rows);

    // currentWeek = 最大週（fallback 1）
    const currentWeek = weeks.length > 0 ? Math.max(...weeks.map((w) => w.week)) : 1;

    return {
      data: {
        season: 25,
        currentWeek,
        weeks,
      },
      source: 'sheets',
    };
  } catch (err) {
    return {
      data: null,
      source: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
```

- [ ] **Step 3：確認測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test -- tests/integration/boxscore-parse.integration.test.ts -t "fetchBoxscore"
```
預期：I-5、I-6、I-7 PASS

- [ ] **Step 4：Commit**

```bash
git add src/lib/boxscore-api.ts
git commit -m "feat(boxscore): add fetchBoxscore Sheets API client (Issue #4 Task 2)"
```

---

## Task 3：boxscore-deep-link（URL query helpers + Unit Tests）

**Files:**
- Create: `src/lib/boxscore-deep-link.ts`
- Test: `tests/unit/boxscore-deep-link.test.ts`

### Style Rules（本 task 涉及的檔案）
無（純 URL 解析邏輯）

- [ ] **Step 1：寫失敗測試（TDD）— Unit U-3, U-4, U-5**

```typescript
// tests/unit/boxscore-deep-link.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseBoxscoreQuery,
  buildBoxscoreUrl,
  resolveDefaultTab,
  type BoxscoreUrlState,
} from '../../src/lib/boxscore-deep-link';

describe('parseBoxscoreQuery', () => {
  // Covers: U-3
  it('U-3a: 空 query → tab=null, week=null, game=null', () => {
    expect(parseBoxscoreQuery('')).toEqual({ tab: null, week: null, game: null });
  });

  // Covers: U-3
  it('U-3b: ?tab=leaders → 解析 tab', () => {
    expect(parseBoxscoreQuery('?tab=leaders')).toEqual({ tab: 'leaders', week: null, game: null });
  });

  // Covers: U-3
  it('U-3c: ?tab=boxscore&week=5&game=1 → 三欄都解析', () => {
    expect(parseBoxscoreQuery('?tab=boxscore&week=5&game=1')).toEqual({ tab: 'boxscore', week: 5, game: 1 });
  });

  // Covers: U-3
  it('U-3d: ?week=5&game=2（無 tab）→ tab=null, week=5, game=2', () => {
    expect(parseBoxscoreQuery('?week=5&game=2')).toEqual({ tab: null, week: 5, game: 2 });
  });

  // Covers: U-3
  it('U-3e: 不合法的 tab 值 → tab=null', () => {
    expect(parseBoxscoreQuery('?tab=invalid')).toEqual({ tab: null, week: null, game: null });
  });

  // Covers: U-3
  it('U-3f: 不合法的 week/game 數字 → 該欄 null', () => {
    expect(parseBoxscoreQuery('?week=abc&game=xyz')).toEqual({ tab: null, week: null, game: null });
  });
});

describe('resolveDefaultTab', () => {
  // Covers: U-5
  it('U-5a: 無 query → leaders（預設）', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery(''))).toBe('leaders');
  });

  // Covers: U-5
  it('U-5b: ?tab=leaders → leaders', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery('?tab=leaders'))).toBe('leaders');
  });

  // Covers: U-5
  it('U-5c: ?tab=boxscore → boxscore', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery('?tab=boxscore'))).toBe('boxscore');
  });

  // Covers: U-5
  it('U-5d: ?week=N&game=M（無 tab） → boxscore（隱含切到逐場）', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery('?week=5&game=1'))).toBe('boxscore');
  });

  // Covers: U-5
  it('U-5e: ?week=N（只有 week 沒 game） → boxscore（仍切到逐場）', () => {
    expect(resolveDefaultTab(parseBoxscoreQuery('?week=5'))).toBe('boxscore');
  });
});

describe('buildBoxscoreUrl', () => {
  const base = '/boxscore';

  // Covers: U-4
  it('U-4a: leaders tab → 不帶任何 query', () => {
    const state: BoxscoreUrlState = { tab: 'leaders', week: null, game: null };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore');
  });

  // Covers: U-4
  it('U-4b: boxscore tab 無 week/game → ?tab=boxscore', () => {
    const state: BoxscoreUrlState = { tab: 'boxscore', week: null, game: null };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore?tab=boxscore');
  });

  // Covers: U-4
  it('U-4c: boxscore tab + week=5 → ?tab=boxscore&week=5', () => {
    const state: BoxscoreUrlState = { tab: 'boxscore', week: 5, game: null };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore?tab=boxscore&week=5');
  });

  // Covers: U-4
  it('U-4d: boxscore tab + week=5 + game=1 → ?tab=boxscore&week=5&game=1', () => {
    const state: BoxscoreUrlState = { tab: 'boxscore', week: 5, game: 1 };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore?tab=boxscore&week=5&game=1');
  });

  // Covers: U-4 / B-22
  it('U-4e: 從 boxscore 切回 leaders → 同時清除 week/game query', () => {
    const state: BoxscoreUrlState = { tab: 'leaders', week: 5, game: 1 };
    expect(buildBoxscoreUrl(base, state)).toBe('/boxscore');
  });

  // Covers: U-4
  it('U-4f: baseUrl 帶尾斜線 → 不重複斜線', () => {
    const state: BoxscoreUrlState = { tab: 'boxscore', week: null, game: null };
    expect(buildBoxscoreUrl('/boxscore/', state)).toBe('/boxscore/?tab=boxscore');
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test -- tests/unit/boxscore-deep-link.test.ts
```
預期：FAIL — `Cannot find module '../../src/lib/boxscore-deep-link'`

- [ ] **Step 3：實作 boxscore-deep-link.ts**

```typescript
// src/lib/boxscore-deep-link.ts

export type BoxscoreTab = 'leaders' | 'boxscore';

export interface BoxscoreUrlState {
  tab: BoxscoreTab | null;
  week: number | null;
  game: number | null;
}

const VALID_TABS: ReadonlyArray<BoxscoreTab> = ['leaders', 'boxscore'];

function parsePositiveInt(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

/**
 * 從 location.search（或同等 query string）解析出 tab/week/game。
 * 不合法值 → null。
 *
 * Covers U-3
 */
export function parseBoxscoreQuery(search: string): BoxscoreUrlState {
  if (!search || (search === '?' )) return { tab: null, week: null, game: null };
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const tabRaw = params.get('tab');
  const tab = tabRaw && (VALID_TABS as ReadonlyArray<string>).includes(tabRaw) ? (tabRaw as BoxscoreTab) : null;

  const week = parsePositiveInt(params.get('week'));
  const game = parsePositiveInt(params.get('game'));

  // 若 tab 不合法，視同沒帶（保守策略）；但 week/game 仍可能單獨存在
  if (tabRaw !== null && tab === null) {
    return { tab: null, week: null, game: null };
  }

  return { tab, week, game };
}

/**
 * 由解析後 state 決定預設 active tab：
 *   - tab='leaders' → leaders
 *   - tab='boxscore' → boxscore
 *   - 無 tab 但有 week/game → boxscore（隱含切到逐場）
 *   - 都沒帶 → leaders（預設）
 *
 * Covers U-5, B-25, B-23, B-24
 */
export function resolveDefaultTab(state: BoxscoreUrlState): BoxscoreTab {
  if (state.tab) return state.tab;
  if (state.week !== null || state.game !== null) return 'boxscore';
  return 'leaders';
}

/**
 * 由 state 重建 URL（含 baseUrl）。
 * - leaders tab → 完全清除 query
 * - boxscore tab → 永遠帶 ?tab=boxscore；week/game 才帶該值
 *
 * Covers U-4, B-19, B-22
 */
export function buildBoxscoreUrl(baseUrl: string, state: BoxscoreUrlState): string {
  if (state.tab === 'leaders' || state.tab === null) {
    return baseUrl;
  }
  const params = new URLSearchParams();
  params.set('tab', 'boxscore');
  if (state.week !== null) params.set('week', String(state.week));
  if (state.game !== null) params.set('game', String(state.game));
  return `${baseUrl}?${params.toString()}`;
}
```

- [ ] **Step 4：確認測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test -- tests/unit/boxscore-deep-link.test.ts
```
預期：所有 17 個 case PASS

- [ ] **Step 5：Commit**

```bash
git add src/lib/boxscore-deep-link.ts tests/unit/boxscore-deep-link.test.ts
git commit -m "feat(boxscore): add deep-link URL helpers + unit tests (Issue #4 Task 3)"
```

---

## Task 4：BoxscorePanel 元件群（chip + 卡片 + 表格 + 三狀態）

**Files:**
- Create: `src/components/boxscore/BoxscorePanel.tsx`
- Create: `src/components/boxscore/BoxscoreGameCard.tsx`
- Create: `src/components/boxscore/BoxscoreTeamTable.tsx`
- Create: `src/components/boxscore/BoxscoreSkeleton.tsx`
- Create: `src/components/boxscore/BoxscoreError.tsx`
- Create: `src/components/boxscore/BoxscoreEmpty.tsx`

### Style Rules（本 task 涉及的檔案）

#### style-skeleton-loading（命中：BoxscorePanel 三狀態）
- Skeleton 形狀對應真實內容：chip timeline 骨架（8 個 chip 形狀色塊）+ 6 卡片骨架（標題 + 兩塊表格區色塊）
- 用 `animate-pulse` + `bg-gray-200`
- 操作立刻有視覺回饋：tab 切到 boxscore → 立刻顯示 BoxscoreSkeleton（不等資料）
- 禁止整頁 spinner / 禁止空白等資料

#### style-rwd-list（命中：11 欄表格）
- **規格優先覆寫**：本元件保留 11 欄 table（不切 mobile card），改用 `overflow-x-auto -mx-4 px-4` 容器讓手機橫向捲動。理由：球員數據對照需要 column 對齊（合計 row + DNP 視覺）。
- 桌機 ≥md：完整顯示 11 欄不需捲動
- DNP row：`text-gray-400 italic`，名字後加「(未出賽)」標籤

- [ ] **Step 1：寫失敗測試（驗收以 E-9~E-17, E-23, E-24, E-28 + R-1, R-3, R-4 為主）**

> 說明：本 task 主要由 qa-v2 已寫好的 E2E spec 驗收（`tests/e2e/features/boxscore.spec.ts` 對應 describe blocks），不重複寫單元測試。`computeTeamTotals` 在 Task 1 已測。本 task 確認元件 testid 命名與 spec 一致即可：
>
> 必要 data-testid：`bs-week-chip` / `bs-game-card` / `bs-game-title` / `bs-team-table` / `bs-totals-row` / `bs-player-row` / `bs-staff-toggle` / `bs-staff-panel` / `bs-skeleton` / `bs-error` / `bs-empty`
>
> 必要 data-* 屬性：chip 上 `data-active` `data-week`；game-card 上 `data-game`；team-table 上 `data-team`；player-row 上 `data-dnp`

- [ ] **Step 2：實作 BoxscoreSkeleton**

```typescript
// src/components/boxscore/BoxscoreSkeleton.tsx
export function BoxscoreSkeleton() {
  return (
    <div data-testid="bs-skeleton" className="px-4 md:px-8 py-6 animate-pulse">
      {/* chip timeline 骨架 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 w-12 md:w-20 bg-gray-200 rounded-lg flex-shrink-0" />
        ))}
      </div>
      {/* 球場卡片骨架（2 場示意，避免太長）*/}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl p-4 space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3：實作 BoxscoreError + BoxscoreEmpty**

```typescript
// src/components/boxscore/BoxscoreError.tsx
interface Props {
  onRetry: () => void;
}
export function BoxscoreError({ onRetry }: Props) {
  return (
    <div data-testid="bs-error" className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
      <p className="text-lg text-txt-dark mb-2">無法載入逐場數據</p>
      <p className="text-sm text-txt-mid mb-6">請檢查網路連線或稍後再試</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-orange text-white rounded-lg font-bold hover:bg-orange-2 transition"
      >
        重試
      </button>
    </div>
  );
}
```

```typescript
// src/components/boxscore/BoxscoreEmpty.tsx
export function BoxscoreEmpty() {
  return (
    <div data-testid="bs-empty" className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">📋</div>
      <p className="text-lg text-txt-dark">該週尚無 Box Score</p>
    </div>
  );
}
```

- [ ] **Step 4：實作 BoxscoreTeamTable（11 欄 + 合計 + DNP 樣式）**

```typescript
// src/components/boxscore/BoxscoreTeamTable.tsx
import type { BoxscoreTeam, BoxscorePlayer } from '../../types/boxscore';
import { getTeam } from '../../config/teams';

const COLUMNS: Array<{ key: keyof BoxscorePlayer; label: string }> = [
  { key: 'name', label: '球員' },
  { key: 'pts', label: '得分' },
  { key: 'fg2', label: '2P' },
  { key: 'fg3', label: '3P' },
  { key: 'ft', label: 'FT' },
  { key: 'oreb', label: 'OREB' },
  { key: 'dreb', label: 'DREB' },
  { key: 'treb', label: 'TREB' },
  { key: 'ast', label: 'AST' },
  { key: 'stl', label: 'STL' },
  { key: 'blk', label: 'BLK' },
  { key: 'tov', label: 'TOV' },
  { key: 'pf', label: 'PF' },
];
// 11 欄 = 球員 + 10 個數據（pts, fg2, fg3, ft, treb, ast, stl, blk, tov, pf）→ 共 11 = 1 名 + 10 stats
// 但 spec E-13 算法：以 columns row 第一格 + 10 個 stat header → 11 個 <th>
// （oreb/dreb 為 treb 的細分，不算入 11 欄主表，可以放展開或合併）
//
// 改為以下 11 欄主表：球員 / 得分 / 2P / 3P / FT / TREB / AST / STL / BLK / TOV / PF
// 進階（OREB/DREB）藏在 expand 或 sub-row（Issue 規格未強制）

const MAIN_COLUMNS = [
  { key: 'name', label: '球員' },
  { key: 'pts', label: '得分' },
  { key: 'fg2', label: '2P' },
  { key: 'fg3', label: '3P' },
  { key: 'ft', label: 'FT' },
  { key: 'treb', label: 'TREB' },
  { key: 'ast', label: 'AST' },
  { key: 'stl', label: 'STL' },
  { key: 'blk', label: 'BLK' },
  { key: 'tov', label: 'TOV' },
  { key: 'pf', label: 'PF' },
] as const;

interface Props {
  team: BoxscoreTeam;
}

export function BoxscoreTeamTable({ team }: Props) {
  const config = getTeam(team.team);
  return (
    <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 scrollbar-thin">
      <table
        data-testid="bs-team-table"
        data-team={team.team}
        className="w-full min-w-[640px] text-sm border-collapse"
      >
        <thead>
          <tr className="border-b border-warm-2 text-txt-mid">
            {MAIN_COLUMNS.map((col) => (
              <th key={col.key} className="text-left px-2 py-2 font-condensed font-bold whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {team.players.map((p) => (
            <tr
              key={p.name}
              data-testid="bs-player-row"
              data-dnp={p.dnp}
              className={[
                'border-b border-warm-1',
                p.dnp ? 'text-gray-400 italic' : 'text-txt-dark',
              ].join(' ')}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                {p.name}
                {p.dnp && <span className="ml-1 text-xs">(未出賽)</span>}
              </td>
              {MAIN_COLUMNS.slice(1).map((col) => (
                <td key={col.key} className="px-2 py-2">{p[col.key as keyof BoxscorePlayer] as number}</td>
              ))}
            </tr>
          ))}
          <tr
            data-testid="bs-totals-row"
            className="border-t-2 border-warm-2 font-bold"
            style={config ? { color: config.textColor } : undefined}
          >
            <td className="px-2 py-2">合計</td>
            <td className="px-2 py-2">{team.totals.pts}</td>
            <td className="px-2 py-2">{team.totals.fg2}</td>
            <td className="px-2 py-2">{team.totals.fg3}</td>
            <td className="px-2 py-2">{team.totals.ft}</td>
            <td className="px-2 py-2">{team.totals.treb}</td>
            <td className="px-2 py-2">{team.totals.ast}</td>
            <td className="px-2 py-2">{team.totals.stl}</td>
            <td className="px-2 py-2">{team.totals.blk}</td>
            <td className="px-2 py-2">{team.totals.tov}</td>
            <td className="px-2 py-2">{team.totals.pf}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5：實作 BoxscoreGameCard（標題 + 雙隊表格 + staff 摺疊）**

```typescript
// src/components/boxscore/BoxscoreGameCard.tsx
import { useState } from 'react';
import type { BoxscoreGame } from '../../types/boxscore';
import { BoxscoreTeamTable } from './BoxscoreTeamTable';

interface Props {
  game: BoxscoreGame;
  highlight?: boolean;
}

export function BoxscoreGameCard({ game, highlight = false }: Props) {
  const [staffOpen, setStaffOpen] = useState(false);
  const staffEntries = Object.entries(game.staff).filter(([, names]) => names.length > 0);
  const staffCount = staffEntries.reduce((n, [, arr]) => n + arr.length, 0);

  return (
    <article
      data-testid="bs-game-card"
      data-game={game.game}
      data-highlight={highlight}
      className={[
        'bg-white border rounded-2xl p-4 md:p-5 transition',
        highlight ? 'border-orange ring-2 ring-orange/40' : 'border-warm-2',
      ].join(' ')}
    >
      <h3
        data-testid="bs-game-title"
        className="font-condensed text-lg md:text-xl text-navy mb-3"
      >
        第 {game.week} 週 第 {game.game} 場 — {game.home.team} {game.home.score} vs {game.away.score} {game.away.team}
      </h3>

      <div className="space-y-4">
        <BoxscoreTeamTable team={game.home} />
        <BoxscoreTeamTable team={game.away} />
      </div>

      {staffCount > 0 && (
        <div className="mt-3 border-t border-warm-2 pt-3">
          <button
            data-testid="bs-staff-toggle"
            aria-expanded={staffOpen}
            onClick={() => setStaffOpen((p) => !p)}
            className="text-sm text-txt-mid hover:text-orange transition flex items-center gap-1"
          >
            <span aria-hidden="true">👨‍⚖️</span>
            <span>工作人員 ({staffCount})</span>
            <span aria-hidden="true">{staffOpen ? '▲' : '▼'}</span>
          </button>
          {staffOpen && (
            <div data-testid="bs-staff-panel" className="mt-2 space-y-1 text-sm">
              {staffEntries.map(([role, names]) => (
                <div key={role} className="flex gap-2">
                  <span className="text-txt-light font-bold w-12">{role}</span>
                  <span className="text-txt-mid">{names.join('、')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 6：實作 BoxscorePanel（chip + 卡片列表 + 三狀態 + scroll 到 game）**

```typescript
// src/components/boxscore/BoxscorePanel.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import type { BoxscoreData, BoxscoreWeek } from '../../types/boxscore';
import { fetchBoxscore } from '../../lib/boxscore-api';
import { BoxscoreSkeleton } from './BoxscoreSkeleton';
import { BoxscoreError } from './BoxscoreError';
import { BoxscoreEmpty } from './BoxscoreEmpty';
import { BoxscoreGameCard } from './BoxscoreGameCard';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  initialWeek: number | null;
  initialGame: number | null;
  onWeekChange: (week: number | null) => void;
}

export function BoxscorePanel({ initialWeek, initialGame, onWeekChange }: Props) {
  const [data, setData] = useState<BoxscoreData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [activeWeek, setActiveWeek] = useState<number | null>(initialWeek);
  const [reloadKey, setReloadKey] = useState(0);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      const result = await fetchBoxscore();
      if (cancelled) return;
      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }
      const bs = result.data;
      setData(bs);
      if (bs.weeks.length === 0) {
        setStatus('empty');
        setActiveWeek(null);
        return;
      }
      const targetWeek = activeWeek ?? bs.currentWeek;
      const found = bs.weeks.find((w) => w.week === targetWeek) ?? bs.weeks[bs.weeks.length - 1];
      setActiveWeek(found.week);
      onWeekChange(found.week);
      setStatus('ok');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // deep-link scroll：activeWeek 切到對應週、且 initialGame 存在時，scroll 到該卡片
  useEffect(() => {
    if (status !== 'ok' || initialGame === null) return;
    const el = cardRefs.current.get(initialGame);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [status, activeWeek, initialGame]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);
  const handleSelectWeek = useCallback(
    (w: number) => {
      setActiveWeek(w);
      onWeekChange(w);
    },
    [onWeekChange],
  );

  if (status === 'loading') return <BoxscoreSkeleton />;
  if (status === 'error') return <BoxscoreError onRetry={handleRetry} />;
  if (status === 'empty' || !data || activeWeek === null) return <BoxscoreEmpty />;

  const week: BoxscoreWeek | undefined = data.weeks.find((w) => w.week === activeWeek);
  if (!week || week.games.length === 0) return <BoxscoreEmpty />;

  return (
    <div data-testid="boxscore-panel" className="px-4 md:px-8 py-6">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin" role="tablist" aria-label="週次選擇">
        {data.weeks.map((w) => {
          const isActive = w.week === activeWeek;
          return (
            <button
              key={w.week}
              role="tab"
              aria-selected={isActive}
              data-testid="bs-week-chip"
              data-active={isActive}
              data-week={w.week}
              onClick={() => handleSelectWeek(w.week)}
              className={[
                'flex-shrink-0 px-3 md:px-4 py-2 rounded-lg font-condensed font-bold transition whitespace-nowrap',
                isActive ? 'bg-orange text-white' : 'bg-warm-1 text-txt-mid hover:bg-warm-2',
              ].join(' ')}
            >
              W{w.week}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 md:space-y-6">
        {week.games.map((g) => (
          <div
            key={g.game}
            ref={(el) => {
              if (el) cardRefs.current.set(g.game, el);
              else cardRefs.current.delete(g.game);
            }}
          >
            <BoxscoreGameCard game={g} highlight={initialGame === g.game} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7：執行 type-check + 既有測試保持綠**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npx astro check
npm test -- tests/unit tests/integration
```
預期：type-check PASS、Task 1~3 測試持續 PASS

- [ ] **Step 8：Commit**

```bash
git add src/components/boxscore/BoxscorePanel.tsx src/components/boxscore/BoxscoreGameCard.tsx src/components/boxscore/BoxscoreTeamTable.tsx src/components/boxscore/BoxscoreSkeleton.tsx src/components/boxscore/BoxscoreError.tsx src/components/boxscore/BoxscoreEmpty.tsx
git commit -m "feat(boxscore): add BoxscorePanel + game card + team table + 3-state components (Issue #4 Task 4)"
```

---

## Task 5：Leaders types + format utils + LeadersPanel 元件群 + Unit Tests

**Files:**
- Create: `src/types/leaders.ts`
- Create: `src/lib/leaders-format.ts`
- Create: `src/components/boxscore/LeadersPanel.tsx`
- Create: `src/components/boxscore/LeaderCard.tsx`
- Create: `src/components/boxscore/LeadersSkeleton.tsx`
- Create: `src/components/boxscore/LeadersError.tsx`
- Create: `src/components/boxscore/LeadersEmpty.tsx`
- Test: `tests/unit/leaders-format.test.ts`
- Test (existing, turn red→green): `tests/integration/boxscore-parse.integration.test.ts` (cases I-8, I-9, I-10)

### Style Rules（本 task 涉及的檔案）

#### style-skeleton-loading（命中：LeadersPanel 三狀態）
- LeadersSkeleton 形狀對應真實內容：6 個 `bg-gray-200 rounded-2xl` 卡片骨架，每張內含 1 個標題色塊 + 10 行短條色塊
- 桌機 `md:grid-cols-2`、手機 `grid-cols-1`，與真實 LeadersPanel layout 一致避免 layout shift
- `animate-pulse`、不用 spinner、不用文字
- 操作立刻有視覺回饋：tab 切到 leaders → 立刻顯示 LeadersSkeleton

#### style-rwd-list（命中：top 10 多欄列表 = card-with-rows）
- 完全遵循：桌機 6 卡片兩欄並排（`md:grid-cols-2`）；手機單欄堆疊（`grid-cols-1`）
- 每張卡片內部已是 card 形式（標題 + label-value 行），手機不再拆 card

- [ ] **Step 1：寫失敗測試（TDD）— Unit U-6**

```typescript
// tests/unit/leaders-format.test.ts
import { describe, it, expect } from 'vitest';
import {
  formatScoringAdvanced,
  formatReboundAdvanced,
  getCurrentSeasonKey,
} from '../../src/lib/leaders-format';
import { mockLeaderEntry, mockFullLeaders, mockEmptyLeaders } from '../fixtures/leaders';

describe('formatScoringAdvanced', () => {
  // Covers: U-6
  it('U-6a: scoring entry 含 p2/p3/ft → 回傳「2P 55.6% / 3P 20.0% / FT 57.5%」格式', () => {
    const e = mockLeaderEntry('Alice', '紅', 9.55, { p2: '55.6%', p3: '20.0%', ft: '57.5%' });
    const formatted = formatScoringAdvanced(e);
    expect(formatted).toContain('2P');
    expect(formatted).toContain('55.6%');
    expect(formatted).toContain('3P');
    expect(formatted).toContain('20.0%');
    expect(formatted).toContain('FT');
    expect(formatted).toContain('57.5%');
  });

  // Covers: U-6
  it('U-6b: 缺欄位 → 缺的部分以「—」呈現或省略，不噴錯', () => {
    const e = mockLeaderEntry('Bob', '黑', 7);
    expect(() => formatScoringAdvanced(e)).not.toThrow();
    const formatted = formatScoringAdvanced(e);
    expect(typeof formatted).toBe('string');
  });
});

describe('formatReboundAdvanced', () => {
  // Covers: U-6
  it('U-6c: rebound entry 含 off/def → 回傳「OREB 2.5 / DREB 5.9」格式', () => {
    const e = mockLeaderEntry('Charlie', '藍', 8.4, { off: 2.5, def: 5.9 });
    const formatted = formatReboundAdvanced(e);
    expect(formatted).toContain('2.5');
    expect(formatted).toContain('5.9');
  });

  // Covers: U-6
  it('U-6d: 缺 off/def → 不噴錯', () => {
    const e = mockLeaderEntry('Dave', '黃', 7);
    expect(() => formatReboundAdvanced(e)).not.toThrow();
  });
});

describe('getCurrentSeasonKey', () => {
  it('U-6e: full leaders → 回傳最新賽季 key（"25"）', () => {
    expect(getCurrentSeasonKey(mockFullLeaders())).toBe('25');
  });

  it('U-6f: 空 LeaderData → null', () => {
    expect(getCurrentSeasonKey({})).toBeNull();
  });

  it('U-6g: 多賽季 → 回傳數字最大的 key', () => {
    const data = { '24': mockEmptyLeaders()['25'], '25': mockEmptyLeaders()['25'], '23': mockEmptyLeaders()['25'] };
    expect(getCurrentSeasonKey(data)).toBe('25');
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test -- tests/unit/leaders-format.test.ts
```
預期：FAIL — `Cannot find module '../../src/lib/leaders-format'`

- [ ] **Step 3：實作 types/leaders.ts**

```typescript
// src/types/leaders.ts
export type LeaderCategory = 'scoring' | 'rebound' | 'assist' | 'steal' | 'block' | 'eff';

export interface LeaderEntry {
  name: string;
  team: string;
  val: number;
  /** scoring 才有 */
  p2?: string;
  p3?: string;
  ft?: string;
  /** rebound 才有 */
  off?: number;
  def?: number;
}

export interface LeaderSeason {
  label: string;
  scoring: LeaderEntry[];
  rebound: LeaderEntry[];
  assist: LeaderEntry[];
  steal: LeaderEntry[];
  block: LeaderEntry[];
  eff: LeaderEntry[];
}

export type LeaderData = Record<string, LeaderSeason>;
```

- [ ] **Step 4：實作 leaders-format.ts**

```typescript
// src/lib/leaders-format.ts
import type { LeaderData, LeaderEntry } from '../types/leaders';

/**
 * scoring 進階指標：「2P 55.6% / 3P 20.0% / FT 57.5%」
 * 缺值 → 「—」
 *
 * Covers U-6
 */
export function formatScoringAdvanced(e: LeaderEntry): string {
  const p2 = e.p2 ?? '—';
  const p3 = e.p3 ?? '—';
  const ft = e.ft ?? '—';
  return `2P ${p2} / 3P ${p3} / FT ${ft}`;
}

/**
 * rebound 進階指標：「OREB 2.5 / DREB 5.9」
 * 缺值 → 「—」
 *
 * Covers U-6
 */
export function formatReboundAdvanced(e: LeaderEntry): string {
  const off = e.off ?? '—';
  const def = e.def ?? '—';
  return `OREB ${off} / DREB ${def}`;
}

/**
 * 從 LeaderData 取最新賽季 key（數字最大）
 *
 * Covers U-6
 */
export function getCurrentSeasonKey(data: LeaderData): string | null {
  const keys = Object.keys(data);
  if (keys.length === 0) return null;
  const sorted = keys
    .map((k) => ({ k, n: Number(k) }))
    .filter((x) => Number.isFinite(x.n))
    .sort((a, b) => b.n - a.n);
  return sorted.length > 0 ? sorted[0].k : keys[0];
}
```

- [ ] **Step 5：確認 unit + integration 測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test -- tests/unit/leaders-format.test.ts tests/integration/boxscore-parse.integration.test.ts
```
預期：unit 7 case PASS、I-8/I-9/I-10 PASS

> 說明：I-8/I-9/I-10 的 `fetchData('stats')` 呼叫既有 `src/lib/api.ts`，本 task 不修改 api.ts，但因 leaders type 已加入，integration 應同步通過。

- [ ] **Step 6：實作 LeadersSkeleton + LeadersError + LeadersEmpty**

```typescript
// src/components/boxscore/LeadersSkeleton.tsx
export function LeadersSkeleton() {
  return (
    <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl p-4 space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
          {Array.from({ length: 10 }).map((__, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

```typescript
// src/components/boxscore/LeadersError.tsx
interface Props {
  onRetry: () => void;
}
export function LeadersError({ onRetry }: Props) {
  return (
    <div data-testid="leaders-error" className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
      <p className="text-lg text-txt-dark mb-2">無法載入領先榜</p>
      <p className="text-sm text-txt-mid mb-6">請檢查網路連線或稍後再試</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-orange text-white rounded-lg font-bold hover:bg-orange-2 transition"
      >
        重試
      </button>
    </div>
  );
}
```

```typescript
// src/components/boxscore/LeadersEmpty.tsx
interface Props {
  message?: string;
}
export function LeadersEmpty({ message = '賽季初尚無球員數據' }: Props) {
  return (
    <div data-testid="leaders-empty" className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">🏀</div>
      <p className="text-lg text-txt-dark">{message}</p>
    </div>
  );
}
```

- [ ] **Step 7：實作 LeaderCard（單類別 top 10 + 進階指標）**

```typescript
// src/components/boxscore/LeaderCard.tsx
import type { LeaderCategory, LeaderEntry } from '../../types/leaders';
import { getTeam } from '../../config/teams';
import { formatScoringAdvanced, formatReboundAdvanced } from '../../lib/leaders-format';
import { LeadersEmpty } from './LeadersEmpty';

const CATEGORY_TITLES: Record<LeaderCategory, string> = {
  scoring: '得分王',
  rebound: '籃板王',
  assist: '助攻王',
  steal: '抄截王',
  block: '阻攻王',
  eff: '效率王',
};

interface Props {
  category: LeaderCategory;
  entries: LeaderEntry[];
}

export function LeaderCard({ category, entries }: Props) {
  return (
    <div
      data-testid="leaders-card"
      data-category={category}
      className="bg-white border border-warm-2 rounded-2xl p-4"
    >
      <h3 className="font-condensed text-lg text-navy mb-3 font-bold">
        {CATEGORY_TITLES[category]}
      </h3>
      {entries.length === 0 ? (
        <LeadersEmpty message="該類別尚無數據" />
      ) : (
        <ol className="space-y-2">
          {entries.slice(0, 10).map((e, idx) => {
            const rank = idx + 1;
            const team = getTeam(e.team);
            const advanced =
              category === 'scoring'
                ? formatScoringAdvanced(e)
                : category === 'rebound'
                  ? formatReboundAdvanced(e)
                  : null;
            return (
              <li
                key={`${rank}-${e.name}`}
                data-testid="leader-row"
                data-rank={rank}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-6 font-bold text-txt-light">{rank}</span>
                <span
                  data-testid="leader-team-dot"
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team?.color ?? '#999' }}
                  aria-hidden="true"
                />
                <span data-testid="leader-name" className="flex-1 text-txt-dark">{e.name}</span>
                <span data-testid="leader-val" className="font-condensed font-bold text-orange">
                  {e.val.toFixed(2)}
                </span>
                {advanced && (
                  <span data-testid="leader-advanced" className="text-xs text-txt-mid hidden md:inline">
                    {advanced}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
```

- [ ] **Step 8：實作 LeadersPanel（fetchData('stats') + 6 卡片網格）**

```typescript
// src/components/boxscore/LeadersPanel.tsx
import { useEffect, useState, useCallback } from 'react';
import type { LeaderData } from '../../types/leaders';
import { fetchData } from '../../lib/api';
import { getCurrentSeasonKey } from '../../lib/leaders-format';
import { LeadersSkeleton } from './LeadersSkeleton';
import { LeadersError } from './LeadersError';
import { LeadersEmpty } from './LeadersEmpty';
import { LeaderCard } from './LeaderCard';

type Status = 'loading' | 'error' | 'empty' | 'ok';
const CATEGORIES = ['scoring', 'rebound', 'assist', 'steal', 'block', 'eff'] as const;

export function LeadersPanel() {
  const [data, setData] = useState<LeaderData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      const result = await fetchData<LeaderData>('stats');
      if (cancelled) return;
      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }
      const leaders = result.data;
      const seasonKey = getCurrentSeasonKey(leaders);
      if (!seasonKey) {
        setStatus('empty');
        return;
      }
      const season = leaders[seasonKey];
      const allEmpty = CATEGORIES.every((c) => (season[c]?.length ?? 0) === 0);
      if (allEmpty) {
        setData(leaders);
        setStatus('empty');
        return;
      }
      setData(leaders);
      setStatus('ok');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);

  if (status === 'loading') return <LeadersSkeleton />;
  if (status === 'error') return <LeadersError onRetry={handleRetry} />;
  if (status === 'empty' || !data) return <LeadersEmpty />;

  const seasonKey = getCurrentSeasonKey(data);
  if (!seasonKey) return <LeadersEmpty />;
  const season = data[seasonKey];

  return (
    <div data-testid="leaders-panel" className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {CATEGORIES.map((c) => (
        <LeaderCard key={c} category={c} entries={season[c] ?? []} />
      ))}
    </div>
  );
}
```

- [ ] **Step 9：執行 type-check + 全測**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npx astro check
npm test
```
預期：所有 unit + integration PASS（含 I-8/I-9/I-10）

- [ ] **Step 10：Commit**

```bash
git add src/types/leaders.ts src/lib/leaders-format.ts src/components/boxscore/LeadersPanel.tsx src/components/boxscore/LeaderCard.tsx src/components/boxscore/LeadersSkeleton.tsx src/components/boxscore/LeadersError.tsx src/components/boxscore/LeadersEmpty.tsx tests/unit/leaders-format.test.ts
git commit -m "feat(boxscore): add LeadersPanel + 6-category cards + format utils + unit tests (Issue #4 Task 5)"
```

---

## Task 6：BoxscoreApp 整合（sub-tab + URL sync + popstate）

**Files:**
- Create: `src/components/boxscore/BoxscoreApp.tsx`
- Create: `src/components/boxscore/BoxscoreHero.tsx`
- Create: `src/components/boxscore/SubTabs.tsx`

### Style Rules（本 task 涉及的檔案）

#### style-skeleton-loading（命中：BoxscoreApp 同頁同時 fetch boxscore + leaders 兩支 API）
- 切換 sub-tab → 對應 panel 立即顯示自己的 skeleton（panel 內已實作）
- BoxscoreApp 本身不阻塞 — 兩 panel 都已掛載（用 `display:none` 隱藏非 active），切換 tab 立即可見對應狀態
- Hero + SubTabs 由 React 立即 render（state 為 client-side），不留白

- [ ] **Step 1：實作 BoxscoreHero（依 active tab 切副標）**

```typescript
// src/components/boxscore/BoxscoreHero.tsx
import type { BoxscoreTab } from '../../lib/boxscore-deep-link';

interface Props {
  activeTab: BoxscoreTab;
  season: number;
}

export function BoxscoreHero({ activeTab, season }: Props) {
  const subtitle = activeTab === 'leaders' ? '領先榜' : '逐場 Box';
  return (
    <header data-testid="data-hero" className="text-center px-4 py-6 md:py-10">
      <h1
        data-testid="hero-title"
        className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2"
      >
        DATA · 第 {season} 季
      </h1>
      <p
        data-testid="hero-subtitle"
        className="font-condensed text-base md:text-lg text-txt-mid"
      >
        {subtitle}
      </p>
    </header>
  );
}
```

- [ ] **Step 2：實作 SubTabs（按鈕列）**

```typescript
// src/components/boxscore/SubTabs.tsx
import type { BoxscoreTab } from '../../lib/boxscore-deep-link';

interface Props {
  activeTab: BoxscoreTab;
  onSelect: (tab: BoxscoreTab) => void;
}

const TABS: Array<{ id: BoxscoreTab; label: string }> = [
  { id: 'leaders', label: '領先榜' },
  { id: 'boxscore', label: '逐場 Box' },
];

export function SubTabs({ activeTab, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="數據分頁" className="flex gap-2 px-4 md:px-8 border-b border-warm-2">
      {TABS.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            data-testid="sub-tab"
            data-tab={t.id}
            data-active={isActive}
            onClick={() => onSelect(t.id)}
            className={[
              'px-4 py-3 font-condensed font-bold transition border-b-2',
              isActive
                ? 'text-orange border-orange'
                : 'text-txt-mid border-transparent hover:text-orange/80',
            ].join(' ')}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3：實作 BoxscoreApp（核心控制器）**

```typescript
// src/components/boxscore/BoxscoreApp.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  parseBoxscoreQuery,
  resolveDefaultTab,
  buildBoxscoreUrl,
  type BoxscoreTab,
  type BoxscoreUrlState,
} from '../../lib/boxscore-deep-link';
import { BoxscoreHero } from './BoxscoreHero';
import { SubTabs } from './SubTabs';
import { BoxscorePanel } from './BoxscorePanel';
import { LeadersPanel } from './LeadersPanel';

interface Props {
  /** 從 Astro 傳入：import.meta.env.BASE_URL（含尾斜線） */
  baseUrl: string;
}

const SEASON = 25;

function readUrlState(): BoxscoreUrlState {
  if (typeof window === 'undefined') return { tab: null, week: null, game: null };
  return parseBoxscoreQuery(window.location.search);
}

export function BoxscoreApp({ baseUrl }: Props) {
  const initial = readUrlState();
  const [activeTab, setActiveTab] = useState<BoxscoreTab>(resolveDefaultTab(initial));
  const [activeWeek, setActiveWeek] = useState<number | null>(initial.week);
  const [initialGame] = useState<number | null>(initial.game);

  // popstate（瀏覽器上下頁）→ 重新解析 URL
  useEffect(() => {
    const handler = () => {
      const s = readUrlState();
      setActiveTab(resolveDefaultTab(s));
      setActiveWeek(s.week);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // 切 tab → 更新 URL（leaders 清掉 week/game）
  const handleSelectTab = useCallback(
    (tab: BoxscoreTab) => {
      setActiveTab(tab);
      const next: BoxscoreUrlState =
        tab === 'leaders'
          ? { tab: 'leaders', week: null, game: null }
          : { tab: 'boxscore', week: activeWeek, game: null };
      // boxscore tab 切回時清除 highlight game（避免每次切回都 re-scroll）
      const url = buildBoxscoreUrl(deriveBase(baseUrl), next);
      window.history.replaceState(null, '', url);
    },
    [activeWeek, baseUrl],
  );

  // boxscore panel 換週時 → 同步 URL（保留 tab=boxscore）
  const handleWeekChange = useCallback(
    (week: number | null) => {
      setActiveWeek(week);
      if (activeTab !== 'boxscore') return;
      const url = buildBoxscoreUrl(deriveBase(baseUrl), {
        tab: 'boxscore',
        week,
        game: null,
      });
      window.history.replaceState(null, '', url);
    },
    [activeTab, baseUrl],
  );

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <BoxscoreHero activeTab={activeTab} season={SEASON} />
      <SubTabs activeTab={activeTab} onSelect={handleSelectTab} />

      {/* 兩 panel 都掛載，但只顯示 active 的 → 切換瞬間立即顯示對應 panel 的 skeleton */}
      <div style={{ display: activeTab === 'leaders' ? 'block' : 'none' }}>
        <LeadersPanel />
      </div>
      <div style={{ display: activeTab === 'boxscore' ? 'block' : 'none' }}>
        <BoxscorePanel
          initialWeek={activeWeek}
          initialGame={initialGame}
          onWeekChange={handleWeekChange}
        />
      </div>
    </div>
  );
}

/**
 * baseUrl 形如 "/" 或 "/taan-basketball-league/"
 * 串成 "/boxscore" 或 "/taan-basketball-league/boxscore"
 */
function deriveBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return `${trimmed}/boxscore`;
}
```

- [ ] **Step 4：執行 type-check + 全測**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npx astro check
npm test
```
預期：type-check PASS、所有 unit + integration 持續 PASS

- [ ] **Step 5：Commit**

```bash
git add src/components/boxscore/BoxscoreApp.tsx src/components/boxscore/BoxscoreHero.tsx src/components/boxscore/SubTabs.tsx
git commit -m "feat(boxscore): add BoxscoreApp + Hero + SubTabs with URL sync (Issue #4 Task 6)"
```

---

## Task 7：boxscore.astro 頁面整合

**Files:**
- Modify: `src/pages/boxscore.astro`

### Style Rules（本 task 涉及的檔案）

#### style-skeleton-loading（命中：頁面 mount 時間點）
- 用 `client:load`（與 schedule.astro 一致），React 一掛載就立即 render Hero + SubTabs + 對應 panel skeleton
- 不用 `client:visible`（會延後到滾動才掛載）

- [ ] **Step 1：改寫 boxscore.astro**

```astro
---
// src/pages/boxscore.astro
import Layout from '../layouts/Layout.astro';
import { BoxscoreApp } from '../components/boxscore/BoxscoreApp';

const baseUrl = import.meta.env.BASE_URL;
---

<Layout title="比賽數據" active="data">
  <BoxscoreApp client:load baseUrl={baseUrl} />
</Layout>
```

- [ ] **Step 2：跑 dev server smoke check**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npx astro check
npm run build
```
預期：build 成功（會輸出 `dist/boxscore/index.html` + JS chunks）

- [ ] **Step 3：本地手動 smoke 確認（可選但建議）**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm run dev
# 開瀏覽器：http://localhost:4321/boxscore
# 預期：Hero「DATA · 第 25 季」+ SubTabs（leaders 預設 active）+ LeadersPanel skeleton → 接著顯示資料 or empty
```

- [ ] **Step 4：Commit**

```bash
git add src/pages/boxscore.astro
git commit -m "feat(boxscore): wire BoxscoreApp into /boxscore page (Issue #4 Task 7)"
```

---

## Task 8：環境變數整合（.env.example）

**Files:**
- Modify: `.env.example`

### Style Rules（本 task 涉及的檔案）
無（純設定檔）

- [ ] **Step 1：新增環境變數範例與註解**

```bash
# .env.example（在現有內容後追加）
# Google Sheets API（boxscore tab 直打）
# 部署後設定步驟：
#   1. Google Cloud Console → APIs & Services → Credentials → 建立 API Key
#   2. 「應用程式限制」設為「HTTP referrer」，加入：
#      - https://waterfat.github.io/*
#      - http://localhost:4321/*
#   3. 「API 限制」勾選 Google Sheets API
#   4. 將 Spreadsheet 共用權限設為「知道連結的人 — 檢視者」
PUBLIC_SHEET_ID=REPLACE_WITH_SPREADSHEET_ID
PUBLIC_SHEETS_API_KEY=REPLACE_WITH_API_KEY
```

實作方式：

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
cat >> .env.example <<'EOF'

# Google Sheets API（boxscore tab 直打 — Issue #4）
# 部署後設定步驟：
#   1. Google Cloud Console → APIs & Services → Credentials → 建立 API Key
#   2. 「應用程式限制」設為「HTTP referrer」，加入：
#      - https://waterfat.github.io/*
#      - http://localhost:4321/*
#   3. 「API 限制」勾選 Google Sheets API
#   4. 將 Spreadsheet 共用權限設為「知道連結的人 — 檢視者」
PUBLIC_SHEET_ID=REPLACE_WITH_SPREADSHEET_ID
PUBLIC_SHEETS_API_KEY=REPLACE_WITH_API_KEY
EOF
```

- [ ] **Step 2：手動建立本地 .env.local 的步驟記錄到 retrospect notes（不寫入 git）**

提示：subagent 不需建立 `.env.local`，由部署時 ops-v2 / 使用者手動設定。

- [ ] **Step 3：Commit**

```bash
git add .env.example
git commit -m "chore(env): add PUBLIC_SHEET_ID + PUBLIC_SHEETS_API_KEY to .env.example (Issue #4 Task 8)"
```

---

## OPS 部署驗收清單（GitHub Pages）

部署完成後，依以下清單人工驗收（pm-v2 Phase 5 結束、Phase 6 E2E 開始前）：

### 環境變數確認
- [ ] GitHub repo Settings → Secrets and variables → Actions：
  - 確認 `PUBLIC_SHEET_ID` 已設定（值為實際 spreadsheet ID）
  - 確認 `PUBLIC_SHEETS_API_KEY` 已設定（值為實際 API key）
  - 確認 GitHub Actions workflow（`.github/workflows/deploy.yml`）有把這兩個變數透過 `env:` 帶到 build step
- [ ] 部署完成後到 https://waterfat.github.io/taan-basketball-league/boxscore 開啟 DevTools，確認 `import.meta.env.PUBLIC_SHEET_ID` 在 client bundle 已注入（搜尋 dist 中的 hash 字串）

### Sheets API key referrer 限制驗證
- [ ] Google Cloud Console → APIs & Services → Credentials → 該 API Key：
  - 「Application restrictions」=「HTTP referrers」
  - 允許清單包含：
    - `https://waterfat.github.io/*`
    - `http://localhost:4321/*`（dev 用）
  - 「API restrictions」=「Restrict key」→ 只勾選 Google Sheets API
- [ ] 用 `curl` 模擬非允許 referrer 應被拒：
  ```bash
  curl -s -H "Referer: https://malicious.example.com" \
    "https://sheets.googleapis.com/v4/spreadsheets/${PUBLIC_SHEET_ID}/values/boxscore!A1?key=${PUBLIC_SHEETS_API_KEY}" | head -20
  ```
  預期：回 403 with "API_KEY_HTTP_REFERRER_BLOCKED"

### Spreadsheet 公開權限驗證
- [ ] Google Sheets → 共用設定 →「一般存取權」=「知道連結的人」+「檢視者」
- [ ] 用無痕視窗打開 spreadsheet URL → 不需登入即可檢視

### Production smoke
- [ ] 訪客打開 `https://waterfat.github.io/taan-basketball-league/boxscore` → 不出 console error、不出 401/403/CORS 錯誤
- [ ] 切到「逐場 Box」分頁 → 表格正常渲染（Sheets API 200）
- [ ] 切到「領先榜」分頁 → 6 卡片正常渲染（GAS handleStats 200）

### Phase 6 E2E（由 qa-v2 自動跑，本清單僅列指令）

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npx playwright test tests/e2e/regression/boxscore.regression.spec.ts
npx playwright test tests/e2e/features/boxscore.spec.ts
```

驗收 spec：`tests/e2e/regression/boxscore.regression.spec.ts`（R-1~R-5）+ `tests/e2e/features/boxscore.spec.ts`（E-1~E-32）。

---

## 自我審查（Step 6）

### Spec 覆蓋
- B-1, B-2 → Task 6 BoxscoreHero 動態副標 ✅
- B-3 ~ B-13 → Task 4 BoxscorePanel + GameCard + TeamTable ✅（B-12 在 Task 1 computeTeamTotals U-2 已驗）
- B-14 ~ B-18 → Task 5 LeadersPanel + LeaderCard ✅（B-17/B-18 在 Task 5 U-6 已驗）
- B-19 ~ B-25 → Task 3 deep-link helpers + Task 6 BoxscoreApp URL sync ✅
- B-26 ~ B-29 → Task 4（11 欄 overflow-x-auto）+ Task 5（md:grid-cols-2）✅
- B-30 ~ B-37 → 三狀態元件 Task 4/5（BoxscoreSkeleton/Error/Empty + LeadersSkeleton/Error/Empty）✅
- B-38 → Task 8 .env.example + OPS 驗收清單 ✅
- B-39, B-40 → Task 1 transformBoxscore + DNP 標記 ✅

### Coverage Matrix 對齊
- U-1, U-2 → Task 1 unit ✅
- U-3, U-4, U-5 → Task 3 unit ✅
- U-6 → Task 5 unit ✅
- I-1 ~ I-4 → Task 1 由紅轉綠 ✅
- I-5 ~ I-7 → Task 2 由紅轉綠 ✅
- I-8 ~ I-10 → Task 5（依賴既有 fetchData('stats')）由紅轉綠 ✅
- E-1 ~ E-32 + R-1 ~ R-5 → 由 qa-v2 Phase 6 跑既有 spec，Task 不重寫 ✅

### 佔位符掃描
- 全 task 含完整程式碼片段 ✅
- 無 TODO / TBD / "implement later" / "Similar to Task N" ✅

### 測試約束
- Unit test 驗實際回傳值（非 assert_called）✅
- Integration test 走真實邏輯（mock 邊界 fetch、走真實 transformBoxscore）✅
- Integration 不依賴 dev server ✅
- 空函式實作會讓測試失敗（每個 case 驗 deepEqual / toBe）✅

### 型別一致性
- `BoxscoreTab` 型別定義在 `src/lib/boxscore-deep-link.ts`，BoxscoreApp / BoxscoreHero / SubTabs 共用 import ✅
- `BoxscoreData / BoxscoreWeek / BoxscoreGame / BoxscoreTeam / BoxscorePlayer / BoxscoreTotals / TeamId` 集中於 `src/types/boxscore.ts` ✅
- `LeaderData / LeaderEntry / LeaderSeason / LeaderCategory` 集中於 `src/types/leaders.ts` ✅
- `tests/fixtures/boxscore.ts` 與 `src/types/boxscore.ts` 同型別（Task 1 寫實作時對齊 fixture export 的型別 shape）✅
