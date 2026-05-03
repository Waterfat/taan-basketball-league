# Issue #14 補齊舊版遺漏功能 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 補齊新網站從舊版遺漏的 11 項功能，跨 6 個畫面（首頁 / 戰績榜 / 領先榜 / 球員名單 / 賽程頁 / 龍虎榜），讓使用者打開新網站時能看到舊版所有資訊欄位、表格、文案與切換功能。

**Architecture:**
- **資料層**：擴充 `src/types/` 的 leaders / standings / home 型別，沿用現有 `fetchData<T>(kind)` 抽象。本期 GAS Sheets transformer 不變動（standings/dragon 已 OK；home/leaders/schedule/roster 暫走 static fallback，符合 Issue #13 留下的設計），新增資料欄位（matrix net points / 11 leader categories / offense-defense-net / weekMatchups）走 static JSON 路徑。`gas/Code.gs` 的更新由主人手動處理。
- **元件層**：B 群（功能補齊）以「擴充既有 island」+「新增 view component」為主，不改變頁面骨架；C 群（龍虎榜細節）擴充 `DragonTabPanel` + `RosterHero`。所有新表格遵循 PC/mobile 雙呈現規則（style-rwd-list）。
- **互動共用**：B1（home matchups）+ B7（schedule toggle）共用一個切換 utility（智慧預設邏輯：games 是否有 home/away → 預設模式）+ URL query sync。
- **狀態三態**：所有非同步元件處理 Loading（skeleton 形狀對應內容）/ Error（含 retry）/ Empty（空狀態提示）三狀態。

**Tech Stack:** Astro 6（multi-page、Zero JS by default）、Tailwind CSS 4（@theme tokens）、TypeScript strict、React island（`client:visible`）、Vitest（jsdom）unit、Playwright E2E。

**個人風格規則**：命中 2 條 — `style-rwd-list`（B2/B3/B5/C1 多欄位表格）+ `style-skeleton-loading`（所有 island 三狀態 + tab 切換）。下方 Style Rules Compliance 對照各 task 適用情境。

**Code Graph**：圖未建立，跳過。

**測試前置就位（qa-v2 Phase 1.2 已完成）**：
- 8 個新 E2E spec 檔（home-matchups / standings-matrix / leaders / leaders-team / roster-attendance / roster-team-filter / dragon-tab-grouping / schedule-toggle）
- 2 個 E2E 既有 spec 擴充（dragon-tab + hero-roster-tab）
- 2 個新 integration test（api-standings-matrix + api-leaders-extended）
- 4 個 fixture 擴充（standings/leaders/home/dragon）
- qaplan 完整 Coverage Matrix 對照所有 U-/I-/E-* IDs

---

## Coverage Matrix（從 `docs/delivery/issue-14_qaplan.md` 引入）

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| U-101 | home matchups 解析（HomeData → WeekMatchups view model） | T2 | unit test `tests/unit/home-matchups-utils.test.ts` |
| U-102 | 智慧切換 utility（games[] 無 home/away → combo 模式） | T2 | unit test `tests/unit/schedule-toggle-utils.test.ts` |
| U-201 | matrix parser（json → row[][]） | T5 | unit test `tests/unit/standings-matrix-utils.test.ts` |
| U-202 | matrix cell sign → CSS class（pos / neg / zero） | T5 | 同上 |
| U-301 | LeaderCategory 型別擴充 + CATEGORY_TITLES 對齊 | T6 | unit test 擴充 `tests/unit/leaders-format.test.ts` |
| U-401 | offense / defense / net 解析（API → TeamLeaderTable） | T6 | 同上 |
| U-501 | 出席率計算（only count 1/0/x，排除 ?） | T7 | unit test 擴充 `tests/unit/roster-utils.test.ts` |
| I-1 | standings API fetch 含 matrix 欄位 | T1 + T5 | integration test `tests/integration/api-standings-matrix.integration.test.ts`（已 RED 待 GREEN）|
| I-2 | leaders API fetch → 11 類 + 三隊伍表結構 | T1 + T6 | integration test `tests/integration/api-leaders-extended.integration.test.ts`（已 RED 待 GREEN）|
| E-101~E-106 | 首頁 6 組對戰 + toggle + 智慧預設 + URL sync + AC-E2 | T2 + T3 | `tests/e2e/features/home/home-matchups.spec.ts` |
| E-201~E-205 | 戰績矩陣 6×6 + 對角線「—」+ 顏色 + RWD scroll + 三狀態 | T5 | `tests/e2e/features/standings/standings-matrix.spec.ts` |
| E-301~E-304 | 領先榜 11 類 + 5 新類別 + 順序 + 部分空 | T6 | `tests/e2e/features/boxscore/leaders.spec.ts` |
| E-401~E-403 | 隊伍三表 + 6 列 + 空表獨立 | T6 | `tests/e2e/features/boxscore/leaders-team.spec.ts` |
| E-501~E-503 | 日期欄頭 + 出席率 + legend | T7 | `tests/e2e/features/roster/roster-attendance.spec.ts` |
| E-601~E-604 | 7 chips + 篩選 + 全部 + aria-pressed | T8 | `tests/e2e/features/roster/roster-team-filter.spec.ts` |
| E-701~E-702 | 賽程頁 toggle + 智慧預設 | T2 + T4 | `tests/e2e/features/schedule/schedule-toggle.spec.ts` |
| E-801~E-802 | 龍虎榜 平民/奴隸區分組標題 | T9 | `tests/e2e/features/roster/dragon-tab-grouping.spec.ts` |
| E-803~E-804 | 選秀規則連結 + 安全屬性 | T9 | `tests/e2e/features/roster/dragon-tab.spec.ts`（已擴充） |
| E-901~E-902 | hero subtitle + 三 chip | T9 | `tests/e2e/features/roster/hero-roster-tab.spec.ts`（已擴充） |

---

## 檔案結構規劃

### 新建（src/）

| 檔案 | 職責 | Task |
|------|------|------|
| `src/lib/matchups-toggle-utils.ts` | 智慧切換邏輯 + URL query helper（B1/B7 共用） | T2 |
| `src/lib/standings-matrix-utils.ts` | matrix cell sign → CSS class 工具 | T5 |
| `src/components/home/MatchupsBlock.tsx` | 首頁 6 組對戰預覽 + toggle island | T3 |
| `src/components/standings/StandingsMatrix.tsx` | 6×6 戰績矩陣（含 RWD 橫向捲動）| T5 |
| `src/components/boxscore/TeamLeadersSection.tsx` | offense/defense/net 三張隊伍表 | T6 |
| `src/components/roster/AttendanceLegend.tsx` | 出席符號說明 legend | T7 |
| `src/components/roster/TeamFilterChips.tsx` | 7 個 chip 篩選列 | T8 |

### 修改（src/）

