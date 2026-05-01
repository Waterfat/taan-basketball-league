# Issue #1 — /schedule 賽程頁實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實作 /schedule 賽程頁，含 Hero header、chip timeline、對戰卡（含 staff 展開）、loading/error/empty 三狀態，三層 fallback（GAS → static JSON → empty）。

**Architecture:** 單頁 Astro page（`src/pages/schedule.astro`）渲染靜態框架，內含一個 React island（`ScheduleApp`）負責所有互動邏輯與資料抓取。State 管理用 React hooks（useState + useEffect），不引入額外 store。資料層沿用 `src/lib/api.ts` 的三層 fallback。

**Tech Stack:** Astro 6 / Tailwind 4 / React 19 island / TypeScript strict / Vitest / Playwright

**個人風格規則**：命中 1 條 — `style-skeleton-loading`（AC-10 + 切週瞬間需有視覺回饋）

**Code Graph**：圖未建立（新專案首個 Issue），跳過

---

## Coverage Matrix

從 `docs/delivery/issue-1_qaplan.md` 載入。E-* 已寫入 `tests/e2e/features/schedule.spec.ts`，I-* 已寫入 `tests/integration/api-fallback.integration.test.ts`，皆通過。U-* ⬜ 由本計畫 Task 建立。

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| U-1 | 平手場次處理 | Task 2 Step 1 | unit (`schedule-utils.test.ts`) |
| U-2 | 無 staff 資料時 toggle 顯示處理 | Task 5 Step 1 | unit (`staff-display.test.ts`) |
| U-3 | 找上一個有資料週的邏輯 | Task 2 Step 1 | unit (`schedule-utils.test.ts`) |
| U-4 | getCurrentWeek 邏輯 | Task 2 Step 1 | unit (`schedule-utils.test.ts`) |
| U-5 | isWinner / 比分判斷 | Task 2 Step 1 | unit (`schedule-utils.test.ts`) |
| U-6 | suspended week 偵測邏輯 | Task 2 Step 1 | unit (`schedule-utils.test.ts`) |
| I-1, I-2 | api.ts 三層 fallback | — | `tests/integration/api-fallback.integration.test.ts`（已通過 Phase 1.2） |
| E-1 ~ E-30 | 全部 E2E（含 RWD + 三狀態）| — | `tests/e2e/features/schedule.spec.ts`（Phase 6 執行） |

---

## 檔案規劃

### 新建
- `src/types/schedule.ts` — TypeScript 型別（Week / Game / ScheduleData）
- `src/lib/schedule-utils.ts` — 純函式（getCurrentWeek、findPreviousWeekWithData、getWinner、isSuspended、hasStaff）
- `src/components/schedule/SkeletonState.tsx` — 載入骨架
- `src/components/schedule/ErrorState.tsx` — 錯誤訊息 + 重試
- `src/components/schedule/EmptyState.tsx` — 「本週無賽程」+ 看上一週按鈕
- `src/components/schedule/ScheduleHero.tsx` — Hero 標題區
- `src/components/schedule/ChipTimeline.tsx` — 週次 chip 列（含 suspended chip + popover）
- `src/components/schedule/GameCard.tsx` — 對戰卡（含 staff 展開）
- `src/components/schedule/ScheduleApp.tsx` — 主 island，組裝以上所有元件 + 狀態管理
- `tests/unit/schedule-utils.test.ts` — Task 2 TDD
- `tests/unit/staff-display.test.ts` — Task 5 TDD

### 修改
- `src/pages/schedule.astro` — 移除 stub，掛載 `<ScheduleApp client:load />`
- `astro.config.mjs` — 加 `@astrojs/react` integration
- `package.json` — 加 react、react-dom、@astrojs/react、@types/react、@types/react-dom

### 不修改（已存在通過）
- `src/lib/api.ts`（三層 fallback 已實作 + 4 個 integration test 通過）
- `tests/e2e/features/schedule.spec.ts`（qa-v2 已寫，本 plan 不重寫）
- `tests/integration/api-fallback.integration.test.ts`（qa-v2 已寫並通過）

---

## Task 相依與並行

