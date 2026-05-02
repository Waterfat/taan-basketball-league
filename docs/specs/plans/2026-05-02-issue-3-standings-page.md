# /standings 戰績榜頁面 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/standings` 從佔位頁升級為功能完整的戰績榜頁，含 6 隊排行、勝率、history 圓點、連勝/連敗 streak、三狀態（loading / error / empty）與 RWD（mobile 卡片堆疊、desktop 橫排表格），點擊隊伍導向 `/roster?team=<id>`。

**Architecture:** Astro page 內嵌 React island（沿用 Issue #1 ScheduleApp 的 state-machine pattern：`'loading' | 'error' | 'empty' | 'ok'`），三層資料 fallback 透過既有 `src/lib/api.ts` 的 `fetchData('standings')`。RWD 採 Tailwind utility 切換（`md:hidden` / `hidden md:table`），不重複渲染兩份 DOM。隊伍配色全部讀 `TEAM_CONFIG` 動態注入，不寫 inline style。

**Tech Stack:** Astro 6 multi-page、React 19 island、Tailwind CSS 4 `@theme` tokens、TypeScript strict、Vitest（unit）、Playwright（E2E features + regression）。

**個人風格規則**：命中 2 條 — style-rwd-list, style-skeleton-loading

**Code Graph**：圖未建立，跳過

---

## Coverage Matrix

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| U-1 | `formatPct(wins, losses)`：0/0 → '—'、否則 `xx.x%` | Task 1 Step 1 | unit test (`tests/unit/standings-utils.test.ts`) |
| U-2 | `getStreakClasses(streakType)`：win/lose/none 對應顏色 + 箭頭 class | Task 1 Step 1 | unit test |
| U-3 | `getHistoryDotColor(result, teamId)`：W → 隊伍主色、L → 灰 | Task 1 Step 1 | unit test |
| U-4 | `sortStandings(teams)` 不重排（identity） | Task 1 Step 1 | unit test |
| U-5 | `buildRosterLink(team)` → `/roster?team=<TeamColorId>` | Task 1 Step 1 | unit test |
| I-1 | `fetchData('standings')` GAS 失敗 → 走 `/data/standings.json` | （已存在 by qa-v2 補寫） | `tests/integration/api-fallback.integration.test.ts` (新增 standings cases) |
| I-2 | `fetchData('standings')` GAS+JSON 都失敗 → `source: error` | （已存在 by qa-v2 補寫） | 同上 |
| E-1 ~ E-16 | 17 個 E2E case（AC-1~14 + 2 個 [qa-v2 補充]） | （已存在 by qa-v2 補寫） | `tests/e2e/features/standings.spec.ts` |

> 說明：所有 E-* / I-* 的 spec 已由 qa-v2 在 Phase 1.2 補寫；本計畫的 task 只負責讓 ⬜ unit test 通過 + 讓 E2E spec 通過（即實作頁面）。

---

## 檔案結構規劃

| Path | Action | 職責 |
|------|--------|------|
| `src/types/standings.ts` | Create | 型別：`StreakType` / `HistoryResult` / `TeamStanding` / `StandingsData` |
| `src/lib/standings-utils.ts` | Create | 純函式：`formatPct` / `getStreakClasses` / `getHistoryDotColor` / `sortStandings` / `buildRosterLink` |
| `src/components/standings/SkeletonState.tsx` | Create | Loading 骨架（Hero + 6 列） |
| `src/components/standings/ErrorState.tsx` | Create | 「無法載入戰績」+ 重試按鈕 |
| `src/components/standings/EmptyState.tsx` | Create | 「賽季尚未開始 ⛹️」+ 「看球員名單」連結 |
| `src/components/standings/StandingsHero.tsx` | Create | Hero 標題 + 副標 |
| `src/components/standings/StandingsRow.tsx` | Create | 單列（mobile card + desktop table row 雙模式） |
| `src/components/standings/StandingsApp.tsx` | Create | React island，state machine + fetch + 渲染 |
| `src/pages/standings.astro` | Modify | 從佔位頁改為 `<StandingsApp client:load baseUrl={baseUrl} />` |
| `tests/unit/standings-utils.test.ts` | Create | U-1 ~ U-5（共 5 組 describe） |