| 檔案 | 變更 | Task |
|------|------|------|
| `src/types/leaders.ts` | LeaderCategory 加 5 類；LeaderSeason 加新 5 類 + offense/defense/net；新增 TeamLeaderTable / TeamLeaderRow；export `LEADER_CATEGORIES_ORDERED` | T1 |
| `src/types/standings.ts` | 加 `MatrixCell = number \| null` + `MatrixData`；StandingsData.matrix 改型別 | T1 |
| `src/types/home.ts` | 加 `MatchupCombo` / `MatchupGame` / `WeekMatchups`；HomeData 加 `weekMatchups?` | T1 |
| `public/data/standings.json` | matrix.results cell 從 +1/-1 改為實際淨勝分（搭配 fixture 數值） | T1 |
| `public/data/leaders.json` | 從 stub 擴充為完整 11 類 + offense/defense/net 範例資料 | T1 |
| `public/data/home.json` | 加 `weekMatchups` 欄位（combos + games 兩視圖） | T1 |
| `public/data/dragon.json` | 加 `rulesLink` 欄位（範例 URL） | T1 |
| `src/components/home/HomeDashboard.tsx` | 把現有 `<ScheduleBlock>` 替換為新的 `<MatchupsBlock>`（保留 schedule 連結） | T3 |
| `src/components/home/ScheduleBlock.tsx` | **刪除**（被 MatchupsBlock 取代；視 commit 而定改 export legacy alias 或直接刪） | T3 |
| `src/components/schedule/ScheduleApp.tsx` | 在當前週 GameCard 上方加 toggle，整合 matchups-toggle-utils | T4 |
| `src/components/schedule/GameCard.tsx` | 支援「對戰組合」與「賽程順序」兩種 mode 切換顯示 | T4 |
| `src/components/standings/StandingsApp.tsx` | 載入後渲染 `<StandingsMatrix>` 於排名表下方 | T5 |
| `src/components/boxscore/LeadersPanel.tsx` | CATEGORIES 改用 LEADER_CATEGORIES_ORDERED；下方加 `<TeamLeadersSection>` | T6 |
| `src/components/boxscore/LeaderCard.tsx` | CATEGORY_TITLES 加 5 新類別；val format 支援百分比類（p2pct/p3pct/ftpct）顯示 `%` 後綴 | T6 |
| `src/lib/leaders-format.ts` | 加 `formatPercentageVal(val)`、export 新 ORDERED 常數對齊 fixture | T6 |
| `src/components/roster/RosterTabPanel.tsx` | 重構 `TeamSection` 表格：頂端日期欄頭 + 每位球員出席率欄；mobile card 加出席率 | T7 |
| `src/components/roster/RosterApp.tsx` | 上方插入 `<AttendanceLegend>`（roster tab 才顯示）+ `<TeamFilterChips>`；管理 `selectedTeam` state | T7 + T8 |
| `src/lib/roster-utils.ts` | 加 `computeAttendanceSummary(att: AttValue[])` → `{ played, total, rate }` | T7 |
| `src/components/roster/DragonTabPanel.tsx` | 用 civilianThreshold 切分 players 成兩組，加平民區/奴隸區 group titles + 規則連結 | T9 |
| `src/components/roster/RosterHero.tsx` | 接收 `activeTab` prop，dragon tab 時顯示新 subtitle + 三 chip | T9 |
| `src/components/roster/RosterApp.tsx` | RosterHero 傳入 `activeTab`（讓 hero 知道切到 dragon 換內容） | T9 |

### 新建（tests/unit/）

| 檔案 | 職責 |
|------|------|
| `tests/unit/matchups-toggle-utils.test.ts` | U-101 + U-102（智慧切換 + URL query） |
| `tests/unit/standings-matrix-utils.test.ts` | U-201 + U-202（matrix parser + cell sign class）|

### 修改（tests/unit/）

| 檔案 | 變更 |
|------|------|
| `tests/unit/leaders-format.test.ts` | 加 11 類 CATEGORY_TITLES 對齊 + `formatPercentageVal` test（U-301 + U-401）|
| `tests/unit/roster-utils.test.ts` | 加 `computeAttendanceSummary` test（U-501）|

### 既有測試已就位（不需新增，T1-T9 須讓它們從 RED → GREEN）

- E2E：8 個新 spec + 2 個既有 spec 擴充（見 Coverage Matrix）
- Integration：`api-standings-matrix` + `api-leaders-extended`
- Fixtures：standings / leaders / home / dragon 已擴充

---

## Task 相依分析

| Task | 描述 | 相依 | Batch |
|------|------|------|-------|
| T1 | 型別 + 資料層（types + JSON stub） | 無 | 1 |
| T2 | matchups-toggle-utils + unit test | T1 | 2 |
| T5 | StandingsMatrix 元件 + utils + integrate | T1 | 2 |
| T6 | Leaders 11 類 + TeamLeadersSection | T1 | 2 |
| T7 | Roster 出席率欄 + Legend + utils | T1 | 2 |
| T8 | TeamFilterChips + integrate | T1 | 2 |
| T9 | Dragon 分組 + 規則連結 + Hero subtitle/chips | T1 | 2 |
| T3 | MatchupsBlock（home B1） | T1 + T2 | 3 |
| T4 | ScheduleApp toggle（B7） | T1 + T2 | 3 |

**Batch 1（1 task）**：T1
**Batch 2（5 tasks 並行）**：T5, T6, T7, T8, T9（皆只依賴 T1）+ T2（小型 utility）— 共 6 並行
**Batch 3（2 tasks 並行）**：T3, T4

---

## Style Rules Compliance

### style-rwd-list（多欄位列表 RWD）

適用 task：T5（matrix）、T6（11 類 leaders + 3 隊伍表）、T7（roster 出席率欄）、T9（dragon 分組）

要求：
- PC（md+）：`<table>` 橫排展開所有欄位
- Mobile（< md）：改為 card / 卡片形式，主要欄位作標題 + 次要欄位 label-value
- 各 task delivery 檔的 `## Style Rules` section 必須含本規則 + 範例

不適用 task：T2（utility 無 UI）、T3（首頁 matchups 是 6 卡片，非「列表」型）、T4（schedule 已是 GameCard）、T8（chip filter 為按鈕列）

### style-skeleton-loading（非同步資料載入）

適用 task：T1（資料對齊）、T3（home matchups）、T4（schedule toggle）、T5（standings matrix 三狀態）、T6（leaders 11 類）、T7（roster 出席率）、T8（chip filter）、T9（dragon 分組）

要求：
- 每個 island 必須處理 `loading` / `error` / `empty` 三狀態
- Loading state：skeleton 形狀對應真實內容（卡片區用卡片形狀、標題區用長條）
- 禁止整頁 spinner、禁止空白等資料、禁止 `mounted` opacity 動畫
- 使用 `animate-pulse`（Tailwind 內建）
- 所有 task delivery 檔的 `## Style Rules` section 必須含本規則

不適用 task：T2（utility 無 UI）

---

## Tasks

### T1: 型別 + 資料層擴充