```
Task 1 (Astro React 整合)            ↓
  ↓
Task 2 (utils + types)
  ↓
  ├─ Task 3 (state components)  ⎫
  ├─ Task 4 (ChipTimeline)      ⎬─ 並行
  ├─ Task 5 (GameCard)          ⎪
  └─ Task 6 (ScheduleHero)      ⎭
  ↓
Task 7 (ScheduleApp 主 island)
  ↓
Task 8 (頁面整合 + E2E 驗證)
```

並行群組：B = {3, 4, 5, 6}，可同時 dispatch 4 個 subagent。

---

## Task 1：加入 Astro React 整合

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`

- [ ] **Step 1：安裝套件**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-1
npm install --save react@^19 react-dom@^19 @astrojs/react
npm install --save-dev @types/react @types/react-dom
```

- [ ] **Step 2：修改 `astro.config.mjs` 加 react integration**

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://waterfat.github.io',
  base: '/taan-basketball-league',
  trailingSlash: 'ignore',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3：驗證 build 通過**

```bash
npm run build
```
預期：build 成功，現有 5 個頁面照常產出。

- [ ] **Step 4：Commit**

```bash
git add package.json package-lock.json astro.config.mjs
git commit -m "feat(deps): add @astrojs/react integration for schedule island (#1)"
```

---

## Task 2：Schedule utils + types（TDD：U-1, U-3, U-4, U-5, U-6）

**Files:**
- Create: `src/types/schedule.ts`
- Create: `src/lib/schedule-utils.ts`
- Create: `tests/unit/schedule-utils.test.ts`

- [ ] **Step 1：寫失敗測試**

```typescript
// tests/unit/schedule-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
  getCurrentWeek,
  findPreviousWeekWithData,
  getWinner,
  isSuspended,
  hasStaff,
} from '../../src/lib/schedule-utils';
import {
  mockFullSchedule,
  mockEmptySchedule,
  mockFirstWeekOnly,
  mockGameWeek,
  mockSuspendedWeek,
  mockFinishedGame,
} from '../fixtures/schedule';

describe('schedule-utils', () => {
  // Covers: U-4 getCurrentWeek 邏輯
  describe('getCurrentWeek', () => {
    it('回傳 currentWeek 對應的 week 物件', () => {
      const data = mockFullSchedule(); // currentWeek = 5
      const week = getCurrentWeek(data);
      expect(week).not.toBeNull();
      expect(week?.type).toBe('game');
      if (week?.type === 'game') expect(week.week).toBe(5);
    });

    it('currentWeek 找不到對應 week → 回傳 null', () => {
      const data = { season: 25, currentWeek: 99, allWeeks: [mockGameWeek(1, '2026/1/10')] };
      expect(getCurrentWeek(data)).toBeNull();
    });

    it('allWeeks 為空 → 回傳 null', () => {
      expect(getCurrentWeek(mockEmptySchedule())).toBeNull();
    });
  });

  // Covers: U-3 找上一個有資料週的邏輯
  describe('findPreviousWeekWithData', () => {
    it('從 W6 往回找，跳過 suspended → 回傳 W5', () => {
      const data = mockFullSchedule();
      const prev = findPreviousWeekWithData(data, 6);
      expect(prev?.type).toBe('game');
      if (prev?.type === 'game') expect(prev.week).toBe(5);
    });

    it('第 1 週往回找 → 回傳 null', () => {
      const data = mockFirstWeekOnly();
      expect(findPreviousWeekWithData(data, 1)).toBeNull();
    });

    it('完全沒有 game 週 → 回傳 null', () => {
      const data = { season: 25, currentWeek: 1, allWeeks: [mockSuspendedWeek('2026/1/1', 'X')] };
      expect(findPreviousWeekWithData(data, 1)).toBeNull();
    });
  });

  // Covers: U-1 平手場次處理 + U-5 比分判斷
  describe('getWinner', () => {
    it('home 比分高 → home', () => {
      const game = mockFinishedGame('紅', '白', 34, 22);
      expect(getWinner(game)).toBe('home');
    });

    it('away 比分高 → away', () => {
      const game = mockFinishedGame('紅', '白', 22, 34);
      expect(getWinner(game)).toBe('away');
    });

    it('比分相同 → tie', () => {
      const game = mockFinishedGame('紅', '白', 22, 22);
      expect(getWinner(game)).toBe('tie');
    });

    it('未完賽（比分 null）→ none', () => {
      const game = { num: 1, time: '', home: '紅', away: '白', homeScore: null, awayScore: null, status: 'upcoming' as const, staff: {} };
      expect(getWinner(game)).toBe('none');
    });
  });

  // Covers: U-6 suspended week 偵測
  describe('isSuspended', () => {
    it('suspended week → true', () => {
      expect(isSuspended(mockSuspendedWeek('2026/2/14', '過年'))).toBe(true);
    });

    it('game week → false', () => {
      expect(isSuspended(mockGameWeek(1, '2026/1/10'))).toBe(false);
    });
  });

  // Covers: U-2 無 staff 資料時 toggle 邏輯
  describe('hasStaff', () => {
    it('staff 物件有任一非空陣列 → true', () => {
      expect(hasStaff({ 裁判: ['李昊明(黑)'], 場務: [] })).toBe(true);
    });

    it('staff 物件全空 → false', () => {
      expect(hasStaff({ 裁判: [], 場務: [] })).toBe(false);
    });

    it('staff 為空物件 → false', () => {
      expect(hasStaff({})).toBe(false);
    });
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npm test tests/unit/schedule-utils.test.ts
```
預期：FAIL — 模組不存在或函式未匯出