---

## 並行與相依

```
Group A（並行）：Task 1 ∥ Task 2
Group B（單行，等 A）：Task 3（depends on Task 1 utils）
Group C（單行，等 A+B）：Task 4（depends on Task 1, 2, 3）
```

---

### Task 1：型別 + utils + unit tests（U-1 ~ U-5）

**Files:**
- Create: `src/types/standings.ts`
- Create: `src/lib/standings-utils.ts`
- Test: `tests/unit/standings-utils.test.ts`

## Style Rules（subagent 必讀，由 Step 0.5 注入）

> 此 task 僅涉及 types + utils + unit test，無 UI、無 fetch。trigger 不命中 → 無命中。

**無命中**

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/standings-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
  formatPct,
  getStreakClasses,
  getHistoryDotColor,
  sortStandings,
  buildRosterLink,
} from '../../src/lib/standings-utils';
import { mockFullStandings, mockZeroRecordStandings } from '../fixtures/standings';

describe('standings-utils', () => {
  // Covers: U-1 formatPct
  describe('formatPct', () => {
    it('0勝 0敗 → 回傳 "—"（避免誤導為 0.0%）', () => {
      expect(formatPct(0, 0)).toBe('—');
    });

    it('4勝 2敗 → 回傳 "66.7%"', () => {
      expect(formatPct(4, 2)).toBe('66.7%');
    });

    it('1勝 5敗 → 回傳 "16.7%"', () => {
      expect(formatPct(1, 5)).toBe('16.7%');
    });

    it('3勝 3敗 → 回傳 "50.0%"', () => {
      expect(formatPct(3, 3)).toBe('50.0%');
    });
  });

  // Covers: U-2 getStreakClasses
  describe('getStreakClasses', () => {
    it('win → 含 orange 文字色 + ↑ 箭頭', () => {
      const result = getStreakClasses('win');
      expect(result.colorClass).toMatch(/orange/);
      expect(result.arrow).toBe('↑');
    });

    it('lose → 含 紅色文字色 + ↓ 箭頭', () => {
      const result = getStreakClasses('lose');
      expect(result.colorClass).toMatch(/red/);
      expect(result.arrow).toBe('↓');
    });

    it('none → 預設灰色、無箭頭', () => {
      const result = getStreakClasses('none');
      expect(result.colorClass).toMatch(/gray|txt-mid/);
      expect(result.arrow).toBe('');
    });
  });

  // Covers: U-3 getHistoryDotColor
  describe('getHistoryDotColor', () => {
    it('W + 綠 → 回傳隊伍綠色 hex', () => {
      // 綠隊主色 #2e7d32（src/config/teams.ts）
      expect(getHistoryDotColor('W', '綠')).toBe('#2e7d32');
    });

    it('L + 任何隊 → 回傳灰色（不是隊伍主色）', () => {
      const grey = getHistoryDotColor('L', '綠');
      expect(grey).not.toBe('#2e7d32');
      expect(grey.toLowerCase()).toMatch(/^#[9ab][9ab][9ab]/i); // 灰系 hex（如 #9e9e9e / #aaa）
    });

    it('未知隊伍 → fallback 到灰（不 throw）', () => {
      expect(() => getHistoryDotColor('W', '紫')).not.toThrow();
    });
  });

  // Covers: U-4 sortStandings（identity，前端不重排）
  describe('sortStandings', () => {
    it('回傳順序與輸入完全一致（rank 由後台決定）', () => {
      const data = mockFullStandings();
      const sorted = sortStandings(data.teams);
      expect(sorted.map((t) => t.team)).toEqual(data.teams.map((t) => t.team));
    });

    it('勝率相同 rank 不同 → 仍照 rank 順序（不重排）', () => {
      const data = mockFullStandings(); // rank 3,4,5 都是 50.0%
      const sorted = sortStandings(data.teams);
      const ties = sorted.filter((t) => t.pct === '50.0%').map((t) => t.team);
      expect(ties).toEqual(['黑', '黃', '白']);
    });
  });

  // Covers: U-5 buildRosterLink
  describe('buildRosterLink', () => {
    it('綠隊 → /roster?team=green', () => {
      expect(buildRosterLink('綠')).toBe('/roster?team=green');
    });

    it('紅隊 → /roster?team=red', () => {
      expect(buildRosterLink('紅')).toBe('/roster?team=red');
    });

    it('未知隊伍 → fallback 到 /roster（無 query）', () => {
      expect(buildRosterLink('紫')).toBe('/roster');
    });
  });

  // Covers: U-1 邊界（zero-record 整體一致性）
  it('mockZeroRecordStandings 的所有隊 pct 都應為 "—"', () => {
    const data = mockZeroRecordStandings();
    data.teams.forEach((t) => {
      expect(formatPct(t.wins, t.losses)).toBe('—');
    });
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-3
npx vitest run tests/unit/standings-utils.test.ts
```
預期：FAIL — `Cannot find module '../../src/lib/standings-utils'`

- [ ] **Step 3：實作最小程式碼**

```typescript
// src/types/standings.ts
export type StreakType = 'win' | 'lose' | 'none';
export type HistoryResult = 'W' | 'L';

export interface TeamStanding {
  rank: number;
  name: string;     // 「綠隊」
  team: string;     // 「綠」（對應 TEAM_CONFIG key）
  wins: number;
  losses: number;
  pct: string;
  history: HistoryResult[];
  streak: string;
  streakType: StreakType;
}

export interface StandingsData {
  season: number;
  phase: string;
  currentWeek: number;
  teams: TeamStanding[];
  matrix?: unknown;
}
```

```typescript
// src/lib/standings-utils.ts
import type { HistoryResult, StreakType, TeamStanding } from '../types/standings';
import { TEAM_CONFIG } from '../config/teams';

const GREY = '#9e9e9e';

export function formatPct(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return '—';
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export interface StreakStyle {
  colorClass: string;
  arrow: '↑' | '↓' | '';
}

export function getStreakClasses(type: StreakType): StreakStyle {
  if (type === 'win') return { colorClass: 'text-orange', arrow: '↑' };
  if (type === 'lose') return { colorClass: 'text-red-600', arrow: '↓' };
  return { colorClass: 'text-txt-mid', arrow: '' };
}

export function getHistoryDotColor(result: HistoryResult, teamId: string): string {
  if (result === 'L') return GREY;
  const team = TEAM_CONFIG[teamId];
  return team?.color ?? GREY;
}

/** 不重排，identity — 防止未來誤加排序 */
export function sortStandings(teams: TeamStanding[]): TeamStanding[] {
  return [...teams];
}

export function buildRosterLink(teamId: string): string {
  const team = TEAM_CONFIG[teamId];
  if (!team) return '/roster';
  return `/roster?team=${team.id}`;
}
```

- [ ] **Step 4：確認測試通過**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-3
npx vitest run tests/unit/standings-utils.test.ts
```
預期：PASS — `Tests  16 passed (16)`（formatPct 4 + getStreakClasses 3 + getHistoryDotColor 3 + sortStandings 2 + buildRosterLink 3 + zero-record 1 = 16）

- [ ] **Step 5：Commit**

```bash
git add src/types/standings.ts src/lib/standings-utils.ts tests/unit/standings-utils.test.ts
git commit -m "feat(standings): add types and utils for standings page (#3)"
```

---

### Task 2：狀態元件（Skeleton / Error / Empty / Hero）

**Files:**
- Create: `src/components/standings/SkeletonState.tsx`
- Create: `src/components/standings/ErrorState.tsx`
- Create: `src/components/standings/EmptyState.tsx`
- Create: `src/components/standings/StandingsHero.tsx`

## Style Rules（subagent 必讀，由 Step 0.5 注入）

### style-skeleton-loading（命中：本 task 建立 SkeletonState 元件，是非同步資料載入的骨架）

**核心原則**：操作立刻有視覺回饋，等待期不留白。

**禁止**：
- ❌ 整頁 spinner
- ❌ 頁面空白等資料
- ❌ `mounted` 動畫 pattern

**Skeleton 設計原則**：
1. 形狀對應真實內容（卡片用卡片形狀、標題用長條，**不用** spinner）
2. padding/spacing 與真實頁面一致（避免 layout shift）
3. 動態用 `animate-pulse`
4. 色塊本身就是語言，不需要「讀取中…」文字

- [ ] **Step 1：寫失敗測試（TDD）**

> 本 task 元件為純展示，視覺與互動行為已在 `tests/e2e/features/standings.spec.ts`（Phase 6 跑）涵蓋（AC-10 / AC-11 / AC-11b / AC-12 / AC-12b）。**不重複寫 unit test**。Step 1 改為「寫一支型別冒煙測試」確保元件 export 與 props 介面正確。

```typescript
// tests/unit/standings-components.test.tsx 不建立。
// 改用：執行 `npm run build` 驗證 TS 通過 + 元件可被 import。
```

跳過 Step 1（無新 unit test，視覺/互動由 E2E 覆蓋）。

- [ ] **Step 2：確認 build 失敗（元件尚未存在）**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-3
# 若 Task 4 的 StandingsApp.tsx 已 import 這些元件 → build 會失敗
# 此 Task 獨立執行時可改用：grep 確認檔案不存在
ls src/components/standings/SkeletonState.tsx 2>/dev/null
```
預期：no such file（檔案不存在）

- [ ] **Step 3：實作最小程式碼**

```tsx
// src/components/standings/SkeletonState.tsx
export function SkeletonState() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse">
      {/* Hero skeleton */}
      <div data-testid="skeleton-hero" className="text-center mb-6">
        <div className="h-10 w-40 bg-gray-200 rounded mx-auto mb-3" />
        <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
      </div>

      {/* 6 列灰塊 — mobile 每張卡 / desktop 每列 */}
      <div className="space-y-3 md:space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            data-testid="skeleton-row"
            className="h-16 md:h-12 bg-gray-200 rounded-2xl md:rounded"
          />
        ))}
      </div>
    </div>
  );
}
```

```tsx
// src/components/standings/ErrorState.tsx
interface Props {
  onRetry: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message = '無法載入戰績' }: Props) {
  return (
    <div className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
      <p className="text-lg text-txt-dark mb-2">{message}</p>
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

```tsx
// src/components/standings/EmptyState.tsx
interface Props {
  baseUrl: string;
  message?: string;
}

export function EmptyState({ baseUrl, message = '賽季尚未開始 ⛹️' }: Props) {
  const rosterHref = `${baseUrl.replace(/\/$/, '')}/roster`;
  return (
    <div className="px-4 py-12 max-w-md mx-auto text-center">
      <p className="text-lg text-txt-dark mb-6">{message}</p>
      <a
        href={rosterHref}
        className="inline-block px-6 py-2 bg-navy text-white rounded-lg font-bold hover:bg-navy-2 transition"
      >
        看球員名單
      </a>
    </div>
  );
}
```

```tsx
// src/components/standings/StandingsHero.tsx
interface Props {
  season: number;
  phase: string;
  currentWeek: number;
}

export function StandingsHero({ season, phase, currentWeek }: Props) {
  return (
    <header className="text-center px-4 py-6 md:py-10">
      <h1 className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2">
        STANDINGS · {phase}
      </h1>
      <div className="font-condensed text-base md:text-lg text-txt-mid">
        第 {season} 季 · 第 {currentWeek} 週
      </div>
    </header>
  );
}
```

- [ ] **Step 4：確認元件可被 build**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-3
# 確認檔案均建立
ls src/components/standings/{SkeletonState,ErrorState,EmptyState,StandingsHero}.tsx
# 跑既有 unit/integration 確保沒打壞
npx vitest run
```
預期：4 個檔案存在 + 既有 25 個 vitest case 全部通過

- [ ] **Step 5：Commit**

```bash
git add src/components/standings/
git commit -m "feat(standings): add skeleton/error/empty/hero components (#3)"
```

---

### Task 3：StandingsRow（mobile card + desktop table row）

**Files:**
- Create: `src/components/standings/StandingsRow.tsx`

**相依：** Task 1（types + utils）必須先完成

## Style Rules（subagent 必讀，由 Step 0.5 注入）

### style-rwd-list（命中：本 task 建立 7 欄位列表元件）

**PC（md breakpoint 以上）**
- 使用標準橫排 table 展開所有欄位

**Mobile（sm breakpoint 以下）**
- 改為 card 呈現，每筆資料一張卡片
- 卡片標題：主要識別欄位（隊伍名 + rank）
- 卡片內容：次要欄位以 label + value 列出（W/L、勝率、history、streak）

**實作策略**：在 `StandingsApp.tsx` 用 `hidden md:table` 顯示桌機 table、用 `md:hidden space-y-3` 顯示 mobile card 列表；本 task 的 `StandingsRow` 提供 `<TableRow>` 與 `<MobileCard>` 兩個 sub-component（同檔 export）。

- [ ] **Step 1：寫失敗測試（TDD）**

> 本元件的視覺與資料屬性（`data-testid`、`data-result`、`data-streak-type`）已在 `tests/e2e/features/standings.spec.ts` 涵蓋（AC-2 / AC-3 / AC-4 / AC-5 / AC-6）。**不重複寫 unit test**。

跳過 Step 1（視覺/互動由 E2E 覆蓋；utils 行為在 Task 1 已測）。

- [ ] **Step 2：確認元件不存在**

```bash
ls /Users/waterfat/Documents/taan-basketball-league-issue-3/src/components/standings/StandingsRow.tsx 2>/dev/null
```
預期：no such file

- [ ] **Step 3：實作最小程式碼**

```tsx
// src/components/standings/StandingsRow.tsx
import type { TeamStanding } from '../../types/standings';
import {
  buildRosterLink,
  getHistoryDotColor,
  getStreakClasses,
} from '../../lib/standings-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface Props {
  team: TeamStanding;
  baseUrl: string;
}

function HistoryDots({ team, history }: { team: string; history: TeamStanding['history'] }) {
  return (
    <div data-testid="history" className="flex gap-1">
      {history.map((r, i) => (
        <span
          key={i}
          data-testid="history-dot"
          data-result={r}
          className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ backgroundColor: getHistoryDotColor(r, team) }}
          aria-label={r === 'W' ? '勝' : '敗'}
        />
      ))}
    </div>
  );
}

