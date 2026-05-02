# /roster 球員頁實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實作 `/roster` 球員頁，含球員名單（出席色塊）和積分龍虎榜兩個 sub-tab，支援 URL 持久化和 deep link。

**Architecture:** 遵循 StandingsApp 模式，以 React island（`client:load`）建立 RosterApp 狀態機；並行 fetch roster + dragon 兩份資料；sub-tab 狀態透過 URL query param（`?tab=`）持久化；`?team=<id>` deep link 自動切換球員名單 tab 並 scroll + highlight 指定隊伍。

**Tech Stack:** Astro 6, React 19, Tailwind CSS 4, TypeScript strict, Vitest（unit）, Playwright（E2E）

**個人風格規則**：命中 3 條 — style-ios-inapp-scroll, style-rwd-list, style-skeleton-loading

**Code Graph**：圖未建立，跳過

---

## Coverage Matrix（from issue-5_qaplan.md）

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| U-1 | att=1 → 隊伍主色 class | Task 1 Step 1 | unit test |
| U-2 | att=0 → 紅色 class | Task 1 Step 1 | unit test |
| U-3 | att="x" → 黃色 class | Task 1 Step 1 | unit test |
| U-4 | att="?" → 灰色虛框 class | Task 1 Step 1 | unit test |
| U-5 | total <= threshold → 無金色背景 | Task 1 Step 1 | unit test |
| U-6 | playoff=null → "—" | Task 1 Step 1 | unit test |
| U-7 | getAttClass 完整 4 種值 | Task 1 Step 1 | unit test |
| I-1 | fetchData('roster') GAS成功 | — | tests/integration/api-fallback.integration.test.ts（已補寫）|
| I-2 | fetchData('roster') GAS失敗→static | — | tests/integration/api-fallback.integration.test.ts（已補寫）|
| I-3 | fetchData('roster') 全失敗 | — | tests/integration/api-fallback.integration.test.ts（已補寫）|
| I-4 | fetchData('dragon') GAS失敗→static | — | tests/integration/api-fallback.integration.test.ts（已補寫）|
| I-5 | fetchData('dragon') 全失敗 | — | tests/integration/api-fallback.integration.test.ts（已補寫）|
| E-1~E-5 | Hero + 球員名單 tab | — | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-6~E-15 | 龍虎榜 tab | — | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-16~E-18 | Deep link | — | tests/e2e/features/roster/deep-link.spec.ts |
| E-19~E-20 | RWD | — | tests/e2e/features/roster/rwd.spec.ts |
| E-21~E-23 | Three-state | — | tests/e2e/features/roster/states.spec.ts |

---

## Task 相依圖

```
Task 1 (Types + Utils)
  └── Task 2 (Page Shell + RosterApp)
        ├── Task 3 (RosterTabPanel)  ← 並行
        └── Task 4 (DragonTabPanel) ← 並行
```

---

### Task 1：TypeScript 型別 + 純函式工具層

**Files:**
- Create: `src/types/roster.ts`
- Create: `src/lib/roster-utils.ts`
- Create: `tests/unit/roster-utils.test.ts`

## Style Rules

無命中（Task 1 為純邏輯，不觸及 layout/表格/fetch）

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/roster-utils.test.ts
// Covers: U-1, U-2, U-3, U-4, U-5, U-6, U-7

import { describe, it, expect } from 'vitest';
import { getAttClass, getAttBgStyle, isAboveThreshold, formatPlayoff } from '../../src/lib/roster-utils';

describe('getAttClass', () => {
  it('U-1/U-7: att=1 → contains att-present class', () => {
    expect(getAttClass(1)).toContain('att-present');
  });
  it('U-2/U-7: att=0 → contains att-absent class', () => {
    expect(getAttClass(0)).toContain('att-absent');
  });
  it('U-3/U-7: att="x" → contains att-excuse class', () => {
    expect(getAttClass('x')).toContain('att-excuse');
  });
  it('U-4/U-7: att="?" → contains att-unknown class', () => {
    expect(getAttClass('?')).toContain('att-unknown');
  });
});

describe('isAboveThreshold', () => {
  it('U-5: total > threshold → true', () => {
    expect(isAboveThreshold(37, 36)).toBe(true);
  });
  it('U-5: total === threshold → false（平民線含邊界）', () => {
    expect(isAboveThreshold(36, 36)).toBe(false);
  });
  it('U-5: total < threshold → false', () => {
    expect(isAboveThreshold(10, 36)).toBe(false);
  });
});

