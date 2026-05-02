# 首頁即時概覽 Dashboard 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將首頁（`/`）從純導覽 grid 升級為 5 區塊 dashboard（Hero + 本週賽程 + 戰績榜迷你版 + 領先榜 + 龍虎榜），資料來源 `home.json`。

**Architecture:** Astro island（`client:visible`），HomeDashboard.tsx 負責 state machine（loading/error/empty/ok），各區塊為純顯示子元件。沿用 ScheduleApp / StandingsApp 的 `fetchData` 三層 fallback + `reloadKey` retry 模式。

**Tech Stack:** Astro 6 + React（island）、Tailwind CSS 4、TypeScript strict、Vitest（unit）、Playwright（E2E）

**個人風格規則**：命中 2 條 — style-skeleton-loading, style-rwd-list

**Code Graph**：圖未建立，跳過

---

## Coverage Matrix

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| U-1 | getStreakStyle win/lose → class + arrow | Task 1 Step 1 | unit test |
| U-2 | getStreakStyle null → 無 arrow | Task 1 Step 1 | unit test |
| U-3 | limitTop players < 3 不報錯 | Task 1 Step 1 | unit test |
| U-4 | limitTop dragon < 5 不報錯 | Task 1 Step 1 | unit test |
| I-1 | fetchData('home') 三層 fallback | — | ✅ 既有 tests/integration/api-fallback.integration.test.ts |
| E-1~E-22 | 所有 E2E 案例 | — | tests/e2e/features/home/*.spec.ts（qa-v2 Phase 6）|

---

## Task 相依關係

```
Task 1（Types + Utils）
  └─ Task 2（State Components）   ←─ 並行
  └─ Task 3（Content Components）  ←─ 並行
       └─ Task 4（Island + Page）
```

- Task 1 → Task 2, 3 並行
- Task 4 等 Task 2 + Task 3 都完成後才執行

---

### Task 1：Types + Utils + Unit Tests

**Files:**
- Create: `src/types/home.ts`
- Create: `src/lib/home-utils.ts`
- Test: `tests/unit/home-utils.test.ts`

## Style Rules

無命中（純 TypeScript 工具函式，不涉及 UI 或非同步）

- [ ] **Step 1：寫失敗測試（TDD）**

```typescript
// tests/unit/home-utils.test.ts
import { describe, it, expect } from 'vitest';
import { getStreakStyle, limitTop } from '../../src/lib/home-utils';

describe('getStreakStyle', () => {
  // Covers: U-1
  it('win → 橙色 class + ↑ arrow', () => {
    const result = getStreakStyle('win');
    expect(result.arrow).toBe('↑');
    expect(result.colorClass).toContain('orange');
  });

  it('lose → 紅色 class + ↓ arrow', () => {
    const result = getStreakStyle('lose');
    expect(result.arrow).toBe('↓');
    expect(result.colorClass).toContain('red');
  });

  // Covers: U-2
  it('null → arrow 為空字串（不顯示 icon）', () => {
    const result = getStreakStyle(null);
    expect(result.arrow).toBe('');
  });

  it('undefined-like null → colorClass 為中性色', () => {
    const result = getStreakStyle(null);
    expect(result.colorClass).not.toContain('orange');
    expect(result.colorClass).not.toContain('red');
  });
});

describe('limitTop', () => {
  // Covers: U-3
  it('超過指定數量時 slice', () => {
    expect(limitTop([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });

  it('剛好 3 筆不截斷', () => {
    expect(limitTop([1, 2, 3], 3)).toEqual([1, 2, 3]);
  });

  // Covers: U-3, U-4
  it('少於指定數量時回傳現有，不報錯', () => {
    expect(limitTop([1], 3)).toEqual([1]);
    expect(limitTop([], 5)).toEqual([]);
  });

  it('支援任意型別（object）', () => {
    const items = [{ name: 'A' }, { name: 'B' }];
    expect(limitTop(items, 5)).toHaveLength(2);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
cd ../taan-basketball-league-issue-6 && npm test tests/unit/home-utils.test.ts
```
預期：FAIL — "Cannot find module '../../src/lib/home-utils'"

- [ ] **Step 3：建立 `src/types/home.ts`**

```typescript
// src/types/home.ts
export type HomeStreakType = 'win' | 'lose' | null;

export interface MiniStatsPlayer {
  rank: number;
  name: string;
  team: string;
  val: number;
}

export interface MiniStatCategory {
  label: string;
  unit: string;
  players: MiniStatsPlayer[];
}

export interface HomeStandingTeam {
  rank: number;
  name: string;
  team: string;
  record: string;
  pct: string;
  history: string[];
  streak: string;
  streakType: HomeStreakType;
}

export interface DragonEntry {
  rank: number;
  name: string;
  team: string;
  att: number;
  duty: number;
  total: number;
}

export interface HomeData {
  season: number;
  currentWeek: number;
  phase: string;
  scheduleInfo: {
    date: string;
    venue: string;
  };
  standings: HomeStandingTeam[];
  dragonTop10: DragonEntry[];
  miniStats: {
    pts: MiniStatCategory;
    reb: MiniStatCategory;
    ast: MiniStatCategory;
  };
}
```

- [ ] **Step 4：建立 `src/lib/home-utils.ts`**

```typescript
// src/lib/home-utils.ts
import type { HomeStreakType } from '../types/home';

export interface StreakStyle {
  colorClass: string;
  arrow: '' | '↑' | '↓';
}

export function getStreakStyle(type: HomeStreakType): StreakStyle {
  if (type === 'win') return { colorClass: 'text-orange', arrow: '↑' };
  if (type === 'lose') return { colorClass: 'text-red-600', arrow: '↓' };
  return { colorClass: 'text-txt-mid', arrow: '' };
}

/** slice 並在長度不足時安全回傳現有（不報錯，不補空白佔位） */
export function limitTop<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}
```

- [ ] **Step 5：確認測試通過**

```bash
npm test tests/unit/home-utils.test.ts
```
預期：PASS（4 個 describe，8 個 test）

- [ ] **Step 6：Commit**

```bash
git add src/types/home.ts src/lib/home-utils.ts tests/unit/home-utils.test.ts
git commit -m "feat(home): add HomeData types, home-utils (getStreakStyle, limitTop) (#6)"
```

---

### Task 2：State Components（Skeleton / Error / Empty）

**Files:**
- Create: `src/components/home/SkeletonState.tsx`
- Create: `src/components/home/ErrorState.tsx`
- Create: `src/components/home/EmptyState.tsx`

**依賴：** Task 1（僅共用 Tailwind design tokens，不依賴 home.ts types）

## Style Rules（subagent 必讀）

### style-skeleton-loading（命中原因：home dashboard 有非同步 fetch）

**禁止：**
- ❌ 整頁 spinner 擋住視口
- ❌ 頁面空白等資料
- ❌ `opacity-0` 隱藏內容直到 JS 執行完

**正確做法：** 元件內 skeleton state，`status === "loading"` 時回傳 skeleton component（不回傳空白或 spinner）

```tsx
if (status === "loading") return <HomeSkeleton />;