- [ ] **Step 3：實作型別**

```typescript
// src/types/schedule.ts
export type GameStatus = 'finished' | 'upcoming' | 'in_progress';

export interface Game {
  num: number;
  time: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  staff: Record<string, string[]>;
}

export interface GameWeek {
  type: 'game';
  week: number;
  date: string;
  phase: string;
  venue: string;
  matchups: Array<{ combo: number; home: string; away: string; homeScore: number | null; awayScore: number | null; status: string }>;
  games: Game[];
}

export interface SuspendedWeek {
  type: 'suspended';
  date: string;
  venue: string;
  reason: string;
}

export type ScheduleWeek = GameWeek | SuspendedWeek;

export interface ScheduleData {
  season: number;
  currentWeek: number;
  allWeeks: ScheduleWeek[];
  weeks?: Record<string, GameWeek>;
}

export type Winner = 'home' | 'away' | 'tie' | 'none';
```

- [ ] **Step 4：實作 utils**

```typescript
// src/lib/schedule-utils.ts
import type { Game, GameWeek, ScheduleData, ScheduleWeek, SuspendedWeek, Winner } from '../types/schedule';

export function getCurrentWeek(data: ScheduleData): GameWeek | null {
  const found = data.allWeeks.find(
    (w): w is GameWeek => w.type === 'game' && w.week === data.currentWeek,
  );
  return found ?? null;
}

export function findPreviousWeekWithData(data: ScheduleData, fromWeek: number): GameWeek | null {
  for (let i = data.allWeeks.length - 1; i >= 0; i--) {
    const w = data.allWeeks[i];
    if (w.type === 'game' && w.week < fromWeek) return w;
  }
  return null;
}

export function getWinner(game: Game): Winner {
  if (game.homeScore == null || game.awayScore == null) return 'none';
  if (game.homeScore > game.awayScore) return 'home';
  if (game.awayScore > game.homeScore) return 'away';
  return 'tie';
}

export function isSuspended(week: ScheduleWeek): week is SuspendedWeek {
  return week.type === 'suspended';
}

export function hasStaff(staff: Record<string, string[]>): boolean {
  return Object.values(staff).some((arr) => arr.length > 0);
}
```

- [ ] **Step 5：確認測試通過**

```bash
npm test tests/unit/schedule-utils.test.ts
```
預期：PASS — 13 個 case 全綠

- [ ] **Step 6：Commit**

```bash
git add src/types/schedule.ts src/lib/schedule-utils.ts tests/unit/schedule-utils.test.ts
git commit -m "feat(schedule): types + utils with unit tests (#1)"
```

---

## Task 3：State 元件（Skeleton / Error / Empty）

**Files:**
- Create: `src/components/schedule/SkeletonState.tsx`
- Create: `src/components/schedule/ErrorState.tsx`
- Create: `src/components/schedule/EmptyState.tsx`

- [ ] **Step 1：實作 SkeletonState**