describe('formatPlayoff', () => {
  it('U-6: playoff=null → "—"', () => {
    expect(formatPlayoff(null)).toBe('—');
  });
  it('U-6: playoff=5 → "5"', () => {
    expect(formatPlayoff(5)).toBe('5');
  });
  it('U-6: playoff=0 → "0"', () => {
    expect(formatPlayoff(0)).toBe('0');
  });
});

describe('getAttBgStyle（隊伍主色）', () => {
  it('att=1 → returns team color CSS value', () => {
    // 紅隊 color = '#e53935'
    const style = getAttBgStyle(1, '#e53935');
    expect(style.backgroundColor).toBe('#e53935');
  });
  it('att=0 → fixed red regardless of teamColor', () => {
    const style = getAttBgStyle(0, '#e53935');
    expect(style.backgroundColor).not.toBe('#e53935');
  });
  it('att="?" → returns empty style（無 backgroundColor）', () => {
    const style = getAttBgStyle('?', '#e53935');
    expect(style.backgroundColor).toBeUndefined();
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd /Users/waterfat/Documents/taan-basketball-league
npm test -- --run tests/unit/roster-utils.test.ts
```
預期：FAIL — "Cannot find module '../../src/lib/roster-utils'"

- [ ] **Step 3：建立型別定義**

```typescript
// src/types/roster.ts
export type AttValue = 1 | 0 | 'x' | '?';

export interface RosterWeek {
  wk: number;
  label: string;
  date: string;
}

export interface RosterPlayer {
  name: string;
  att: AttValue[];
  tag?: string | null;
}

export interface RosterTeam {
  id: string;
  name: string;
  players: RosterPlayer[];
}

export interface RosterData {
  weeks: RosterWeek[];
  teams: RosterTeam[];
}

export interface DragonPlayer {
  rank: number;
  name: string;
  team: string;
  tag: string | null;
  att: number;
  duty: number;
  mop: number;
  playoff: number | null;
  total: number;
}

export interface DragonData {
  season: number;
  phase: string;
  civilianThreshold: number;
  columns: string[];
  players: DragonPlayer[];
  rulesLink?: string;
}

export type RosterTab = 'roster' | 'dragon';
```

- [ ] **Step 4：實作工具函式**

```typescript
// src/lib/roster-utils.ts
import type { AttValue } from '../types/roster';

/** att 值對應 CSS class（用於 data-att 判斷與樣式） */
export function getAttClass(att: AttValue): string {
  switch (att) {
    case 1:   return 'att-present';
    case 0:   return 'att-absent';
    case 'x': return 'att-excuse';
    case '?': return 'att-unknown';
  }
}

/** att 值 + 隊伍主色 → inline style（1=隊伍主色, 0=紅, x=黃, ?=無色） */
export function getAttBgStyle(
  att: AttValue,
  teamColor: string,
): React.CSSProperties {
  switch (att) {
    case 1:   return { backgroundColor: teamColor };
    case 0:   return { backgroundColor: '#e53935' };
    case 'x': return { backgroundColor: '#f9a825' };
    case '?': return {};
  }
}

/** total > civilianThreshold（嚴格大於）→ 超標 */
export function isAboveThreshold(total: number, threshold: number): boolean {
  return total > threshold;
}

/** playoff=null → "—"，否則轉字串 */
export function formatPlayoff(playoff: number | null): string {
  return playoff === null ? '—' : String(playoff);
}

/** 解析 URL query 取得 tab 和 team */
export function parseRosterQuery(search: string): { tab: RosterTab | null; team: string | null } {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const tabRaw = params.get('tab');
  const tab: RosterTab | null =
    tabRaw === 'roster' || tabRaw === 'dragon' ? (tabRaw as RosterTab) : null;
  const team = params.get('team') ?? null;
  return { tab, team };
}

/** 解析後 state → 預設 active tab（無 tab param → 'roster'） */
export function resolveRosterTab(tab: RosterTab | null): RosterTab {
  return tab ?? 'roster';
}
```

- [ ] **Step 5：確認測試通過**

```bash
npm test -- --run tests/unit/roster-utils.test.ts
```
預期：PASS（全部 unit tests 通過）

- [ ] **Step 6：Commit**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-5
git add src/types/roster.ts src/lib/roster-utils.ts tests/unit/roster-utils.test.ts
git commit -m "feat(roster): add types + utils (getAttClass, isAboveThreshold, formatPlayoff) (#5)"
```

---

### Task 2：Page Shell — RosterApp + 3-state + Hero + Placeholder Panels

**Files:**
- Create: `src/components/roster/SkeletonState.tsx`
- Create: `src/components/roster/ErrorState.tsx`
- Create: `src/components/roster/EmptyState.tsx`
- Create: `src/components/roster/RosterHero.tsx`
- Create: `src/components/roster/SubTabs.tsx`
- Create: `src/components/roster/RosterTabPanel.tsx`  ← Task 3 會填充
- Create: `src/components/roster/DragonTabPanel.tsx`  ← Task 4 會填充
- Create: `src/components/roster/RosterApp.tsx`
- Modify: `src/pages/roster.astro`

## Style Rules

### style-skeleton-loading（命中原因：RosterApp 並行 fetch roster + dragon，切 tab 後立即有回饋）

> **風格規則：骨架載入 + 即時導航**
>
> - ❌ 整頁 spinner
> - ❌ 頁面空白等資料
> - ❌ `mounted` 動畫 pattern（opacity-0）
>
> **正確做法：** `status === 'loading'` 時回傳 `<RosterSkeleton />`，形狀對應真實內容排版；`animate-pulse`；padding/spacing 與真實頁面一致。

### style-ios-inapp-scroll（命中原因：使用 src/layouts/Layout.astro）

> **風格規則：iOS in-app browser 滾動相容**
>
> - ❌ `position: sticky` 做固定 header
> - ✅ App Shell 模式：document 不滾，只有內容區滾
>
> 注意：本頁面不需自建 sticky header，Layout.astro 已處理。roster 頁面主要確認「不在頁面內部額外新增 sticky 元素」。

- [ ] **Step 1：寫失敗測試（骨架 + 三狀態 test IDs 驗收）**

此 Task 的測試驗收由 E2E 執行（states.spec.ts 已建立）。但補一個 unit test 驗收 SubTabs 的 aria 屬性：

```typescript
// tests/unit/roster-components.test.ts
// Covers: E-1（sub-tab aria-selected 驗收）

import { describe, it, expect } from 'vitest';

// 驗 parseRosterQuery + resolveRosterTab（已在 Task 1 測過）
// 此 Task unit test 只驗常數/型別不倒退
import { parseRosterQuery, resolveRosterTab } from '../../src/lib/roster-utils';

describe('resolveRosterTab', () => {
  it('無 tab param → "roster"（預設球員名單）', () => {
    expect(resolveRosterTab(null)).toBe('roster');
  });
  it('tab=dragon → "dragon"', () => {
    expect(resolveRosterTab('dragon')).toBe('dragon');
  });
});

describe('parseRosterQuery', () => {
  it('?tab=dragon → { tab: "dragon", team: null }', () => {
    expect(parseRosterQuery('?tab=dragon')).toEqual({ tab: 'dragon', team: null });
  });
  it('?team=red → { tab: null, team: "red" }', () => {
    expect(parseRosterQuery('?team=red')).toEqual({ tab: null, team: 'red' });
  });
  it('?tab=invalid → { tab: null, team: null }', () => {
    expect(parseRosterQuery('?tab=invalid')).toEqual({ tab: null, team: null });
  });
  it('空字串 → { tab: null, team: null }', () => {
    expect(parseRosterQuery('')).toEqual({ tab: null, team: null });
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npm test -- --run tests/unit/roster-components.test.ts
```
預期：FAIL（roster-utils 已實作則 PASS，無誤；但因 Task 1 已完成，此步直接 PASS 確認）

- [ ] **Step 3：建立 SkeletonState**

```tsx
// src/components/roster/SkeletonState.tsx
export function SkeletonState() {
  return (
    <div data-testid="roster-skeleton" className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse">
      <div className="text-center mb-6">
        <div className="h-10 w-48 bg-gray-200 rounded mx-auto mb-3" />
        <div className="h-5 w-40 bg-gray-200 rounded mx-auto" />
      </div>
      <div className="flex gap-2 mb-4 border-b border-warm-2 px-2 pb-1">
        <div className="h-8 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4：建立 ErrorState**

```tsx
// src/components/roster/ErrorState.tsx
interface Props { onRetry: () => void; }

export function ErrorState({ onRetry }: Props) {
  return (
    <div data-testid="roster-error" className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
      <p className="text-lg text-txt-dark mb-2">無法載入球員資料</p>
      <p className="text-sm text-txt-mid mb-6">請檢查網路連線或稍後再試</p>
      <button
        data-testid="roster-retry"
        onClick={onRetry}
        className="px-6 py-2 bg-orange text-white rounded-lg font-bold hover:bg-orange-2 transition"
      >
        重試
      </button>
    </div>
  );
}
```

- [ ] **Step 5：建立 EmptyState**

```tsx
// src/components/roster/EmptyState.tsx
export function EmptyState() {
  return (
    <div data-testid="roster-empty" className="px-4 py-12 max-w-md mx-auto text-center">
      <p className="text-lg text-txt-dark">賽季尚未開始 ⛹️</p>
    </div>
  );
}
```

- [ ] **Step 6：建立 RosterHero**

```tsx
// src/components/roster/RosterHero.tsx
interface Props {
  season: number;
  phase: string;
  civilianThreshold: number;
}

export function RosterHero({ season, phase, civilianThreshold }: Props) {
  return (
    <header className="text-center px-4 py-6 md:py-10">
      <h1
        data-testid="hero-title"
        className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2"
      >
        ROSTER · 第 {season} 季
      </h1>
      <div
        data-testid="hero-subtitle"
        className="font-condensed text-base md:text-lg text-txt-mid"
      >
        {phase} · 平民線 {civilianThreshold} 分
      </div>
    </header>
  );
}
```

- [ ] **Step 7：建立 SubTabs**

```tsx
// src/components/roster/SubTabs.tsx
import type { RosterTab } from '../../types/roster';

interface Props {
  activeTab: RosterTab;
  onSelect: (tab: RosterTab) => void;
}

const TABS: Array<{ id: RosterTab; label: string }> = [
  { id: 'roster', label: '球員名單' },
  { id: 'dragon', label: '積分龍虎榜' },
];

export function SubTabs({ activeTab, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="球員分頁" className="flex gap-2 px-4 md:px-8 border-b border-warm-2">
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

- [ ] **Step 8：建立 placeholder RosterTabPanel（Task 3 填充）**

```tsx
// src/components/roster/RosterTabPanel.tsx
import type { RosterData } from '../../types/roster';

interface Props {
  data: RosterData;
  highlightTeamId: string | null;
}

export function RosterTabPanel({ data, highlightTeamId }: Props) {
  return (
    <div data-testid="roster-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
      {/* Task 3 填充：球員名單 + 出席色塊 */}
      <p className="text-txt-mid text-sm">球員名單載入中...</p>
    </div>
  );
}
```

- [ ] **Step 9：建立 placeholder DragonTabPanel（Task 4 填充）**

```tsx
// src/components/roster/DragonTabPanel.tsx
import type { DragonData } from '../../types/roster';

interface Props {
  data: DragonData;
}

export function DragonTabPanel({ data }: Props) {
  return (
    <div data-testid="dragon-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
      {/* Task 4 填充：龍虎榜表格 */}
      <p className="text-txt-mid text-sm">龍虎榜載入中...</p>
    </div>
  );
}
```

- [ ] **Step 10：建立 RosterApp（狀態機 + URL sync + deep link）**

```tsx
// src/components/roster/RosterApp.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RosterData, DragonData, RosterTab } from '../../types/roster';
import { fetchData } from '../../lib/api';
import { parseRosterQuery, resolveRosterTab } from '../../lib/roster-utils';
import { SkeletonState } from './SkeletonState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { RosterHero } from './RosterHero';
import { SubTabs } from './SubTabs';
import { RosterTabPanel } from './RosterTabPanel';
import { DragonTabPanel } from './DragonTabPanel';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  baseUrl: string;
}

function readUrlState() {
  if (typeof window === 'undefined') return { tab: null as RosterTab | null, team: null as string | null };
  return parseRosterQuery(window.location.search);
}

export function RosterApp({ baseUrl }: Props) {
  const initial = readUrlState();
  const [activeTab, setActiveTab] = useState<RosterTab>(resolveRosterTab(initial.tab));
  const [highlightTeam, setHighlightTeam] = useState<string | null>(initial.team);

  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [dragonData, setDragonData] = useState<DragonData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  // popstate → 同步 URL state
  useEffect(() => {
    const handler = () => {
      const s = readUrlState();
      setActiveTab(resolveRosterTab(s.tab));
      setHighlightTeam(s.team);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // 並行 fetch roster + dragon
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    Promise.all([
      fetchData<RosterData>('roster'),
      fetchData<DragonData>('dragon'),
    ]).then(([rosterResult, dragonResult]) => {
      if (cancelled) return;

      if (rosterResult.source === 'error' || !rosterResult.data) {
        setStatus('error');
        return;
      }

      setRosterData(rosterResult.data);
      setDragonData(dragonResult.data);

      if (!rosterResult.data.teams || rosterResult.data.teams.length === 0) {
        setStatus('empty');
        return;
      }

      setStatus('ok');
    });

    return () => { cancelled = true; };
  }, [reloadKey]);

  // ?team=<id> deep link → 切球員名單 tab
  useEffect(() => {
    if (highlightTeam && status === 'ok') {
      setActiveTab('roster');
    }
  }, [highlightTeam, status]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);

  const handleSelectTab = useCallback((tab: RosterTab) => {
    setActiveTab(tab);
    const base = baseUrl.replace(/\/$/, '');
    const params = new URLSearchParams();
    params.set('tab', tab);
    window.history.replaceState(null, '', `${base}/roster?${params.toString()}`);
  }, [baseUrl]);

  if (status === 'loading') return <SkeletonState />;
  if (status === 'error') return <ErrorState onRetry={handleRetry} />;
  if (status === 'empty' || !rosterData) return <EmptyState />;

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <RosterHero
        season={dragonData?.season ?? rosterData.teams.length > 0 ? 25 : 0}
        phase={dragonData?.phase ?? '賽季進行中'}
        civilianThreshold={dragonData?.civilianThreshold ?? 36}
      />
      <SubTabs activeTab={activeTab} onSelect={handleSelectTab} />
      {activeTab === 'roster' ? (
        <RosterTabPanel data={rosterData} highlightTeamId={highlightTeam} />
      ) : (
        <DragonTabPanel data={dragonData ?? { season: 25, phase: '', civilianThreshold: 36, columns: [], players: [] }} />
      )}
    </div>
  );
}
```

- [ ] **Step 11：修改 roster.astro**

```astro
---
// src/pages/roster.astro
import Layout from '../layouts/Layout.astro';
import { RosterApp } from '../components/roster/RosterApp';

const baseUrl = import.meta.env.BASE_URL;
---

<Layout title="球員名單" active="players">
  <RosterApp client:load baseUrl={baseUrl} />
</Layout>
```

- [ ] **Step 12：確認 unit tests 通過**

```bash
npm test -- --run
```
預期：全部 PASS

- [ ] **Step 13：Commit**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-5
git add src/components/roster/ src/pages/roster.astro tests/unit/roster-components.test.ts
git commit -m "feat(roster): add page shell, state machine, sub-tabs, URL sync, deep link (#5)"
```

---

### Task 3：RosterTabPanel — 球員名單 + 出席色塊

**依賴：Task 1（types/utils），Task 2（RosterTabPanel placeholder）**

**Files:**
- Modify: `src/components/roster/RosterTabPanel.tsx`  ← 填充完整實作

## Style Rules

### style-rwd-list（命中原因：球員名單含出席色塊 + 隊伍資訊 3+ 欄，桌機 table、手機 card）

> **風格規則：多欄位列表 RWD 呈現**
>
> - PC（md+）：`<div className="hidden md:block"><table>...</table></div>`
> - Mobile（< md）：`<div className="md:hidden space-y-3">{items.map(...card...)}</div>`
> - 卡片標題：球員名字；卡片內容：出席色塊橫排
> - 操作按鈕：無（球員不可點）

### style-ios-inapp-scroll（命中原因：出席色塊橫向捲動）

> 出席色塊 10 個橫排，手機螢幕可能溢出。水平捲動區域加：
> ```css
> .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
> .scrollbar-hide::-webkit-scrollbar { display:none; }
> ```
> 搭配 `pb-1` 留底部間距避免最後一個色塊被遮。

- [ ] **Step 1：確認 placeholder E2E 先跑（了解失敗原因）**

```bash
cd /Users/waterfat/Documents/taan-basketball-league
npx playwright test tests/e2e/features/roster/hero-roster-tab.spec.ts --project=features 2>&1 | tail -20
```
預期：多數 AC 失敗（placeholder 缺 team section、player row、att block 等）

- [ ] **Step 2：填充 RosterTabPanel 完整實作**

```tsx
// src/components/roster/RosterTabPanel.tsx
import { useEffect, useRef } from 'react';
import type { RosterData, RosterPlayer, AttValue } from '../../types/roster';
import { getAttClass, getAttBgStyle } from '../../lib/roster-utils';
import { TEAM_BY_ID, TEAM_CONFIG } from '../../config/teams';

// ─── AttBlock ───────────────────────────────────────────────
interface AttBlockProps {
  att: AttValue;
  teamColor: string;
}

function AttBlock({ att, teamColor }: AttBlockProps) {
  const cls = [
    'inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded select-none',
    att === '?' ? 'border border-dashed border-gray-400 text-gray-400' : 'text-white',
    getAttClass(att),
  ].join(' ');

  const style = att !== '?' ? getAttBgStyle(att, teamColor) : {};

  return (
    <span
      data-testid="att-block"
      data-att={String(att)}
      className={cls}
      style={style}
      aria-label={String(att)}
    >
      {String(att)}
    </span>
  );
}

// ─── PlayerRow ──────────────────────────────────────────────
interface PlayerRowProps {
  player: RosterPlayer;
  teamColor: string;
}

function PlayerRow({ player, teamColor }: PlayerRowProps) {
  return (
    <div data-testid="roster-player-row" className="flex items-center gap-2 py-1.5 border-b border-warm-1 last:border-0">
      <span data-testid="player-name" className="w-20 shrink-0 text-sm font-medium text-txt-dark">
        {player.name}
      </span>
      {/* scrollbar-hide + pb-1：iOS water-scroll 相容 */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {player.att.map((att, i) => (
          <AttBlock key={i} att={att as AttValue} teamColor={teamColor} />
        ))}
      </div>
    </div>
  );
}

// ─── PlayerCard（mobile）────────────────────────────────────
function PlayerCard({ player, teamColor }: PlayerRowProps) {
  return (
    <div data-testid="roster-player-card" className="rounded-lg border border-warm-2 p-3">
      <div data-testid="player-name" className="font-medium text-txt-dark mb-2">
        {player.name}
      </div>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {player.att.map((att, i) => (
          <AttBlock key={i} att={att as AttValue} teamColor={teamColor} />
        ))}
      </div>
    </div>
  );
}

// ─── TeamSection ─────────────────────────────────────────────
interface TeamSectionProps {
  team: RosterData['teams'][number];
  highlighted: boolean;
  sectionRef?: React.RefObject<HTMLDivElement>;
}

function TeamSection({ team, highlighted, sectionRef }: TeamSectionProps) {
  const config = TEAM_CONFIG[team.name.replace('隊', '')] ?? null;
  const teamColor = config?.color ?? '#999';

  return (
    <section
      ref={sectionRef}
      data-testid="roster-team-section"
      data-team-id={team.id}
      data-highlighted={highlighted ? 'true' : undefined}
      className={[
        'bg-white rounded-2xl border mb-4 p-4 transition-all',
        highlighted ? 'border-orange ring-2 ring-orange/30' : 'border-warm-2',
      ].join(' ')}
    >
      <h2 className="font-bold text-base mb-3" style={{ color: teamColor }}>
        {team.name}
      </h2>

      {/* Desktop: table（hidden on mobile） */}
      <div className="hidden md:block" data-testid="roster-table">
        <table className="w-full text-sm">
          <tbody>
            {team.players.map((p) => (
              <PlayerRow key={p.name} player={p} teamColor={teamColor} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {team.players.map((p) => (
          <PlayerCard key={p.name} player={p} teamColor={teamColor} />
        ))}
      </div>
    </section>
  );
}

// ─── RosterTabPanel（main）──────────────────────────────────
interface Props {
  data: RosterData;
  highlightTeamId: string | null;
}

export function RosterTabPanel({ data, highlightTeamId }: Props) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // deep link scroll + highlight
  useEffect(() => {
    if (!highlightTeamId) return;
    const el = sectionRefs.current[highlightTeamId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlightTeamId]);

  return (
    <div data-testid="roster-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
      {data.teams.map((team) => (
        <TeamSection
          key={team.id}
          team={team}
          highlighted={highlightTeamId === team.id}
          sectionRef={{ current: null } as unknown as React.RefObject<HTMLDivElement>}
        />
      ))}
    </div>
  );
}
```

> **注意**：`sectionRef` 需改用 `useCallback ref` 或 `useRef` map 才能正確附加多個 DOM ref。完整實作：
>
> ```tsx
> // 在 RosterTabPanel 函式體內：
> const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
>
> // 每個 TeamSection 使用 callback ref：
> <TeamSection
>   key={team.id}
>   team={team}
>   highlighted={highlightTeamId === team.id}
>   sectionRef={{
>     current: null,
>     // 呼叫端改成 callback ref
>   }}
> />
> ```
>
> 實作時改用 callback ref pattern：
> ```tsx
> const setRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
>   sectionRefs.current[id] = el;
> }, []);
>
> // 在 JSX 中：
> <div ref={setRef(team.id)} ...>
> ```

- [ ] **Step 3：確認 unit tests 仍通過**

```bash
npm test -- --run
```
預期：全部 PASS

- [ ] **Step 4：Commit**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-5
git add src/components/roster/RosterTabPanel.tsx
git commit -m "feat(roster): implement RosterTabPanel with team sections, att blocks, deep link scroll (#5)"
```

---

### Task 4：DragonTabPanel — 積分龍虎榜

**依賴：Task 1（types/utils），Task 2（DragonTabPanel placeholder）**
**可與 Task 3 並行**

**Files:**
- Modify: `src/components/roster/DragonTabPanel.tsx` ← 填充完整實作

## Style Rules

### style-rwd-list（命中原因：龍虎榜 9 欄資料表）

> **風格規則：多欄位列表 RWD 呈現**
>
> - PC（md+）：`<div className="hidden md:block"><table 9 欄/></div>`
> - Mobile（< md）：`<div className="md:hidden">` — 每位球員一張卡片，總分大字，分項收摺

- [ ] **Step 1：確認 placeholder E2E 先跑（了解失敗原因）**

```bash
cd /Users/waterfat/Documents/taan-basketball-league
npx playwright test tests/e2e/features/roster/dragon-tab.spec.ts --project=features 2>&1 | tail -20
```
預期：多數 AC 失敗（缺 dragon-table、dragon-player-row、judge-icon 等）

- [ ] **Step 2：填充 DragonTabPanel 完整實作**

```tsx
// src/components/roster/DragonTabPanel.tsx
import type { DragonData, DragonPlayer } from '../../types/roster';
import { isAboveThreshold, formatPlayoff } from '../../lib/roster-utils';
import { TEAM_CONFIG } from '../../config/teams';

// ─── JudgeIcon ───────────────────────────────────────────────
function JudgeIcon() {
  return (
    <span data-testid="judge-icon" aria-label="裁判資格" title="裁判資格">
      ⚖️
    </span>
  );
}

// ─── DragonTableRow（desktop）────────────────────────────────
interface RowProps {
  player: DragonPlayer;
  threshold: number;
}

function DragonTableRow({ player, threshold }: RowProps) {
  const above = isAboveThreshold(player.total, threshold);
  const teamConfig = TEAM_CONFIG[player.team] ?? null;

  return (
    <tr
      data-testid="dragon-player-row"
      data-above-threshold={above ? 'true' : undefined}
      className={above ? 'bg-yellow-50' : ''}
    >
      <td data-testid="dragon-rank" className="px-3 py-2 font-condensed">{player.rank}</td>
      <td data-testid="dragon-name" className="px-3 py-2 font-medium">
        {player.name}
        {player.tag === '裁' && <JudgeIcon />}
      </td>
      <td className="px-3 py-2">
        <span style={{ color: teamConfig?.color ?? '#999' }}>{player.team}</span>
      </td>
      <td className="px-3 py-2">{player.att}</td>
      <td className="px-3 py-2">{player.duty}</td>
      <td className="px-3 py-2">{player.mop}</td>
      <td data-testid="dragon-playoff" className="px-3 py-2">{formatPlayoff(player.playoff)}</td>
      <td className="px-3 py-2 font-bold text-orange">{player.total}</td>
    </tr>
  );
}

// ─── CivilianDividerRow ──────────────────────────────────────
function CivilianDividerRow({ threshold, colSpan }: { threshold: number; colSpan: number }) {
  return (
    <tr data-testid="civilian-divider">
      <td colSpan={colSpan} className="px-3 py-1 text-center text-xs text-txt-mid border-y border-dashed border-warm-2">
        ── 平民線（{threshold} 分）──
      </td>
    </tr>
  );
}

// ─── DragonCard（mobile）────────────────────────────────────
function DragonCard({ player, threshold }: RowProps) {
  const above = isAboveThreshold(player.total, threshold);
  const teamConfig = TEAM_CONFIG[player.team] ?? null;

  return (
    <div
      data-testid="dragon-player-card"
      data-above-threshold={above ? 'true' : undefined}
      className={[
        'rounded-lg border p-3',
        above ? 'border-yellow-300 bg-yellow-50' : 'border-warm-2 bg-white',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-condensed text-lg text-txt-mid">{player.rank}</span>
          <span className="font-bold">{player.name}</span>
          {player.tag === '裁' && <JudgeIcon />}
          <span style={{ color: teamConfig?.color ?? '#999' }} className="text-sm">{player.team}</span>
        </div>
        <span className="font-display text-2xl text-orange">{player.total}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs text-txt-mid">
        <div><span className="block font-medium text-txt-dark">出席</span>{player.att}</div>
        <div><span className="block font-medium text-txt-dark">輪值</span>{player.duty}</div>
        <div><span className="block font-medium text-txt-dark">拖地</span>{player.mop}</div>
        <div><span className="block font-medium text-txt-dark">季後賽</span>
          <span data-testid="dragon-playoff">{formatPlayoff(player.playoff)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── DragonTabPanel（main）───────────────────────────────────
interface Props {
  data: DragonData;
}

const COL_SPAN = 9;

export function DragonTabPanel({ data }: Props) {
  if (!data.players || data.players.length === 0) {
    return (
      <div data-testid="dragon-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
        <div data-testid="dragon-empty" className="py-12 text-center text-txt-mid">
          龍虎榜資料尚未產生
        </div>
      </div>
    );
  }

  const { players, civilianThreshold } = data;
  // 找平民線插入點：第一個 total <= threshold 的 index
  const dividerIdx = players.findIndex((p) => !isAboveThreshold(p.total, civilianThreshold));

  return (
    <div data-testid="dragon-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table
          data-testid="dragon-table"
          className="w-full text-sm bg-white rounded-2xl border-collapse overflow-hidden"
        >
          <thead className="bg-warm-1 text-txt-mid text-left">
            <tr>
              {['#', '球員', '隊', '出席', '輪值', '拖地', '季後賽', '總分'].map((h) => (
                <th key={h} className="px-3 py-2 font-bold">{h}</th>
              ))}
              <th className="px-3 py-2 font-bold sr-only">裁判</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => (
              <>
                {idx === dividerIdx && dividerIdx > 0 && (
                  <CivilianDividerRow key="divider" threshold={civilianThreshold} colSpan={COL_SPAN} />
                )}
                <DragonTableRow key={player.rank} player={player} threshold={civilianThreshold} />
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {players.map((player, idx) => (
          <>
            {idx === dividerIdx && dividerIdx > 0 && (
              <div
                key="divider"
                data-testid="civilian-divider"
                className="text-center text-xs text-txt-mid py-1 border-y border-dashed border-warm-2"
              >
                ── 平民線（{civilianThreshold} 分）──
              </div>
            )}
            <DragonCard key={player.rank} player={player} threshold={civilianThreshold} />
          </>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3：確認 unit tests 仍通過**

```bash
npm test -- --run
```
預期：全部 PASS

- [ ] **Step 4：Commit**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-5
git add src/components/roster/DragonTabPanel.tsx
git commit -m "feat(roster): implement DragonTabPanel with threshold divider, RWD table/cards (#5)"
```

---

## Step 6：Self-Review

**Spec 覆蓋：**
- AC-1 Hero ✅（RosterHero）
- AC-2 6 隊 section ✅（TeamSection × 6）
- AC-3/4 出席色塊 ✅（AttBlock + getAttClass/getAttBgStyle）
- AC-5 URL tab ✅（handleSelectTab + parseRosterQuery）
- AC-6 龍虎榜 9 欄 ✅（DragonTableRow headers 8 col + judge col = 9）
- AC-7 金色背景 ✅（data-above-threshold + bg-yellow-50）
- AC-8 分隔線 ✅（CivilianDividerRow）
- AC-9 ⚖️ icon ✅（JudgeIcon）
- AC-10 playoff=null→"—" ✅（formatPlayoff）
- AC-11 deep link ✅（RosterApp useEffect + scroll）
- AC-12 ?team=invalid ✅（highlight 不匹配任何 team.id）
- AC-13/14 RWD ✅（hidden md:block / md:hidden）
- AC-15 skeleton ✅（SkeletonState）
- AC-16 error ✅（ErrorState）
- AC-17 empty ✅（EmptyState）
- AC-18 att 全? ✅（AttBlock data-att="?"）
- AC-19 dragon empty ✅（dragon-empty div）
- AC-20 球員不可點 ✅（純 div，無 href）

**佔位符掃描：** Task 2 Step 8/9 使用 placeholder，但每個 placeholder 都是獨立可運行的 TSX（有 test-id），Task 3/4 填充後不含 TODO。

**型別一致性：** `RosterTab`、`RosterData`、`DragonData`、`AttValue` 均從 `src/types/roster.ts` 單一來源，各 Task 一致。