function HomeSkeleton() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse" data-testid="home-skeleton">
      {/* Hero skeleton */}
      <div className="h-10 w-48 bg-gray-200 rounded mx-auto mb-2" />
      <div className="h-5 w-32 bg-gray-200 rounded mx-auto mb-8" />
      {/* 4 區塊灰塊 */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-2xl mb-4" />
      ))}
    </div>
  );
}
```

Skeleton 形狀對應真實內容（Hero 長條 + 4 區塊），`animate-pulse`，不用文字說明。

- [ ] **Step 1：建立 `src/components/home/SkeletonState.tsx`**

```tsx
// src/components/home/SkeletonState.tsx
export function SkeletonState() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse" data-testid="home-skeleton">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded mx-auto mb-2" />
        <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
      </div>
      {/* 4 區塊 */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-2xl mb-4" />
      ))}
    </div>
  );
}
```

- [ ] **Step 2：建立 `src/components/home/ErrorState.tsx`**

```tsx
// src/components/home/ErrorState.tsx
interface Props {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: Props) {
  return (
    <div className="px-4 py-12 max-w-md mx-auto text-center" data-testid="home-error">
      <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
      <p className="text-lg text-txt-dark mb-2">無法載入聯盟資訊</p>
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

- [ ] **Step 3：建立 `src/components/home/EmptyState.tsx`**

```tsx
// src/components/home/EmptyState.tsx
export function EmptyState() {
  return (
    <div className="px-4 py-12 max-w-md mx-auto text-center" data-testid="home-empty">
      <p className="text-lg text-txt-dark">賽季尚未開始 ⛹️</p>
    </div>
  );
}
```

- [ ] **Step 4：Commit**

```bash
git add src/components/home/
git commit -m "feat(home): add Skeleton/Error/Empty state components (#6)"
```

---

### Task 3：Content Section Components

**Files:**
- Create: `src/components/home/HeroBanner.tsx`
- Create: `src/components/home/ScheduleBlock.tsx`
- Create: `src/components/home/MiniStandings.tsx`
- Create: `src/components/home/MiniLeaders.tsx`
- Create: `src/components/home/MiniDragon.tsx`

**依賴：** Task 1（`src/types/home.ts`、`src/lib/home-utils.ts`）

## Style Rules（subagent 必讀）

### style-skeleton-loading（命中：有 fetch data 展示）

子元件為純顯示（pure display），不做 fetch，不需要 skeleton。Skeleton 由父元件（HomeDashboard）統一控制。子元件僅接收已有資料的 props 並渲染。

### style-rwd-list（命中：MiniStandings 5 個欄位，MiniDragon 4 欄位）

**MiniStandings：**
- PC（md 以上）：table 橫排（rank / 隊色點+名 / 勝敗 / 勝率 / 連勝）

```tsx
<div className="hidden md:block">
  <table className="w-full">...</table>
</div>
```

- Mobile（md 以下）：compact 每行一張卡片（rank + 隊名 + 勝敗 + 連勝）

```tsx
<div className="md:hidden space-y-2">
  {teams.map(team => (
    <a key={team.team} ...>
      <div className="flex items-center justify-between">
        <span>#{team.rank} {teamDot} {team.name}</span>
        <span>{team.record}</span>
        <StreakLabel team={team} />
      </div>
    </a>
  ))}
</div>
```

**MiniDragon：** 4 個欄位（rank / 名 / 隊 / 總分）
- PC：table 橫排
- Mobile：每行 flex row（rank + 名 + 隊色 + 總分）

- [ ] **Step 1：建立 `src/components/home/HeroBanner.tsx`**

```tsx
// src/components/home/HeroBanner.tsx
import type { HomeData } from '../../types/home';

interface Props {
  season: HomeData['season'];
  phase: HomeData['phase'];
  currentWeek: HomeData['currentWeek'];
}

export function HeroBanner({ season, phase, currentWeek }: Props) {
  return (
    <header className="text-center mb-8">
      <h1 className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2">
        TAAN BASKETBALL
      </h1>
      <p className="font-display text-xl text-navy tracking-wide">
        第 {season} 季
      </p>
      <p className="text-txt-mid text-sm mt-1">
        {phase} · 第 {currentWeek} 週
      </p>
    </header>
  );
}
```

- [ ] **Step 2：建立 `src/components/home/ScheduleBlock.tsx`**

```tsx
// src/components/home/ScheduleBlock.tsx
import type { HomeData } from '../../types/home';

interface Props {
  scheduleInfo: HomeData['scheduleInfo'];
  baseUrl: string;
}

export function ScheduleBlock({ scheduleInfo, baseUrl }: Props) {
  const href = `${baseUrl.replace(/\/$/, '')}/schedule`;
  return (
    <section
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
      data-testid="home-schedule"
    >
      <h2 className="font-condensed font-bold text-navy text-lg mb-2">📅 本週賽程</h2>
      <p className="text-txt-dark mb-1">
        下次比賽：{scheduleInfo.date}
      </p>
      <p className="text-txt-mid text-sm mb-3">📍 {scheduleInfo.venue}</p>
      <a
        href={href}
        className="inline-block text-sm font-bold text-orange hover:underline"
      >
        看本週對戰 →
      </a>
    </section>
  );
}
```

- [ ] **Step 3：建立 `src/components/home/MiniStandings.tsx`**

```tsx
// src/components/home/MiniStandings.tsx
import type { HomeStandingTeam } from '../../types/home';
import { getStreakStyle } from '../../lib/home-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface Props {
  teams: HomeStandingTeam[];
  baseUrl: string;
}

function teamDotStyle(teamId: string) {
  const config = TEAM_CONFIG[teamId];
  return { backgroundColor: config?.color ?? '#999' };
}

function buildRosterHref(baseUrl: string, teamId: string) {
  const config = TEAM_CONFIG[teamId];
  return `${baseUrl.replace(/\/$/, '')}/roster?team=${config?.id ?? teamId}`;
}

function StreakCell({ team }: { team: HomeStandingTeam }) {
  const { colorClass, arrow } = getStreakStyle(team.streakType);
  return (
    <span
      data-testid="streak"
      data-streak-type={team.streakType ?? ''}
      className={`font-condensed text-sm ${colorClass}`}
    >
      {team.streak}
      {arrow
        ? <span data-testid="streak-icon" aria-hidden="true"> {arrow}</span>
        : null
      }
    </span>
  );
}

export function MiniStandings({ teams, baseUrl }: Props) {
  return (
    <section
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
      data-testid="home-standings"
    >
      <h2 className="font-condensed font-bold text-navy text-lg mb-3">🏆 戰績榜</h2>

      {/* Mobile：compact card rows */}
      <div className="md:hidden space-y-2">
        {teams.map((team) => (
          <a
            key={team.team}
            href={buildRosterHref(baseUrl, team.team)}
            data-testid="home-standings-row"
            className="flex items-center justify-between py-1.5 border-b border-warm-1 last:border-0 hover:bg-warm-1 rounded px-1 transition"
            aria-label={`${team.name} 第 ${team.rank} 名`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span data-testid="rank" className="text-xs text-txt-mid w-4 shrink-0">{team.rank}</span>
              <span data-testid="team-dot" className="w-2.5 h-2.5 rounded-full shrink-0" style={teamDotStyle(team.team)} />
              <span data-testid="team-name" className="font-bold text-sm text-navy truncate">{team.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span data-testid="record" className="text-xs text-txt-mid">{team.record}</span>
              <StreakCell team={team} />
            </div>
          </a>
        ))}
      </div>

      {/* Desktop：table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-txt-mid border-b border-warm-2">
              <th className="text-left py-1 w-6">#</th>
              <th className="text-left py-1">隊伍</th>
              <th className="text-left py-1">勝敗</th>
              <th className="text-left py-1">勝率</th>
              <th className="text-left py-1">連勝</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr
                key={team.team}
                data-testid="home-standings-row"
                className="border-b border-warm-1 last:border-0 hover:bg-warm-1 transition"
              >
                <td className="py-1.5"><span data-testid="rank" className="text-txt-mid">{team.rank}</span></td>
                <td className="py-1.5">
                  <a
                    href={buildRosterHref(baseUrl, team.team)}
                    className="flex items-center gap-1.5 hover:text-orange"
                  >
                    <span data-testid="team-dot" className="w-2.5 h-2.5 rounded-full" style={teamDotStyle(team.team)} />
                    <span data-testid="team-name" className="font-bold text-navy">{team.name}</span>
                  </a>
                </td>
                <td className="py-1.5"><span data-testid="record">{team.record}</span></td>
                <td className="py-1.5"><span data-testid="pct">{team.pct}</span></td>
                <td className="py-1.5"><StreakCell team={team} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-right">
        <a
          href={`${baseUrl.replace(/\/$/, '')}/standings`}
          className="text-sm font-bold text-orange hover:underline"
        >
          看完整戰績 →
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4：建立 `src/components/home/MiniLeaders.tsx`**

```tsx
// src/components/home/MiniLeaders.tsx
import type { MiniStatCategory } from '../../types/home';
import { limitTop } from '../../lib/home-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface Props {
  miniStats: { pts: MiniStatCategory; reb: MiniStatCategory; ast: MiniStatCategory };
  baseUrl: string;
}

function StatCategory({ cat }: { cat: MiniStatCategory }) {
  const top3 = limitTop(cat.players, 3);
  return (
    <div className="flex-1 min-w-0" data-testid="leader-category">
      <h3 className="text-xs font-bold text-txt-mid mb-2 uppercase tracking-wide">
        {cat.label} {cat.unit}
      </h3>
      <div className="space-y-1">
        {top3.map((player) => {
          const color = TEAM_CONFIG[player.team]?.color ?? '#999';
          return (
            <div key={`${player.name}-${player.rank}`} className="flex items-center gap-1.5" data-testid="leader-entry">
              <span className="text-xs text-txt-mid w-4">{player.rank}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span data-testid="leader-name" className="text-sm font-bold text-navy truncate flex-1">{player.name}</span>
              <span className="text-sm text-orange font-condensed shrink-0">{player.val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MiniLeaders({ miniStats, baseUrl }: Props) {
  const href = `${baseUrl.replace(/\/$/, '')}/boxscore?tab=leaders`;
  return (
    <section
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
      data-testid="home-leaders"
    >
      <h2 className="font-condensed font-bold text-navy text-lg mb-3">📊 領先榜</h2>
      {/* 三指標橫排（md 以上），直排（mobile）*/}
      <div className="flex flex-col md:flex-row gap-4">
        <StatCategory cat={miniStats.pts} />
        <StatCategory cat={miniStats.reb} />
        <StatCategory cat={miniStats.ast} />
      </div>
      <div className="mt-3 text-right">
        <a href={href} className="text-sm font-bold text-orange hover:underline">
          看完整領先榜 →
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 5：建立 `src/components/home/MiniDragon.tsx`**

```tsx
// src/components/home/MiniDragon.tsx
import type { DragonEntry } from '../../types/home';
import { limitTop } from '../../lib/home-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface Props {
  dragonTop10: DragonEntry[];
  baseUrl: string;
}

export function MiniDragon({ dragonTop10, baseUrl }: Props) {
  const top5 = limitTop(dragonTop10, 5);
  const href = `${baseUrl.replace(/\/$/, '')}/roster?tab=dragon`;
  return (
    <section
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
      data-testid="home-dragon"
    >
      <h2 className="font-condensed font-bold text-navy text-lg mb-3">🐉 龍虎榜</h2>

      {/* Mobile：compact rows */}
      <div className="md:hidden space-y-2">
        {top5.map((entry) => {
          const color = TEAM_CONFIG[entry.team]?.color ?? '#999';
          return (
            <div key={entry.rank} data-testid="dragon-row" className="flex items-center gap-2 border-b border-warm-1 last:border-0 py-1.5">
              <span data-testid="rank" className="text-xs text-txt-mid w-4">{entry.rank}</span>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span data-testid="name" className="font-bold text-sm text-navy flex-1">{entry.name}</span>
              <span data-testid="team" className="text-xs text-txt-mid">{entry.team}</span>
              <span data-testid="total" className="text-sm font-condensed text-orange">{entry.total}</span>
            </div>
          );
        })}
      </div>

      {/* Desktop：table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-txt-mid border-b border-warm-2">
              <th className="text-left py-1 w-6">#</th>
              <th className="text-left py-1">名</th>
              <th className="text-left py-1">隊</th>
              <th className="text-right py-1">總分</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((entry) => {
              const color = TEAM_CONFIG[entry.team]?.color ?? '#999';
              return (
                <tr key={entry.rank} data-testid="dragon-row" className="border-b border-warm-1 last:border-0">
                  <td className="py-1.5"><span data-testid="rank" className="text-txt-mid">{entry.rank}</span></td>
                  <td className="py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span data-testid="name" className="font-bold text-navy">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5"><span data-testid="team">{entry.team}</span></td>
                  <td className="py-1.5 text-right"><span data-testid="total" className="text-orange font-condensed">{entry.total}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-right">
        <a href={href} className="text-sm font-bold text-orange hover:underline">
          看完整龍虎榜 →
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 6：Commit**

```bash
git add src/components/home/
git commit -m "feat(home): add Hero/Schedule/MiniStandings/MiniLeaders/MiniDragon components (#6)"
```

---

### Task 4：HomeDashboard Island + index.astro 整合

**Files:**
- Create: `src/components/home/HomeDashboard.tsx`
- Modify: `src/pages/index.astro`

**依賴：** Task 2（SkeletonState, ErrorState, EmptyState）、Task 3（所有 Content Components）

## Style Rules（subagent 必讀）

### style-skeleton-loading（命中：HomeDashboard 有非同步 fetch）

**禁止：**
- ❌ 整頁 spinner 擋住視口
- ❌ 頁面空白等資料
- ❌ `opacity-0` 隱藏到 JS 執行完

**正確做法：** `status === "loading"` → 回傳 `<SkeletonState />`（已在 Task 2 實作，形狀對應 4 個區塊），不回傳空白。

沿用 StandingsApp / ScheduleApp 的 state machine 模式：

```tsx
type Status = 'loading' | 'error' | 'empty' | 'ok';
const [status, setStatus] = useState<Status>('loading');
const [reloadKey, setReloadKey] = useState(0);
// useEffect 監聽 reloadKey，handleRetry = setReloadKey((k) => k + 1)
```

### style-rwd-list（命中：dashboard 含多欄位列表區塊）

主 layout 規則（HomeDashboard 層面）：
- 戰績榜 + 龍虎榜：mobile 垂直堆疊，desktop 並排兩欄
- 領先榜：mobile 直排，desktop 三欄橫排（由 MiniLeaders 內部 flex 處理）

```tsx
{/* 桌機：戰績榜 + 龍虎榜並排 */}
<div className="md:grid md:grid-cols-2 md:gap-4">
  <MiniStandings teams={teams} baseUrl={baseUrl} />
  <MiniDragon dragonTop10={data.dragonTop10} baseUrl={baseUrl} />
</div>
```

- [ ] **Step 1：建立 `src/components/home/HomeDashboard.tsx`**

```tsx
// src/components/home/HomeDashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import type { HomeData } from '../../types/home';
import { fetchData } from '../../lib/api';
import { SkeletonState } from './SkeletonState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { HeroBanner } from './HeroBanner';
import { ScheduleBlock } from './ScheduleBlock';
import { MiniStandings } from './MiniStandings';
import { MiniLeaders } from './MiniLeaders';
import { MiniDragon } from './MiniDragon';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  baseUrl: string;
}

export function HomeDashboard({ baseUrl }: Props) {
  const [data, setData] = useState<HomeData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const result = await fetchData<HomeData>('home');
      if (cancelled) return;

      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }

      const home = result.data;
      setData(home);

      const hasData =
        home.standings?.length > 0 ||
        home.dragonTop10?.length > 0;

      if (!hasData) {
        setStatus('empty');
        return;
      }

      setStatus('ok');
    })();

    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);

  if (status === 'loading') return <SkeletonState />;
  if (status === 'error') return <ErrorState onRetry={handleRetry} />;
  if (status === 'empty' || !data) return <EmptyState />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pb-8" data-testid="home-dashboard">
      <HeroBanner
        season={data.season}
        phase={data.phase}
        currentWeek={data.currentWeek}
      />

      <ScheduleBlock scheduleInfo={data.scheduleInfo} baseUrl={baseUrl} />

      <MiniLeaders miniStats={data.miniStats} baseUrl={baseUrl} />

      {/* 戰績榜 + 龍虎榜：mobile 垂直堆疊、desktop 並排兩欄 */}
      <div className="md:grid md:grid-cols-2 md:gap-4">
        <MiniStandings teams={data.standings} baseUrl={baseUrl} />
        <MiniDragon dragonTop10={data.dragonTop10} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2：修改 `src/pages/index.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import { HomeDashboard } from '../components/home/HomeDashboard';

const baseUrl = import.meta.env.BASE_URL;
---

<Layout title="首頁" active="home">
  <HomeDashboard client:visible baseUrl={baseUrl} />
</Layout>
```

（移除舊的 nav grid HTML）

- [ ] **Step 3：本機驗證**

```bash
npm run dev
# 瀏覽 http://localhost:4321/taan-basketball-league/
# 確認：Hero + 賽程 + 領先榜 + 戰績/龍虎榜並排
```

- [ ] **Step 4：跑全部 unit tests**

```bash
npm test
```
預期：所有既有 unit tests + home-utils.test.ts 全 PASS

- [ ] **Step 5：Commit**

```bash
git add src/components/home/HomeDashboard.tsx src/pages/index.astro
git commit -m "feat(home): implement HomeDashboard island + integrate index.astro (#6)"
```

---

## Self-Review Checklist

- [x] AC-1~17 每條都有對應 Task + E2E spec
- [x] 無 TBD / TODO / "Similar to Task N" 佔位符
- [x] 整合測試走 api-fallback 真實路徑（既有 ✅）
- [x] Unit tests 驗回傳值，非 assert_called
- [x] style-skeleton-loading 遵從：Task 4 status=loading → SkeletonState，不空白
- [x] style-rwd-list 遵從：MiniStandings + MiniDragon 各有 md:hidden / hidden md:block 雙呈現
- [x] data-testid 與 E2E spec 一致（home-dashboard, home-standings-row, streak-icon, leader-entry, dragon-row, ...）
- [x] baseUrl 透過 props 傳入 island，不在元件內直接讀 import.meta.env