**Goal**：把所有新欄位的 TypeScript 型別加到 `src/types/`，並更新 `public/data/*.json` stub 資料，使 fetcher 從 JSON path 取得時能拿到完整資料。讓 integration test（I-1, I-2）從 RED → GREEN。

**Files**：
- `src/types/leaders.ts`
- `src/types/standings.ts`
- `src/types/home.ts`
- `public/data/leaders.json`
- `public/data/standings.json`
- `public/data/home.json`
- `public/data/dragon.json`

**Steps**：
- [ ] **Step 1**：擴充 `src/types/leaders.ts` 與 `tests/fixtures/leaders.ts` 對齊。
  ```ts
  // src/types/leaders.ts
  export type LeaderCategory =
    | 'scoring' | 'rebound' | 'assist' | 'steal' | 'block' | 'eff'
    | 'turnover' | 'foul' | 'p2pct' | 'p3pct' | 'ftpct';

  export const LEADER_CATEGORIES_ORDERED: readonly LeaderCategory[] = [
    'scoring', 'rebound', 'assist', 'steal', 'block', 'eff',
    'turnover', 'foul', 'p2pct', 'p3pct', 'ftpct',
  ] as const;

  export interface TeamLeaderRow {
    team: string;
    rank: number;
    values: number[];
  }

  export interface TeamLeaderTable {
    headers: string[];
    rows: TeamLeaderRow[];
  }

  export interface LeaderSeason {
    label: string;
    scoring: LeaderEntry[];
    rebound: LeaderEntry[];
    assist: LeaderEntry[];
    steal: LeaderEntry[];
    block: LeaderEntry[];
    eff: LeaderEntry[];
    turnover?: LeaderEntry[];
    foul?: LeaderEntry[];
    p2pct?: LeaderEntry[];
    p3pct?: LeaderEntry[];
    ftpct?: LeaderEntry[];
    offense?: TeamLeaderTable;
    defense?: TeamLeaderTable;
    net?: TeamLeaderTable;
  }
  ```
- [ ] **Step 2**：擴充 `src/types/standings.ts`：
  ```ts
  export type MatrixCell = number | null;
  export interface MatrixData {
    teams: string[];
    results: MatrixCell[][];
  }
  export interface StandingsData {
    season: number;
    phase: string;
    currentWeek: number;
    teams: TeamStanding[];
    matrix?: MatrixData;
  }
  ```
- [ ] **Step 3**：擴充 `src/types/home.ts`：加 `MatchupCombo` / `MatchupGame` / `WeekMatchups`，HomeData 加 `weekMatchups?`（型別與 `tests/fixtures/home.ts` 對齊）。
- [ ] **Step 4**：更新 `public/data/standings.json` 的 `matrix.results`，cells 從 `+1/-1` 改為真實淨勝分（用 `tests/fixtures/standings.ts` 的 `mockMatrix6x6()` 數值即可），對角線保持 `null`。
- [ ] **Step 5**：擴充 `public/data/leaders.json`，從 4 個 empty stub 改為完整 11 類個人 + offense / defense / net 三表格範例（用 fixture 數值，賽季 key `25`）。
- [ ] **Step 6**：擴充 `public/data/home.json`，加 `weekMatchups`（含 6 組 combos + 6 場 games，games 全填 home/away → 預設「賽程順序」）。
- [ ] **Step 7**：擴充 `public/data/dragon.json`，加 `rulesLink: "https://example.com/rules"`（部署前主人手動換成正式 URL）。
- [ ] **Step 8**：跑 `npx tsc --noEmit -p tsconfig.json`，型別必須通過。
- [ ] **Step 9**：跑 `npm test -- tests/integration/api-standings-matrix.integration.test.ts tests/integration/api-leaders-extended.integration.test.ts`，integration test 必須全綠（I-1 + I-2 從 RED → GREEN）。

**Tests** （驗收標準）：
- I-1（已就位 RED）：`api-standings-matrix.integration.test.ts` 4 cases all pass
- I-2（已就位 RED）：`api-leaders-extended.integration.test.ts` 4 cases all pass
- TS check exit 0

**Style Rules**：N/A（純資料層）

---

### T2: matchups-toggle-utils + URL query helper

**Goal**：寫共用的「智慧切換預設」+「URL query 同步」utility，B1（home）+ B7（schedule）兩個 toggle 都用同一份。

**Files**：
- `src/lib/matchups-toggle-utils.ts`（新）
- `tests/unit/matchups-toggle-utils.test.ts`（新）

**Steps**：
- [ ] **Step 1**：建立 `src/lib/matchups-toggle-utils.ts`：
  ```ts
  import type { MatchupGame, WeekMatchups } from '../types/home';

  export type MatchupView = 'combo' | 'order';

  /**
   * 智慧預設邏輯：games[] 任一筆 home/away 非空 → 'order'；否則 'combo'。
   * 若 weekMatchups 為 undefined，回傳 'combo'（保底）。
   */
  export function resolveDefaultView(weekMatchups: WeekMatchups | undefined): MatchupView {
    if (!weekMatchups) return 'combo';
    const anyPublished = weekMatchups.games.some((g) => g.home || g.away);
    return anyPublished ? 'order' : 'combo';
  }

  /** 解析 URL query → MatchupView，無效值回 null（呼叫端決定 fallback） */
  export function parseViewQuery(search: string): MatchupView | null {
    const params = new URLSearchParams(search);
    const v = params.get('view');
    return v === 'combo' || v === 'order' ? v : null;
  }

  /** 寫入 URL query 不重整頁面 */
  export function updateViewQuery(view: MatchupView): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.replaceState(null, '', url.toString());
  }
  ```
- [ ] **Step 2**：寫 `tests/unit/matchups-toggle-utils.test.ts`，cover U-101 + U-102：
  ```ts
  import { describe, it, expect } from 'vitest';
  import { resolveDefaultView, parseViewQuery } from '../../src/lib/matchups-toggle-utils';
  import { mockHomeWithWeekMatchups } from '../fixtures/home';

  describe('matchups-toggle-utils', () => {
    it('U-102: games 全空 → combo', () => {
      const data = mockHomeWithWeekMatchups({ gamesPublished: false });
      expect(resolveDefaultView(data.weekMatchups)).toBe('combo');
    });
    it('U-102: games 有 home/away → order', () => {
      const data = mockHomeWithWeekMatchups({ gamesPublished: true });
      expect(resolveDefaultView(data.weekMatchups)).toBe('order');
    });
    it('U-102: weekMatchups undefined → combo（保底）', () => {
      expect(resolveDefaultView(undefined)).toBe('combo');
    });
    it('U-101: parseViewQuery 解析 ?view=combo', () => {
      expect(parseViewQuery('?view=combo')).toBe('combo');
      expect(parseViewQuery('?view=order')).toBe('order');
      expect(parseViewQuery('?view=invalid')).toBeNull();
      expect(parseViewQuery('')).toBeNull();
    });
  });
  ```
- [ ] **Step 3**：跑 `npm test -- tests/unit/matchups-toggle-utils.test.ts`，全綠。