function StreakLabel({ team }: { team: TeamStanding }) {
  const { colorClass, arrow } = getStreakClasses(team.streakType);
  return (
    <span
      data-testid="streak"
      data-streak-type={team.streakType}
      className={`font-condensed text-sm ${colorClass}`}
    >
      {team.streak}
      {arrow && <span aria-hidden="true"> {arrow}</span>}
    </span>
  );
}

function rowAriaLabel(t: TeamStanding) {
  return `${t.name} 第 ${t.rank} 名 ${t.wins} 勝 ${t.losses} 敗`;
}

/** Mobile card 模式 */
export function StandingsCard({ team, baseUrl }: Props) {
  const config = TEAM_CONFIG[team.team];
  const href = `${baseUrl.replace(/\/$/, '')}${buildRosterLink(team.team)}`;
  return (
    <a
      href={href}
      data-testid="standings-row"
      aria-label={rowAriaLabel(team)}
      className="block bg-white border border-warm-2 rounded-2xl p-4 hover:border-orange transition"
    >
      <div className="flex items-center gap-3 mb-3">
        <span data-testid="rank" className="font-display text-2xl text-txt-dark w-8">
          {team.rank}
        </span>
        <span
          data-testid="team-dot"
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: config?.color ?? '#999' }}
        />
        <span data-testid="team-name" className="font-bold text-lg">
          {team.team}
        </span>
        <span className="ml-auto"><StreakLabel team={team} /></span>
      </div>
      <div className="flex items-center gap-4 text-sm text-txt-mid">
        <span><span data-testid="wins" className="font-bold text-txt-dark">{team.wins}</span> 勝</span>
        <span><span data-testid="losses" className="font-bold text-txt-dark">{team.losses}</span> 敗</span>
        <span data-testid="pct" className="font-condensed">{team.pct}</span>
        <span className="ml-auto"><HistoryDots team={team.team} history={team.history} /></span>
      </div>
    </a>
  );
}