```tsx
// src/components/schedule/SkeletonState.tsx
export function SkeletonState() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse">
      {/* Hero skeleton */}
      <div className="text-center mb-6">
        <div className="h-10 w-40 bg-gray-200 rounded mx-auto mb-3" />
        <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
      </div>

      {/* Chip timeline skeleton */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2" data-testid="skeleton-chip">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 w-12 md:w-20 bg-gray-200 rounded-lg flex-shrink-0" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl" data-testid="skeleton-card" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2：實作 ErrorState**

```tsx
// src/components/schedule/ErrorState.tsx
interface Props {
  onRetry: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message = '無法載入賽程' }: Props) {
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

- [ ] **Step 3：實作 EmptyState**

```tsx
// src/components/schedule/EmptyState.tsx
interface Props {
  onPrevWeek?: () => void;
  prevDisabled?: boolean;
  message?: string;
}

export function EmptyState({ onPrevWeek, prevDisabled = false, message = '本週無賽程，下週見' }: Props) {
  return (
    <div className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">⛹️</div>
      <p className="text-lg text-txt-dark mb-6">{message}</p>
      {onPrevWeek && !prevDisabled && (
        <button
          onClick={onPrevWeek}
          disabled={prevDisabled}
          className="px-6 py-2 bg-navy text-white rounded-lg font-bold hover:bg-navy-2 transition disabled:opacity-40"
        >
          看上一週
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4：型別檢查**

```bash
npx astro check
```
預期：0 errors, 0 warnings

- [ ] **Step 5：Commit**

```bash
git add src/components/schedule/SkeletonState.tsx src/components/schedule/ErrorState.tsx src/components/schedule/EmptyState.tsx
git commit -m "feat(schedule): loading/error/empty state components (#1)"
```

---

## Task 4：ChipTimeline + SuspendedChip

**Files:**
- Create: `src/components/schedule/ChipTimeline.tsx`

- [ ] **Step 1：實作 ChipTimeline**

```tsx
// src/components/schedule/ChipTimeline.tsx
import { useState } from 'react';
import type { ScheduleWeek, GameWeek, SuspendedWeek } from '../../types/schedule';
import { isSuspended } from '../../lib/schedule-utils';

interface Props {
  weeks: ScheduleWeek[];
  activeWeek: number;
  onSelect: (week: number) => void;
}

export function ChipTimeline({ weeks, activeWeek, onSelect }: Props) {
  const [popoverIdx, setPopoverIdx] = useState<number | null>(null);

  return (
    <div className="relative">
      <div
        className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-8 scrollbar-thin"
        role="tablist"
        aria-label="賽程週次時間軸"
      >
        {weeks.map((week, idx) => {
          if (isSuspended(week)) {
            return (
              <SuspendedChip
                key={`s-${idx}`}
                week={week}
                isOpen={popoverIdx === idx}
                onToggle={() => setPopoverIdx(popoverIdx === idx ? null : idx)}
              />
            );
          }
          const isActive = week.week === activeWeek;
          return (
            <button
              key={`w-${week.week}`}
              role="tab"
              aria-selected={isActive}
              data-testid="chip-week"
              data-active={isActive}
              onClick={() => onSelect(week.week)}
              className={[
                'flex-shrink-0 px-3 md:px-4 py-2 rounded-lg font-condensed font-bold transition whitespace-nowrap',
                isActive
                  ? 'bg-orange text-white'
                  : 'bg-warm-1 text-txt-mid hover:bg-warm-2',
              ].join(' ')}
            >
              <span className="md:hidden">W{week.week}</span>
              <span className="hidden md:inline">W{week.week} · {formatShortDate(week.date)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuspendedChip({
  week,
  isOpen,
  onToggle,
}: {
  week: SuspendedWeek;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative flex-shrink-0">
      <button
        data-testid="chip-suspended"
        aria-label={`暫停週：${week.reason}`}
        onClick={onToggle}
        className="px-3 py-2 rounded-lg bg-gray-200 text-gray-500 font-condensed text-sm hover:bg-gray-300 transition whitespace-nowrap"
      >
        休
      </button>
      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 top-full mt-2 left-0 bg-navy text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap"
        >
          {formatShortDate(week.date)} · {week.reason}
        </div>
      )}
    </div>
  );
}

function formatShortDate(date: string): string {
  // "2026/2/7" → "2/7"
  const parts = date.split('/');
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : date;
}
```

- [ ] **Step 2：型別檢查**

```bash
npx astro check
```

- [ ] **Step 3：Commit**

```bash
git add src/components/schedule/ChipTimeline.tsx
git commit -m "feat(schedule): ChipTimeline with suspended chip popover (#1)"
```

---

## Task 5：GameCard + StaffPanel（TDD：U-2 staff toggle）

**Files:**
- Create: `src/components/schedule/GameCard.tsx`
- Create: `tests/unit/staff-display.test.ts`

- [ ] **Step 1：寫失敗測試**

```typescript
// tests/unit/staff-display.test.ts
import { describe, it, expect } from 'vitest';
import { hasStaff } from '../../src/lib/schedule-utils';
import { mockFinishedGame } from '../fixtures/schedule';

describe('staff display logic (U-2)', () => {
  it('沒有 staff 資料 → toggle 不應該顯示', () => {
    const game = mockFinishedGame('紅', '白', 34, 22, 1, {});
    expect(hasStaff(game.staff)).toBe(false);
  });

  it('有 staff 資料（裁判 + 場務）→ toggle 應顯示', () => {
    const game = mockFinishedGame('紅', '白', 34, 22, 1, {
      裁判: ['李昊明(黑)'],
      場務: ['林毅豐(黑)'],
    });
    expect(hasStaff(game.staff)).toBe(true);
  });

  it('staff 物件存在但所有 key 都是空陣列 → toggle 不應顯示', () => {
    const game = mockFinishedGame('紅', '白', 34, 22, 1, { 裁判: [], 場務: [] });
    expect(hasStaff(game.staff)).toBe(false);
  });
});
```

- [ ] **Step 2：確認測試失敗**

```bash
npm test tests/unit/staff-display.test.ts
```
預期：先 PASS（hasStaff 已在 Task 2 實作），驗證 Task 2 邏輯支援 GameCard 需求

- [ ] **Step 3：實作 GameCard**

```tsx
// src/components/schedule/GameCard.tsx
import { useState } from 'react';
import type { Game } from '../../types/schedule';
import { getWinner, hasStaff } from '../../lib/schedule-utils';

const TEAM_COLOR_CLASS: Record<string, string> = {
  紅: 'bg-team-red',
  黑: 'bg-team-black',
  藍: 'bg-team-blue',
  綠: 'bg-team-green',
  黃: 'bg-team-yellow',
  白: 'bg-team-white',
};

const STAFF_LABELS: Record<string, string> = {
  裁判: '裁判',
  場務: '場務',
  攝影: '攝影',
  器材: '器材',
};

interface Props {
  game: Game;
  baseUrl: string;
}

export function GameCard({ game, baseUrl }: Props) {
  const [staffOpen, setStaffOpen] = useState(false);
  const winner = getWinner(game);
  const isFinished = game.status === 'finished';
  const showStaffToggle = hasStaff(game.staff);
  const staffCount = Object.values(game.staff).reduce((n, arr) => n + arr.length, 0);

  const handleClick = () => {
    if (isFinished) {
      window.location.href = `${baseUrl.replace(/\/$/, '')}/boxscore`;
    }
  };

  return (
    <article
      data-testid="game-card"
      data-status={game.status}
      onClick={handleClick}
      className={[
        'bg-white rounded-2xl border border-warm-2 p-4 md:p-5 transition-all',
        isFinished ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'cursor-default',
      ].join(' ')}
    >
      {/* 對戰：兩隊 + 比分 */}
      <div className="flex items-center justify-between mb-3">
        <TeamSide team={game.home} score={game.homeScore} isWinner={winner === 'home'} testid="home" />
        <div className="text-txt-light text-xs font-condensed mx-2">VS</div>
        <TeamSide team={game.away} score={game.awayScore} isWinner={winner === 'away'} testid="away" reverse />
      </div>

      <div className="border-t border-warm-2 pt-3 flex items-center justify-between">
        <StatusBadge status={game.status} />
        {showStaffToggle && (
          <button
            data-testid="staff-toggle"
            aria-label={staffOpen ? '收起工作人員' : '展開工作人員'}
            aria-expanded={staffOpen}
            onClick={(e) => {
              e.stopPropagation();
              setStaffOpen((prev) => !prev);
            }}
            className="text-sm text-txt-mid hover:text-orange transition flex items-center gap-1"
          >
            <span aria-hidden="true">👨‍⚖️</span>
            <span>{staffCount}</span>
            <span aria-hidden="true">{staffOpen ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {staffOpen && showStaffToggle && (
        <div data-testid="staff-panel" className="mt-3 pt-3 border-t border-warm-2 space-y-1 text-sm">
          {Object.entries(game.staff).map(([role, names]) =>
            names.length > 0 ? (
              <div key={role} className="flex gap-2">
                <span className="text-txt-light font-bold w-12">{STAFF_LABELS[role] ?? role}</span>
                <span className="text-txt-mid">{names.join('、')}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
    </article>
  );
}

function TeamSide({
  team,
  score,
  isWinner,
  testid,
  reverse = false,
}: {
  team: string;
  score: number | null;
  isWinner: boolean;
  testid: 'home' | 'away';
  reverse?: boolean;
}) {
  const colorClass = TEAM_COLOR_CLASS[team] ?? 'bg-gray-400';
  return (
    <div
      className={`flex-1 flex ${reverse ? 'flex-row-reverse text-right' : 'flex-row'} items-center gap-2`}
      data-winner={isWinner}
    >
      <div className={`w-3 h-3 rounded-full ${colorClass} flex-shrink-0`} aria-hidden="true" />
      <div className="flex flex-col">
        <div className="font-condensed text-sm text-txt-mid">{team}隊</div>
        <div
          data-testid={`score-${testid}`}
          className={`font-display text-2xl md:text-3xl ${isWinner ? 'text-orange font-extrabold' : 'text-txt-dark'}`}
        >
          {score == null ? '—' : score}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Game['status'] }) {
  const label = status === 'finished' ? '完賽' : '即將進行';
  const colorClass =
    status === 'finished'
      ? 'bg-warm-2 text-txt-mid'
      : 'bg-orange-light text-orange';
  return (
    <span
      data-testid="status-badge"
      className={`px-2 py-0.5 rounded text-xs font-condensed font-bold ${colorClass}`}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 4：執行 unit test**

```bash
npm test tests/unit/staff-display.test.ts
```
預期：PASS

- [ ] **Step 5：Commit**

```bash
git add src/components/schedule/GameCard.tsx tests/unit/staff-display.test.ts
git commit -m "feat(schedule): GameCard with staff expand and winner highlight (#1)"
```

---

## Task 6：ScheduleHero

**Files:**
- Create: `src/components/schedule/ScheduleHero.tsx`

- [ ] **Step 1：實作**

```tsx
// src/components/schedule/ScheduleHero.tsx
import type { GameWeek } from '../../types/schedule';

interface Props {
  week: GameWeek;
}

export function ScheduleHero({ week }: Props) {
  return (
    <header className="text-center px-4 py-6 md:py-10">
      <div className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2">
        WEEK {week.week} · {week.phase}
      </div>
      <div className="font-condensed text-base md:text-lg text-txt-mid flex items-center justify-center gap-2">
        <span>{formatDate(week.date)}</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <span aria-hidden="true">📍</span>
          <span>{week.venue}</span>
        </span>
      </div>
    </header>
  );
}

function formatDate(date: string): string {
  // "2026/2/7" → "2026/2/7"（直接顯示，未來可改 i18n）
  return date;
}
```

- [ ] **Step 2：型別檢查**

```bash
npx astro check
```

- [ ] **Step 3：Commit**

```bash
git add src/components/schedule/ScheduleHero.tsx
git commit -m "feat(schedule): ScheduleHero header (#1)"
```

---

## Task 7：ScheduleApp 主 island（狀態管理 + 組裝）

**Files:**
- Create: `src/components/schedule/ScheduleApp.tsx`

- [ ] **Step 1：實作**

```tsx
// src/components/schedule/ScheduleApp.tsx
import { useEffect, useState, useCallback } from 'react';
import type { ScheduleData, GameWeek } from '../../types/schedule';
import { fetchData } from '../../lib/api';
import { getCurrentWeek, findPreviousWeekWithData, isSuspended } from '../../lib/schedule-utils';
import { SkeletonState } from './SkeletonState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { ScheduleHero } from './ScheduleHero';
import { ChipTimeline } from './ChipTimeline';
import { GameCard } from './GameCard';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  baseUrl: string;
}

export function ScheduleApp({ baseUrl }: Props) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const result = await fetchData<ScheduleData>('schedule');
      if (cancelled) return;

      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }

      const sched = result.data;
      setData(sched);

      if (sched.allWeeks.length === 0) {
        setStatus('empty');
        setActiveWeek(null);
        return;
      }

      // 找 currentWeek 對應週
      const current = getCurrentWeek(sched);
      if (!current) {
        setStatus('empty');
        setActiveWeek(null);
        return;
      }

      setActiveWeek(current.week);
      setStatus('ok');
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const handlePrevWeek = useCallback(() => {
    if (!data || activeWeek == null) return;
    const prev = findPreviousWeekWithData(data, activeWeek);
    if (prev) {
      setActiveWeek(prev.week);
      setStatus('ok');
    }
  }, [data, activeWeek]);

  if (status === 'loading') return <SkeletonState />;
  if (status === 'error') return <ErrorState onRetry={handleRetry} />;
  if (status === 'empty' || !data || activeWeek == null) {
    const prevExists = data ? findPreviousWeekWithData(data, data.currentWeek) != null : false;
    return <EmptyState onPrevWeek={handlePrevWeek} prevDisabled={!prevExists} />;
  }

  // 找 active week 物件
  const activeWeekObj = data.allWeeks.find(
    (w): w is GameWeek => w.type === 'game' && w.week === activeWeek,
  );

  if (!activeWeekObj) {
    return <EmptyState onPrevWeek={handlePrevWeek} prevDisabled={false} />;
  }

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <ScheduleHero week={activeWeekObj} />
      <ChipTimeline
        weeks={data.allWeeks}
        activeWeek={activeWeek}
        onSelect={(w) => setActiveWeek(w)}
      />
      <section className="px-4 md:px-8 mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {activeWeekObj.games.map((game) => (
          <GameCard key={game.num} game={game} baseUrl={baseUrl} />
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 2：型別檢查**

```bash
npx astro check
```

- [ ] **Step 3：Commit**

```bash
git add src/components/schedule/ScheduleApp.tsx
git commit -m "feat(schedule): ScheduleApp main island with state management (#1)"
```

---

## Task 8：頁面整合 + E2E 驗證

**Files:**
- Modify: `src/pages/schedule.astro`

- [ ] **Step 1：替換 stub 內容**

```astro
---
// src/pages/schedule.astro
import Layout from '../layouts/Layout.astro';
import { ScheduleApp } from '../components/schedule/ScheduleApp';

const baseUrl = import.meta.env.BASE_URL;
---

<Layout title="本週賽程" active="schedule">
  <ScheduleApp client:load baseUrl={baseUrl} />
</Layout>
```

- [ ] **Step 2：本地驗證 dev server**

```bash
npm run dev
# 開瀏覽器 http://localhost:4321/taan-basketball-league/schedule
# 觀察：Hero header / chip timeline / 6 張卡片 / 切週 / 展開 staff
```
預期：手動驗收正常顯示資料

- [ ] **Step 3：build 通過**

```bash
npm run build
```
預期：build 成功

- [ ] **Step 4：跑全部 unit + integration**

```bash
npm test
```
預期：所有 unit + integration test 通過

- [ ] **Step 5：跑 E2E（features + regression）**

```bash
npm run test:e2e -- --project=features --project=regression --project=regression-mobile
```
預期：schedule.spec.ts 所有 case 通過

- [ ] **Step 6：Commit**

```bash
git add src/pages/schedule.astro
git commit -m "feat(schedule): integrate ScheduleApp into /schedule page (#1)"
```

---

## 自我審查檢查清單

- [x] 所有 qaplan U-* 都對應到 Task（U-1/3/4/5/6 → Task 2; U-2 → Task 5）
- [x] 所有 Task Step 都有完整程式碼，無 TODO 佔位
- [x] 整合測試已存在於 `tests/integration/api-fallback.integration.test.ts` 並通過 — 不需新建
- [x] E2E 測試已存在於 `tests/e2e/features/schedule.spec.ts` — Task 8 驗證跑通
- [x] 並行群組標明：B = {3, 4, 5, 6}
- [x] Tasks 自完備，無「參考 Task X」的指代

## Phase 2 執行注意事項

- 使用 `superpowers:dispatching-parallel-agents` 同時 dispatch Task 3、4、5、6（Task 2 完成後）
- 各 task 獨立 commit，不要 squash
- 每個 task 完成 → pm-v2 per-task review → 通過才進下一個
- 全部 task 完成後才跑整合（Phase 3）