**Tests**：
- U-101 + U-102：unit test 4 cases all pass

**Style Rules**：N/A（utility 無 UI）

---

### T3: 首頁對戰預覽（B1 + B2.* + AC-E2）

**Goal**：建立 `MatchupsBlock` 替換現有 `ScheduleBlock`，顯示 6 組對戰預覽 + 「對戰組合 / 賽程順序」toggle，含智慧預設、URL sync、unpublished hint。

**Files**：
- `src/components/home/MatchupsBlock.tsx`（新）
- `src/components/home/HomeDashboard.tsx`（替換子元件）
- `src/components/home/ScheduleBlock.tsx`（刪除）

**Steps**：
- [ ] **Step 1**：建立 `src/components/home/MatchupsBlock.tsx`：
  ```tsx
  import { useState } from 'react';
  import type { HomeData, MatchupCombo, MatchupGame } from '../../types/home';
  import { TEAM_CONFIG } from '../../config/teams';
  import {
    resolveDefaultView,
    parseViewQuery,
    updateViewQuery,
    type MatchupView,
  } from '../../lib/matchups-toggle-utils';

  interface Props {
    weekMatchups: HomeData['weekMatchups'];
    scheduleInfo: HomeData['scheduleInfo'];
    baseUrl: string;
  }

  export function MatchupsBlock({ weekMatchups, scheduleInfo, baseUrl }: Props) {
    const initialView: MatchupView = (() => {
      const fromQuery = typeof window !== 'undefined' ? parseViewQuery(window.location.search) : null;
      return fromQuery ?? resolveDefaultView(weekMatchups);
    })();
    const [view, setView] = useState<MatchupView>(initialView);

    if (!weekMatchups || (weekMatchups.combos.length === 0 && weekMatchups.games.length === 0)) {
      return null; // empty 由 HomeDashboard 上層處理
    }

    const handleSelect = (next: MatchupView) => {
      setView(next);
      updateViewQuery(next);
    };

    const isOrderUnpublished = weekMatchups.games.every((g) => !g.home && !g.away);
    // [其餘 JSX：toggle、6 卡片、unpublished hint、schedule 連結]
    return (
      <section data-testid="home-matchups" className="bg-white border border-warm-2 rounded-2xl p-5 mb-4">
        {/* docstring 中的 hooks: matchups-toggle, matchups-toggle-combo, matchups-toggle-order, matchups-combo-list, matchups-order-list, matchup-card, matchups-unpublished-hint */}
        {/* 詳實作見 spec 對應的 selectors */}
      </section>
    );
  }
  ```
  關鍵 testids（對應已寫的 spec）：
  - `home-matchups`、`matchups-toggle`、`matchups-toggle-combo`、`matchups-toggle-order`（`aria-pressed`）
  - `matchups-combo-list`、`matchups-order-list`（依 view 顯示其一）
  - `matchup-card`（each card；combo view 含 `data-combo`，order view 含 `data-game-num`）
  - `matchups-unpublished-hint`（unpublished + 在 order view 時顯示，文字「本週場次順序尚未公告」）
- [ ] **Step 2**：修改 `src/components/home/HomeDashboard.tsx`：
  ```tsx
  import { MatchupsBlock } from './MatchupsBlock';
  // 移除 import { ScheduleBlock } from './ScheduleBlock';

  // 在 JSX 中：
  <MatchupsBlock
    weekMatchups={data.weekMatchups}
    scheduleInfo={data.scheduleInfo}
    baseUrl={baseUrl}
  />
  ```
- [ ] **Step 3**：刪除 `src/components/home/ScheduleBlock.tsx`（已被 MatchupsBlock 取代）；調整 `src/pages/index.astro` 的 island hydration 為 `client:visible`。
- [ ] **Step 4**：本機驗收 — `npm run dev` → 開 `http://localhost:4321/` → 看到 6 卡片 + toggle 可切，URL 變化反應 query。
- [ ] **Step 5**：跑 `npx playwright test tests/e2e/features/home/home-matchups.spec.ts --project=features`，全綠（E-101 ~ E-106）。
- [ ] **Step 6**：跑 `npx playwright test tests/e2e/features/home/`（既有 home spec），確認沒退化。

**Tests**：
- E-101 ~ E-106：6 cases all pass on `home-matchups.spec.ts`
- regression：existing home specs（home-rwd / home-hero-schedule / home-leaders-dragon / home-standings / home-states）all green

**Style Rules**：
- `style-skeleton-loading`：MatchupsBlock 的 loading state（資料未到時）由 HomeDashboard 上層的 SkeletonState 已涵蓋，本元件 mount 後資料已就位
- 不適用 `style-rwd-list`（卡片格網非「列表」）

---

### T4: 賽程頁 toggle（B7 + B9.*）

**Goal**：在 `/schedule` 頁面加入「對戰組合 / 賽程順序」toggle，邏輯與 home 一致（共用 matchups-toggle-utils）。

**Files**：
- `src/components/schedule/ScheduleApp.tsx`
- `src/components/schedule/GameCard.tsx`

**Steps**：
- [ ] **Step 1**：在 `ScheduleApp.tsx` 內 active week section 上方插入 toggle UI（`schedule-matchups-toggle` testid）：
  ```tsx
  import { resolveDefaultView, parseViewQuery, updateViewQuery, type MatchupView } from '../../lib/matchups-toggle-utils';
  // 新增 useState<MatchupView>，依 activeWeek 的 games[] 是否有 home/away 決定預設
  // 對於 schedule data：resolveDefaultView 改用 schedule shape，可在 ScheduleApp 內 inline 同邏輯：
  const isOrderPublished = activeWeekData.games.some(g => g.home || g.away);
  const initial = parseViewQuery(window.location.search) ?? (isOrderPublished ? 'order' : 'combo');
  ```
- [ ] **Step 2**：依 view 切換渲染：
  - `view === 'combo'` → 渲染 `<GameCard matchupSource="combo" />` 列表 + `schedule-matchups-combo-list`
  - `view === 'order'` → 渲染 `<GameCard matchupSource="order" />` 列表 + `schedule-matchups-order-list`
- [ ] **Step 3**：擴充 `GameCard.tsx` 接受 `matchupSource: 'combo' | 'order'` prop，控制顯示 `combo` 編號 vs `num + time` 場次標籤。
- [ ] **Step 4**：unpublished hint：`isOrderPublished === false` 且 `view === 'order'` → 顯示 `schedule-matchups-unpublished-hint`，文字同 home。
- [ ] **Step 5**：本機驗收：`/schedule` 看到 toggle 切換正常。
- [ ] **Step 6**：跑 `npx playwright test tests/e2e/features/schedule/schedule-toggle.spec.ts`，全綠（E-701 + E-702）。
- [ ] **Step 7**：跑 `npx playwright test tests/e2e/features/schedule.spec.ts`，沒退化（既有 schedule 主功能）。

**Tests**：
- E-701 + E-702：5 cases all pass
- regression：`schedule.spec.ts` + `schedule.regression.spec.ts` all green