/** Desktop table row 模式 */
export function StandingsTableRow({ team, baseUrl }: Props) {
  const config = TEAM_CONFIG[team.team];
  const href = `${baseUrl.replace(/\/$/, '')}${buildRosterLink(team.team)}`;
  return (
    <tr
      data-testid="standings-row"
      onClick={() => { window.location.href = href; }}
      role="link"
      aria-label={rowAriaLabel(team)}
      className="cursor-pointer hover:bg-warm-1 transition border-b border-warm-2"
    >
      <td data-testid="rank" className="font-display text-2xl px-4 py-3">{team.rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            data-testid="team-dot"
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config?.color ?? '#999' }}
          />
          <span data-testid="team-name" className="font-bold">{team.team}</span>
        </div>
      </td>
      <td data-testid="wins" className="px-4 py-3 font-condensed">{team.wins}</td>
      <td data-testid="losses" className="px-4 py-3 font-condensed">{team.losses}</td>
      <td data-testid="pct" className="px-4 py-3 font-condensed">{team.pct}</td>
      <td className="px-4 py-3"><HistoryDots team={team.team} history={team.history} /></td>
      <td className="px-4 py-3"><StreakLabel team={team} /></td>
    </tr>
  );
}
```

- [ ] **Step 4：確認檔案存在 + tsc / vitest 不破壞**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-3
ls src/components/standings/StandingsRow.tsx
npx vitest run
```
預期：檔案存在；既有 vitest 全部通過（已含 16 個新 unit test，total 41 cases）