**Style Rules**：
- `style-skeleton-loading`：SkeletonState 既有，toggle 不需新 skeleton
- 不適用 `style-rwd-list`（GameCard 已是卡片型）

---

### T5: 戰績矩陣（B2 + AC-E1 + BQ-1）

**Goal**：建立 `StandingsMatrix` 元件，顯示 6×6 淨勝分矩陣（對角線「—」、正分綠 / 負分紅），手機橫向捲動，整合進 `StandingsApp`。

**Files**：
- `src/lib/standings-matrix-utils.ts`（新）
- `src/components/standings/StandingsMatrix.tsx`（新）
- `src/components/standings/StandingsApp.tsx`（整合）
- `tests/unit/standings-matrix-utils.test.ts`（新）

**Steps**：
- [ ] **Step 1**：建立 `src/lib/standings-matrix-utils.ts`：
  ```ts
  import type { MatrixCell } from '../types/standings';

  export type MatrixCellSign = 'self' | 'positive' | 'negative' | 'zero';

  export function getCellSign(cell: MatrixCell): MatrixCellSign {
    if (cell === null) return 'self';
    if (cell > 0) return 'positive';
    if (cell < 0) return 'negative';
    return 'zero';
  }

  export function getCellClass(cell: MatrixCell): string {
    const sign = getCellSign(cell);
    return `matrix-cell--${sign}`;
  }

  /** 顯示文字：null → "—"，其他 → 數字字串（正數加 + 號）*/
  export function formatCellText(cell: MatrixCell): string {
    if (cell === null) return '—';
    if (cell > 0) return `+${cell}`;
    return String(cell);
  }
  ```
- [ ] **Step 2**：寫 `tests/unit/standings-matrix-utils.test.ts`，cover U-201 + U-202（getCellSign 對 null/正/負/零、getCellClass 字串、formatCellText 對各 cell）。
- [ ] **Step 3**：建立 `src/components/standings/StandingsMatrix.tsx`：
  ```tsx
  import type { MatrixData } from '../../types/standings';
  import { TEAM_CONFIG } from '../../config/teams';
  import { getCellClass, formatCellText } from '../../lib/standings-matrix-utils';

  interface Props {
    matrix: MatrixData;
  }

  export function StandingsMatrix({ matrix }: Props) {
    return (
      <section data-testid="standings-matrix" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
        <h2 className="font-condensed font-bold text-navy text-lg mb-3">對戰勝敗矩陣</h2>
        <div data-testid="matrix-scroll" className="overflow-x-auto">
          <table data-testid="matrix-table" className="min-w-[500px] w-full text-sm border-collapse">
            <thead>
              <tr>
                <th></th>
                {matrix.teams.map(t => <th key={t} style={{ color: TEAM_CONFIG[t]?.color ?? '#999' }}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrix.teams.map((rowTeam, i) => (
                <tr key={rowTeam}>
                  <th style={{ color: TEAM_CONFIG[rowTeam]?.color ?? '#999' }}>{rowTeam}</th>
                  {matrix.results[i].map((cell, j) => (
                    <td
                      key={j}
                      data-testid="matrix-cell"
                      data-row={rowTeam}
                      data-col={matrix.teams[j]}
                      data-net-points={cell ?? ''}
                      className={getCellClass(cell)}
                    >
                      {formatCellText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
  ```
- [ ] **Step 4**：在 `src/styles/global.css` 的 `@theme` 中加 matrix cell 顏色 token（不 hardcode）：
  ```css
  /* Matrix cell colors */
  .matrix-cell--positive { @apply text-green-700 bg-green-50; }
  .matrix-cell--negative { @apply text-red-700 bg-red-50; }
  .matrix-cell--zero { @apply text-txt-mid; }
  .matrix-cell--self { @apply text-txt-light; }
  ```
- [ ] **Step 5**：修改 `src/components/standings/StandingsApp.tsx`：
  ```tsx
  import { StandingsMatrix } from './StandingsMatrix';
  // 在 ok state 渲染：
  {data.matrix && <StandingsMatrix matrix={data.matrix} />}
  ```
  Loading / Error / Empty state 不渲染 matrix（沿用既有 SkeletonState/ErrorState/EmptyState）。
- [ ] **Step 6**：本機驗收 `/standings`，看到矩陣顯示正常。
- [ ] **Step 7**：跑 `npm test -- tests/unit/standings-matrix-utils.test.ts`，全綠。
- [ ] **Step 8**：跑 `npx playwright test tests/e2e/features/standings/standings-matrix.spec.ts`，全綠（E-201 ~ E-205）。
- [ ] **Step 9**：跑 `npx playwright test tests/e2e/features/standings.spec.ts`，沒退化。

**Tests**：
- U-201 + U-202：unit test 至少 4 cases pass
- E-201 ~ E-205：7 cases pass on standings-matrix.spec.ts
- regression：standings.spec.ts + standings.regression.spec.ts all green

**Style Rules**：
- `style-rwd-list`：matrix table 雖在 desktop 用 `<table>`，mobile 因為 cell value 短（淨勝分 ±10 內），改用 `overflow-x-auto` 橫向捲動而非 cards（這是 6×6 matrix 的特殊情境，與一般「列表」不同）。docstring 註明此例外
- `style-skeleton-loading`：StandingsApp 已有 SkeletonState，matrix 不另外加 skeleton（避免雙重）

---

### T6: 領先榜 11 類 + 隊伍三表（B3 + B4 + AC-E3 + BQ-2 + BQ-6）

**Goal**：擴充 `LeadersPanel` 顯示 11 類個人 leader（按 LEADER_CATEGORIES_ORDERED 順序），下方加 `TeamLeadersSection` 顯示 offense / defense / net 三張隊伍表。

**Files**：
- `src/components/boxscore/LeadersPanel.tsx`
- `src/components/boxscore/LeaderCard.tsx`
- `src/components/boxscore/TeamLeadersSection.tsx`（新）
- `src/lib/leaders-format.ts`
- `tests/unit/leaders-format.test.ts`

**Steps**：
- [ ] **Step 1**：擴充 `src/lib/leaders-format.ts`：
  ```ts
  import { LEADER_CATEGORIES_ORDERED, type LeaderCategory } from '../types/leaders';
  export { LEADER_CATEGORIES_ORDERED } from '../types/leaders';

  export const CATEGORY_TITLES: Record<LeaderCategory, string> = {
    scoring: '得分王',
    rebound: '籃板王',
    assist: '助攻王',
    steal: '抄截王',
    block: '阻攻王',
    eff: '效率王',
    turnover: '失誤王',
    foul: '犯規王',
    p2pct: '2P%',
    p3pct: '3P%',
    ftpct: 'FT%',
  };

  /** 百分率類顯示為 「48.5%」格式 */
  export function formatPercentageVal(val: number): string {
    return `${val.toFixed(1)}%`;
  }

  export function isPercentageCategory(cat: LeaderCategory): boolean {
    return cat === 'p2pct' || cat === 'p3pct' || cat === 'ftpct';
  }
  ```
- [ ] **Step 2**：擴充 `tests/unit/leaders-format.test.ts`，cover U-301（11 categories order + titles）+ U-401（formatPercentageVal）。
- [ ] **Step 3**：修改 `src/components/boxscore/LeaderCard.tsx`：
  ```tsx
  // val format 切換：百分比類用 formatPercentageVal，其他維持 toFixed(2)
  const formattedVal = isPercentageCategory(category)
    ? formatPercentageVal(e.val)
    : e.val.toFixed(2);
  ```
- [ ] **Step 4**：修改 `src/components/boxscore/LeadersPanel.tsx`：
  ```tsx
  import { LEADER_CATEGORIES_ORDERED } from '../../types/leaders';
  import { TeamLeadersSection } from './TeamLeadersSection';
  // 移除 const CATEGORIES = [...] 改用 LEADER_CATEGORIES_ORDERED
  // CATEGORIES → LEADER_CATEGORIES_ORDERED
  // empty check：所有 11 類別都空 → empty state
  const allEmpty = LEADER_CATEGORIES_ORDERED.every((c) => (season[c]?.length ?? 0) === 0);
  // 渲染：11 個 LeaderCard 後，再渲染 <TeamLeadersSection season={season} />
  ```
- [ ] **Step 5**：建立 `src/components/boxscore/TeamLeadersSection.tsx`：
  ```tsx
  import type { LeaderSeason, TeamLeaderTable } from '../../types/leaders';
  import { TEAM_CONFIG } from '../../config/teams';

  const TABLE_TITLES: Array<{ key: 'offense' | 'defense' | 'net'; label: string; testid: string }> = [
    { key: 'offense', label: '⚔️ 隊伍進攻', testid: 'team-leaders-offense' },
    { key: 'defense', label: '🛡️ 隊伍防守', testid: 'team-leaders-defense' },
    { key: 'net', label: '📈 進攻−防守差值', testid: 'team-leaders-net' },
  ];

  interface Props { season: LeaderSeason; }

  export function TeamLeadersSection({ season }: Props) {
    return (
      <section data-testid="team-leaders-section" className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {TABLE_TITLES.map(({ key, label, testid }) => {
          const table = season[key];
          return (
            <div key={key} data-testid={testid} data-team-stat={key} className="bg-white border border-warm-2 rounded-2xl p-4">
              <h3 className="font-condensed text-base font-bold mb-3">{label}</h3>
              {!table || table.headers.length === 0 || table.rows.length === 0 ? (
                <div data-testid="team-leaders-empty" className="text-txt-light text-sm py-6 text-center">
                  尚無資料
                </div>
              ) : (
                <table data-testid="team-leaders-table" className="w-full text-sm">
                  <thead>...</thead>
                  <tbody>
                    {table.rows.map(row => (
                      <tr key={row.team} data-testid="team-leaders-row" data-team={row.team}>
                        <td>...</td>
                        {row.values.map((v, i) => <td key={i}>{v.toFixed(1)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </section>
    );
  }
  ```
- [ ] **Step 6**：本機驗收 `/boxscore?tab=leaders`，看到 11 個個人卡片 + 3 張隊伍表。
- [ ] **Step 7**：跑 `npm test -- tests/unit/leaders-format.test.ts`，全綠。
- [ ] **Step 8**：跑 `npx playwright test tests/e2e/features/boxscore/leaders.spec.ts tests/e2e/features/boxscore/leaders-team.spec.ts`，全綠（E-301 ~ E-403）。
- [ ] **Step 9**：跑 `npx playwright test tests/e2e/features/boxscore/`，沒退化。

**Tests**：
- U-301 + U-401：unit tests pass
- E-301 ~ E-304 + E-401 ~ E-403：7 cases pass
- regression：existing boxscore specs all green

**Style Rules**：
- `style-rwd-list`：TeamLeadersSection 三表，mobile 用單欄 stacked（grid `md:grid-cols-3` → mobile `grid-cols-1`）；表格內欄位不多（最多 6 欄 in offense），mobile 仍用 table 但 wrap with `overflow-x-auto`
- `style-skeleton-loading`：LeadersPanel 既有 LeadersSkeleton，TeamLeadersSection 不另外加 skeleton（與 LeadersPanel 同步顯示）

---

### T7: 球員名單出席率欄 + Legend（B5 + B6.1 + B7 + AC-6 + AC-7）

**Goal**：擴充 `RosterTabPanel` 在每個 team table 頂端加日期欄頭、每位球員最右欄加出席率 + 場次比；上方加 `AttendanceLegend`。

**Files**：
- `src/lib/roster-utils.ts`
- `src/components/roster/AttendanceLegend.tsx`（新）
- `src/components/roster/RosterTabPanel.tsx`
- `src/components/roster/RosterApp.tsx`（裝載 Legend）
- `tests/unit/roster-utils.test.ts`

**Steps**：
- [ ] **Step 1**：擴充 `src/lib/roster-utils.ts` 加 `computeAttendanceSummary`：
  ```ts
  import type { AttValue } from '../types/roster';

  export interface AttendanceSummary {
    played: number;
    total: number;
    rate: number; // 0-100，整數
  }

  /**
   * 出席率計算：
   *  - played = att 中值為 1 的場次數
   *  - total = att 中值為 1 / 0 / 'x' 的場次數（已舉行的場次）
   *  - rate = round(played / total * 100)，total = 0 時 rate = 0
   *  - '?' 不計入（尚未舉行）
   */
  export function computeAttendanceSummary(att: AttValue[]): AttendanceSummary {
    let played = 0;
    let total = 0;
    for (const v of att) {
      if (v === '?') continue;
      total++;
      if (v === 1) played++;
    }
    const rate = total === 0 ? 0 : Math.round((played / total) * 100);
    return { played, total, rate };
  }
  ```
- [ ] **Step 2**：擴充 `tests/unit/roster-utils.test.ts`，cover U-501（4 case：全出席、含請假、含曠賽 x、含 ?、全 ?）。
- [ ] **Step 3**：建立 `src/components/roster/AttendanceLegend.tsx`：
  ```tsx
  export function AttendanceLegend() {
    return (
      <section data-testid="attendance-legend" className="px-4 md:px-8 mb-3 text-xs text-txt-mid">
        <span className="font-medium">出席符號說明：</span>
        <span className="ml-2">1 出席</span>
        <span className="ml-2">0 請假</span>
        <span className="ml-2">✕ 曠賽</span>
        <span className="ml-2">? 尚未舉行</span>
      </section>
    );
  }
  ```
- [ ] **Step 4**：修改 `src/components/roster/RosterTabPanel.tsx`：
  - 新增 `weeks` prop（從 RosterData 取，傳給 TeamSection）
  - PC table：第一個欄位「球員」，後接 `weeks.map(w => <th>{w.date}</th>)`，最後欄「出席率」
  - 每個 PlayerRow 渲染 N 個 AttBlock + `<td data-testid="roster-attendance-summary">{rate}% {played}/{total}</td>`，含 `data-rate` `data-played` `data-total`
  - Mobile card：保留現有，最下方加 `<div data-testid="roster-attendance-summary">...{rate}% ({played}/{total})</div>`