- [ ] **Step 5：Commit**

```bash
git add src/components/standings/StandingsRow.tsx
git commit -m "feat(standings): add row component (mobile card + desktop table row) (#3)"
```

---

### Task 4：StandingsApp + standings.astro 接線

**Files:**
- Create: `src/components/standings/StandingsApp.tsx`
- Modify: `src/pages/standings.astro`

**相依：** Task 1, 2, 3 都必須先完成

## Style Rules（subagent 必讀，由 Step 0.5 注入）

### style-skeleton-loading（命中：本 task 建立 fetch + state machine 主島，控制 loading 顯示時機）

不重複貼規則內文（見 Task 2 已注入）。**重點重申**：
- StandingsApp 在 `'loading'` state 必須直接 return `<SkeletonState />`，不寫成「先空白再顯示」。
- 不允許在 island 內寫整頁 spinner。

- [ ] **Step 1：寫失敗測試（TDD）**

> 本 task 整合行為（state-machine 三狀態切換、retry、roster 連結）已在 `tests/e2e/features/standings.spec.ts` 全部覆蓋（AC-1, AC-6, AC-10, AC-11, AC-11b, AC-12, AC-12b）。**不重複寫 unit test**（避免測試 React state 內部，違反「測行為而非實作」）。

跳過 Step 1。