- [ ] **Step 5**：修改 `src/components/roster/RosterApp.tsx`：在 SubTabs 之下、RosterTabPanel 之上插入 `<AttendanceLegend />`（僅 roster tab 顯示）。
- [ ] **Step 6**：本機驗收 `/roster?tab=roster`，看到 legend + 日期欄頭 + 出席率。
- [ ] **Step 7**：跑 `npm test -- tests/unit/roster-utils.test.ts`，全綠。
- [ ] **Step 8**：跑 `npx playwright test tests/e2e/features/roster/roster-attendance.spec.ts`，全綠（E-501 ~ E-503）。
- [ ] **Step 9**：跑既有 roster specs（rwd / states / deep-link / hero-roster-tab / dragon-tab），不退化。

**Tests**：
- U-501：unit test all pass
- E-501 ~ E-503：6 cases pass
- regression：existing roster specs all green

**Style Rules**：
- `style-rwd-list`：roster table 已有 PC table + Mobile card 雙呈現（既有），新增日期欄頭與出席率欄遵循同模式
- `style-skeleton-loading`：RosterApp 既有 SkeletonState，沿用

---

### T8: 隊伍切換 chips（B6 + AC-8 + BQ-3）

**Goal**：在 `/roster?tab=roster` 上方加 7 個 chip（全部 + 紅黑藍綠黃白），點選後 filter 只顯示對應隊伍 section；點「全部」顯示六隊。

**Files**：
- `src/components/roster/TeamFilterChips.tsx`（新）
- `src/components/roster/RosterApp.tsx`（state + 整合）
- `src/components/roster/RosterTabPanel.tsx`（接受 `selectedTeam` prop，hide 非選中 team section）

**Steps**：
- [ ] **Step 1**：建立 `src/components/roster/TeamFilterChips.tsx`：
  ```tsx
  import { TEAM_CONFIG } from '../../config/teams';

  export type TeamFilterValue = 'all' | string;

  const TEAMS: TeamFilterValue[] = ['all', '紅', '黑', '藍', '綠', '黃', '白'];
  const LABELS: Record<TeamFilterValue, string> = {
    all: '全部隊伍', 紅: '紅', 黑: '黑', 藍: '藍', 綠: '綠', 黃: '黃', 白: '白',
  };

  interface Props {
    selected: TeamFilterValue;
    onSelect: (next: TeamFilterValue) => void;
  }

  export function TeamFilterChips({ selected, onSelect }: Props) {
    return (
      <div data-testid="roster-team-chips" className="flex flex-wrap gap-2 px-4 md:px-8 mb-3">
        {TEAMS.map((t) => {
          const isActive = selected === t;
          const color = t === 'all' ? '#999' : (TEAM_CONFIG[t]?.color ?? '#999');
          return (
            <button
              key={t}
              data-testid="roster-team-chip"
              data-team={t}
              aria-pressed={isActive}
              onClick={() => onSelect(t)}
              className={[
                'px-3 py-1 text-sm rounded-full border transition',
                isActive ? 'bg-orange text-white border-orange' : 'bg-white text-txt-dark border-warm-2 hover:border-orange',
              ].join(' ')}
              style={isActive ? undefined : { borderLeftColor: color, borderLeftWidth: 3 }}
            >
              {LABELS[t]}
            </button>
          );
        })}
      </div>
    );
  }
  ```
- [ ] **Step 2**：修改 `src/components/roster/RosterApp.tsx`：
  - 新 state `selectedTeam: TeamFilterValue`，初值從 URL `?team=` 取（既有 `highlightTeam` URL state 可整合或併行）
  - 在 SubTabs 下方、AttendanceLegend 之後渲染 `<TeamFilterChips selected={selectedTeam} onSelect={...} />`（roster tab 顯示）
- [ ] **Step 3**：修改 `src/components/roster/RosterTabPanel.tsx`：
  - 新 prop `selectedTeam: TeamFilterValue`
  - render team sections 時：`selectedTeam === 'all' || team.name.replace('隊','') === selectedTeam` → 顯示，否則 hidden（用 `hidden` class 而非 unmount，避免 unmount 動畫不順）
- [ ] **Step 4**：本機驗收 `/roster`，看到 chips 切換 filter 行為。
- [ ] **Step 5**：跑 `npx playwright test tests/e2e/features/roster/roster-team-filter.spec.ts`，全綠（E-601 ~ E-604）。
- [ ] **Step 6**：跑既有 roster specs，不退化（特別 deep-link 的 `?team=紅` 行為）。

**Tests**：
- E-601 ~ E-604：6 cases pass
- regression：roster/deep-link.spec.ts 仍綠（`?team=紅` 仍 highlight + scroll）

**Style Rules**：
- 不適用 `style-rwd-list`（chip 為按鈕列）
- `style-skeleton-loading`：chip filter 是 client-side 操作，無 API request，不需 skeleton

---

### T9: 龍虎榜分組 + 規則連結 + Hero 擴充（C1~C4）

**Goal**：龍虎榜：
- C1：在 `DragonTabPanel` 中以 civilianThreshold 切分為「平民區」（前 N 名 ≥ threshold）+「奴隸區」，顯示分組標題與完整文案
- C3：表格下方加「📋 查看完整選秀規則公告 →」連結（從 `dragon.rulesLink` 讀，`target="_blank"` + `rel="noopener noreferrer"`）
- C2 + C4：擴充 `RosterHero`，dragon tab 時顯示 subtitle「活躍度積分累計 · 決定下賽季選秀順位」+ 三個 chip（平民區 / 奴隸區 / ⚠ 季後賽加分於賽季結束後計入）

**Files**：
- `src/components/roster/DragonTabPanel.tsx`
- `src/components/roster/RosterHero.tsx`
- `src/components/roster/RosterApp.tsx`（傳 activeTab 給 hero）

**Steps**：
- [ ] **Step 1**：修改 `DragonTabPanel.tsx`，把現有 `players.map` 拆成兩組（平民 + 奴隸），分別包 `<section data-testid="dragon-group-civilian">` 與 `<section data-testid="dragon-group-slave">`。每組 section 含：
  ```tsx
  // 平民區
  <section data-testid="dragon-group-civilian" data-group="civilian">
    <h3 data-testid="dragon-group-civilian-title">
      🧑 平民區（前 {civilianCount} 名 · 可優先自由選擇加入隊伍）
    </h3>
    {/* 既有 table / cards 渲染這組球員 */}
  </section>
  // 奴隸區
  <section data-testid="dragon-group-slave" data-group="slave">
    <h3 data-testid="dragon-group-slave-title">
      ⛓️ 奴隸區（第 {civilianCount + 1} 名起 · 為聯盟貢獻過低淪為奴隸，無法自由選擇進入哪一隊）
    </h3>
    {/* 同上 */}
  </section>
  ```
  其中 `civilianCount = players.filter(p => p.total >= civilianThreshold).length`。
- [ ] **Step 2**：保留現有 `civilian-divider` testid（向後相容），以「分組標題」取代「分隔線」為主視覺；divider 可改為 group section 之間的 spacing。
- [ ] **Step 3**：在 `DragonTabPanel.tsx` 結尾加規則連結：
  ```tsx
  {data.rulesLink && (
    <div className="px-4 md:px-8 py-4 text-center">
      <a
        data-testid="dragon-rules-link"
        href={data.rulesLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-bold text-orange hover:underline"
      >
        📋 查看完整選秀規則公告 →
      </a>
    </div>
  )}
  ```
- [ ] **Step 4**：修改 `RosterHero.tsx` 接受新 prop `activeTab: 'roster' | 'dragon'`：
  ```tsx
  interface Props {
    season: number;
    phase: string;
    civilianThreshold: number;
    activeTab: 'roster' | 'dragon';
  }

  export function RosterHero({ season, phase, civilianThreshold, activeTab }: Props) {
    const isDragon = activeTab === 'dragon';
    return (
      <header className="text-center px-4 py-6 md:py-10">
        <h1 data-testid="hero-title" className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2">
          {isDragon ? '龍虎榜' : 'ROSTER'} · 第 {season} 季
        </h1>
        <div data-testid="hero-subtitle" className="font-condensed text-base md:text-lg text-txt-mid">
          {isDragon
            ? '活躍度積分累計 · 決定下賽季選秀順位'
            : `${phase} · 平民線 ${civilianThreshold} 分`}
        </div>
        {isDragon && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span data-testid="hero-chip-civilian" className="px-2 py-1 bg-warm-1 rounded-full">平民區</span>
            <span data-testid="hero-chip-slave" className="px-2 py-1 bg-warm-1 rounded-full">奴隸區</span>
            <span data-testid="hero-chip-playoff-note" className="px-2 py-1 bg-warm-1 rounded-full">⚠ 季後賽加分於賽季結束後計入</span>
          </div>
        )}
      </header>
    );
  }
  ```
- [ ] **Step 5**：修改 `RosterApp.tsx` 傳 `activeTab` 給 `<RosterHero>`。
- [ ] **Step 6**：本機驗收 `/roster?tab=dragon`，看到分組標題、規則連結、hero subtitle/chips；切回 roster tab 看到 hero 恢復原樣。
- [ ] **Step 7**：跑：
  ```
  npx playwright test tests/e2e/features/roster/dragon-tab.spec.ts \
                      tests/e2e/features/roster/dragon-tab-grouping.spec.ts \
                      tests/e2e/features/roster/hero-roster-tab.spec.ts
  ```
  全綠（E-801 ~ E-902）。
- [ ] **Step 8**：跑既有 roster specs，不退化。

**Tests**：
- E-801 ~ E-804：4 cases pass on dragon-tab + dragon-tab-grouping
- E-901 ~ E-902：2 cases pass on hero-roster-tab
- regression：existing roster specs all green

**Style Rules**：
- `style-rwd-list`：DragonTabPanel 既有 PC table + Mobile card 雙呈現，分組後兩組各自保留同模式
- `style-skeleton-loading`：RosterApp 既有 SkeletonState，沿用

---

## E2E 案例索引（給 Phase 6 qa-v2 使用）

所有 E2E spec 已由 qa-v2 在 Phase 1.2 寫好，Phase 6 直接執行。

| Spec 檔 | E-* IDs | Tag |
|---------|---------|-----|
| `tests/e2e/features/home/home-matchups.spec.ts` | E-101 ~ E-106 | `@home @issue-14 @matchups` |
| `tests/e2e/features/standings/standings-matrix.spec.ts` | E-201 ~ E-205 | `@standings @issue-14 @matrix` |
| `tests/e2e/features/boxscore/leaders.spec.ts` | E-301 ~ E-304 | `@boxscore @issue-14 @leaders` |
| `tests/e2e/features/boxscore/leaders-team.spec.ts` | E-401 ~ E-403 | `@boxscore @issue-14 @leaders @team-stats` |
| `tests/e2e/features/roster/roster-attendance.spec.ts` | E-501 ~ E-503 | `@roster @issue-14 @attendance` |
| `tests/e2e/features/roster/roster-team-filter.spec.ts` | E-601 ~ E-604 | `@roster @issue-14 @team-filter` |
| `tests/e2e/features/schedule/schedule-toggle.spec.ts` | E-701 ~ E-702 | `@schedule @issue-14 @matchups` |
| `tests/e2e/features/roster/dragon-tab.spec.ts`（擴充） | E-803 ~ E-804 | `@roster @dragon @issue-14` |
| `tests/e2e/features/roster/dragon-tab-grouping.spec.ts` | E-801 ~ E-802 | `@roster @dragon @issue-14` |
| `tests/e2e/features/roster/hero-roster-tab.spec.ts`（擴充） | E-901 ~ E-902 | `@roster @dragon @issue-14 @hero` |

Phase 6 執行命令（grep tag 一次跑全部 issue-14 案例）：
```bash
npx playwright test --grep @issue-14
```
P0 regression（每次 deploy 必跑）：
```bash
npx playwright test tests/e2e/regression/
```

---

## 部署驗收 Cases（給 Phase 5 ops-v2 使用）

部署流程：push `main` → GitHub Actions build → push `gh-pages` → GitHub Pages serve。

部署後驗收（手動或 CI）：
1. `./scripts/e2e-test.sh https://waterfat.github.io/taan-basketball-league/` — 跑全部 E2E 對 prod URL
2. 開 https://waterfat.github.io/taan-basketball-league/ 手動驗：
   - [ ] 首頁看到 6 組對戰預覽，有 toggle 可切換「對戰組合 / 賽程順序」
   - [ ] `/standings` 看到對戰勝敗矩陣 6×6（手機橫向捲動正常）
   - [ ] `/boxscore?tab=leaders` 看到 11 個個人類別卡片 + 3 張隊伍表
   - [ ] `/roster?tab=roster` 看到 7 個 chip + 出席符號 legend + 日期欄頭 + 出席率
   - [ ] `/roster?tab=dragon` 看到平民/奴隸區分組標題 + hero subtitle/chips + 選秀規則連結
   - [ ] `/schedule` 看到 toggle 可切換「對戰組合 / 賽程順序」

**部署前提醒主人**：
- 把 `public/data/dragon.json` 的 `rulesLink` 從 `https://example.com/rules` 改為實際公告 URL
- 視主人是否要更新 gas/Code.gs 來讓 Sheets API 也能回傳新欄位（matrix 淨勝分 / 11 類個人 / 三隊伍表 / weekMatchups）；本期前端只消費 static JSON，gas 更新可延後

---

**Plan 結束**

個人風格規則：命中 2 條 — [style-rwd-list, style-skeleton-loading]