- [ ] **Step 2：確認 page 仍是佔位**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-3
grep -q "規劃中" src/pages/standings.astro && echo "still placeholder"
```
預期：`still placeholder`

- [ ] **Step 3：實作最小程式碼**

```tsx
// src/components/standings/StandingsApp.tsx
import { useEffect, useState, useCallback } from 'react';
import type { StandingsData } from '../../types/standings';
import { fetchData } from '../../lib/api';
import { sortStandings } from '../../lib/standings-utils';
import { SkeletonState } from './SkeletonState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { StandingsHero } from './StandingsHero';
import { StandingsCard, StandingsTableRow } from './StandingsRow';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  baseUrl: string;
}

export function StandingsApp({ baseUrl }: Props) {
  const [data, setData] = useState<StandingsData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const result = await fetchData<StandingsData>('standings');
      if (cancelled) return;

      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }

      const standings = result.data;
      setData(standings);

      if (!standings.teams || standings.teams.length === 0) {
        setStatus('empty');
        return;
      }

      setStatus('ok');
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  if (status === 'loading') return <SkeletonState />;
  if (status === 'error') return <ErrorState onRetry={handleRetry} />;
  if (status === 'empty' || !data) return <EmptyState baseUrl={baseUrl} />;

  const teams = sortStandings(data.teams);

  return (
    <div className="max-w-6xl mx-auto pb-8" data-testid="standings-container">
      <StandingsHero season={data.season} phase={data.phase} currentWeek={data.currentWeek} />

      {/* Mobile：每隊一張卡片堆疊 */}
      <section className="md:hidden px-4 space-y-3">
        {teams.map((team) => (
          <StandingsCard key={team.team} team={team} baseUrl={baseUrl} />
        ))}
      </section>

      {/* Desktop：橫排 table */}
      <section className="hidden md:block px-8 mt-4">
        <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden">
          <thead className="bg-warm-1 text-left text-sm text-txt-mid">
            <tr>
              <th className="px-4 py-2 font-bold">#</th>
              <th className="px-4 py-2 font-bold">隊伍</th>
              <th className="px-4 py-2 font-bold">勝</th>
              <th className="px-4 py-2 font-bold">敗</th>
              <th className="px-4 py-2 font-bold">勝率</th>
              <th className="px-4 py-2 font-bold">最近 6 場</th>
              <th className="px-4 py-2 font-bold">連勝紀錄</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <StandingsTableRow key={team.team} team={team} baseUrl={baseUrl} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

```astro
---
// src/pages/standings.astro（覆蓋既有佔位內容）
import Layout from '../layouts/Layout.astro';
import { StandingsApp } from '../components/standings/StandingsApp';

const baseUrl = import.meta.env.BASE_URL;
---

<Layout title="戰績榜" active="standings">
  <StandingsApp client:load baseUrl={baseUrl} />
</Layout>
```

- [ ] **Step 4：確認 build + dev server 可預覽**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-3
npx vitest run                                    # 既有 25 + 新增 16 = 41 cases 全部 PASS
npm run build                                     # Astro build 5 pages 成功
# 跑 features e2e 驗證頁面行為（dev server 自動由 playwright 啟動）
npx playwright test tests/e2e/features/standings.spec.ts --project=features 2>&1 | tail -20
```

預期：
- vitest run：41 passed
- npm run build：5 pages 產出無錯誤
- playwright run：tests/e2e/features/standings.spec.ts 通過（mobile-only / desktop-only test 由 project skip 控制）

- [ ] **Step 5：Commit**

```bash
git add src/components/standings/StandingsApp.tsx src/pages/standings.astro
git commit -m "feat(standings): wire StandingsApp into /standings page (#3)"
```

---

## Self-review

1. **Spec 覆蓋**：AC-1~14 全部由 Task 4 的整合渲染 + Task 3 的 row + Task 2 的狀態元件覆蓋；qa-v2 補的 AC-11b / AC-12b 由 retry button 與 EmptyState 連結覆蓋。✅
2. **佔位符掃描**：無 TBD / TODO / "Similar to Task N"。✅
3. **測試約束**：U-1~U-5 全在 Task 1 直接驗實際回傳值（無 spy-only 斷言）；I-1/I-2 走真實 fetch path（vi.fn 只 mock fetch 邊界）；E-* 由 Playwright 在實際瀏覽器跑。✅
4. **型別一致性**：Task 1 的 `StandingsData` / `TeamStanding` 全 task 共用；`buildRosterLink` 接 `team` (字串)、回傳 `/roster?team=<id>`，與 E2E 的 `?team=green` 斷言對齊。✅

個人風格規則：命中 2 條 — style-rwd-list, style-skeleton-loading
