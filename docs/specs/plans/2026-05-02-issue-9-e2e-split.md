# E2E Spec 拆分 + mock-api 按頁面拆分 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 462 行的 `tests/e2e/features/boxscore.spec.ts` 按 AC 分組拆成 9 個小檔放到 `boxscore/` 子目錄；將 `tests/helpers/mock-api.ts` 按頁面拆成 4 個子檔 + `index.ts` re-export；同步更新 `CLAUDE.md` 與 `tests/TESTING.md`；全程 import path 相容、30 個 boxscore E2E 全數保留。

**Architecture:** 純檔案拆分 + re-export，不改任何 Playwright 或 TypeScript 邏輯。`tests/helpers/mock-api/index.ts` re-export 全部函式，既有 `import '../../helpers/mock-api'` 不需修改。`tests/e2e/features/boxscore/` 子目錄內每個 spec 共用 `../../../fixtures/` 的相對路徑。

**Tech Stack:** TypeScript、Playwright、Bash（docstring 驗證腳本）

**個人風格規則**：無命中

**Code Graph**：圖未建立，跳過

---

## Coverage Matrix

| qaplan ID | 描述 | 對應 Task | 覆蓋方式 |
|-----------|------|-----------|---------|
| E-1 | 拆分後原 30 個 boxscore e2e 全數通過 | Task 1~9（各 spec 完整遷移） | 執行 `npx playwright test tests/e2e/features/boxscore/` |
| E-2 | mock-api split 後所有 spec 可執行 | Task 10（mock-api 拆分）+ Task 1~9 | 執行 `npx playwright test --reporter=list` |
| I-1 | folder-audit.sh exit 0 | Task 1（建立子目錄後自動驗） | bash check in Step 4 |
| I-2 | boxscore/ 9 個 spec 頂部有 docstring | Task 1~9（每個 spec Step 1 必含 docstring） | bash check in Task 11 Step 1 |
| I-3 | mock-api/ 4 個子檔頂部有 docstring | Task 10 Step 1 | bash check in Task 11 Step 1 |
| I-4 | CLAUDE.md 含 docstring 歸屬規則 | Task 12 | bash check in Task 11 Step 1 |
| I-5 | TESTING.md 含 E2E 粒度原則節 | Task 13 | bash check in Task 11 Step 1 |

---

## Step 1：範疇確認

本 Issue 是純重構（檔案拆分），不新增業務邏輯：
1. `tests/e2e/features/boxscore.spec.ts`（462 行）→ 9 個子檔
2. `tests/helpers/mock-api.ts` → `tests/helpers/mock-api/{schedule,boxscore,standings,leaders}.ts` + `index.ts`
3. `CLAUDE.md`「強制開發流程」補一行
4. `tests/TESTING.md` 補「E2E 檔案粒度原則」節

**不需要 unit / integration 測試**（無業務邏輯改動）。Coverage I-1~I-5 由 Task 11 的 bash 腳本驗證。

---

## Step 2：檔案結構規劃

### 新建（Create）

```
tests/e2e/features/boxscore/
├── hero.spec.ts                  ← AC-1, 1b
├── tab-switch.spec.ts            ← AC-11, 13, 13b, 14
├── deep-link.spec.ts             ← AC-12, 12b
├── leaders-tab.spec.ts           ← AC-9, 9b, 10, 10b, 10c
├── states.spec.ts                ← AC-17~21b
├── rwd.spec.ts                   ← AC-15, 16
└── boxscore-tab/
    ├── chip-timeline.spec.ts     ← AC-2, 3
    ├── game-cards.spec.ts        ← AC-4, 4b
    └── player-table.spec.ts      ← AC-5, 6, 6b, 7, 8

tests/helpers/mock-api/
├── schedule.ts                   ← mockScheduleAPI + 通用 mockKindAPI
├── boxscore.ts                   ← mockBoxscoreSheetsAPI + mockBoxscoreAndLeaders
├── standings.ts                  ← mockStandingsAPI
├── leaders.ts                    ← mockLeadersAPI
└── index.ts                      ← re-export all（呼叫端 import path 不變）
```

### 修改（Modify）

```
CLAUDE.md                         ← 「強制開發流程」加 docstring 歸屬規則一行
tests/TESTING.md                  ← 補「E2E 檔案粒度原則」一節
```

### 刪除（Delete）

```
tests/e2e/features/boxscore.spec.ts   ← 遷移完成後刪除
tests/helpers/mock-api.ts             ← 拆分後刪除，由 mock-api/index.ts 取代
```

---

## Task 1：建立 boxscore/hero.spec.ts（AC-1, 1b）

**Files:**
- Create: `tests/e2e/features/boxscore/hero.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 hero.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — Hero Header E2E
 *
 * @tag @boxscore
 * Coverage: AC-1（Hero header 顯示 + 副標）、AC-1b（副標隨 active tab 動態變化）
 *
 * 測試資料策略：
 * - mockBoxscoreAndLeaders() 攔截 Sheets API（直打）+ GAS stats endpoint
 * - 不打 production Google Sheets / GAS
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Page — Hero @boxscore', () => {
  // ────── AC-1: Hero header 顯示 + 副標 ──────
  test('AC-1: 訪客打開 /boxscore → Hero header「DATA · 第 25 季」', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore');

    // UI 結構
    const hero = page.locator('[data-testid="data-hero"]');
    await expect(hero).toBeVisible();
    await expect(hero.locator('[data-testid="hero-title"]')).toContainText(/DATA/i);
    await expect(hero.locator('[data-testid="hero-title"]')).toContainText(/第\s*25\s*季|S25/);
  });

  // ────── AC-1 副標動態 ──────
  test('AC-1b: Hero 副標依 active tab 動態變化（leaders → boxscore）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore'); // 預設 leaders

    const subtitle = page.locator('[data-testid="hero-subtitle"]');
    await expect(subtitle).toContainText(/領先榜/);

    // 切到 boxscore tab — toPass retry 容忍 hydration 競態
    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    await expect(async () => {
      await boxscoreTab.click();
      await expect(subtitle).toContainText(/逐場\s*Box/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
  });
});
```

- [ ] **Step 2：確認測試可執行（不做 FAIL 確認，屬遷移性 Task）**

```bash
npx playwright test tests/e2e/features/boxscore/hero.spec.ts --reporter=list
```
預期：PASS（邏輯 100% 與原 spec 相同）

- [ ] **Step 3：確認 docstring 存在**

```bash
head -3 /Users/waterfat/Documents/taan-basketball-league-issue-9/tests/e2e/features/boxscore/hero.spec.ts | grep '^\*\*\*\|^/\*\*'
```
預期：輸出 `/**`

- [ ] **Step 4：確認 folder-audit.sh 通過（Covers: I-1）**

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-9 && bash scripts/folder-audit.sh
```
預期：`✅ folder-audit 通過`

- [ ] **Step 5：Commit**

```bash
git add tests/e2e/features/boxscore/hero.spec.ts
git commit -m "refactor(e2e): split boxscore hero spec (AC-1, 1b)"
```

---

## Task 2：建立 boxscore/tab-switch.spec.ts（AC-11, 13, 13b, 14）

**Files:**
- Create: `tests/e2e/features/boxscore/tab-switch.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 tab-switch.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — Sub-tab 切換 E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-11（切換 tab → URL 變更 + reload 仍停留）
 *   AC-13（?tab=leaders 直接進入）
 *   AC-13b（?tab=boxscore 直接進入）
 *   AC-14（無 query 進入 → 預設 leaders tab）
 *
 * 測試資料策略：mockBoxscoreAndLeaders() 攔截 Sheets API + GAS stats
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Sub-tab Switch @boxscore', () => {
  // ────── AC-14: 預設 leaders tab ──────
  test('AC-14: 無 query 進入 → 預設 leaders tab active', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore');

    const leadersTab = page.locator('[data-testid="sub-tab"][data-tab="leaders"]');
    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    await expect(leadersTab).toHaveAttribute('data-active', 'true');
    await expect(boxscoreTab).toHaveAttribute('data-active', 'false');
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
  });

  // ────── AC-13: ?tab=leaders 直接進入 ──────
  test('AC-13: /boxscore?tab=leaders 直接進入 → leaders tab', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="leaders"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
  });

  // ────── AC-13b: ?tab=boxscore 直接進入 ──────
  test('AC-13b: /boxscore?tab=boxscore 直接進入 → boxscore tab', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="boxscore-panel"]')).toBeVisible();
  });

  // ────── AC-11: 切換 tab 更新 URL + reload 仍停留 ──────
  test('AC-11: 切換 tab → URL 變更 + reload 仍停留', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore'); // leaders 預設

    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    await expect(async () => {
      await boxscoreTab.click();
      await expect(page).toHaveURL(/[?&]tab=boxscore(&|$)/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });

    // reload 仍在 boxscore
    await page.reload();
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');
  });
});
```

- [ ] **Step 2：確認測試可執行**

```bash
npx playwright test tests/e2e/features/boxscore/tab-switch.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 3：Commit**

```bash
git add tests/e2e/features/boxscore/tab-switch.spec.ts
git commit -m "refactor(e2e): split boxscore tab-switch spec (AC-11, 13, 13b, 14)"
```

---

## Task 3：建立 boxscore/deep-link.spec.ts（AC-12, 12b）

**Files:**
- Create: `tests/e2e/features/boxscore/deep-link.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 deep-link.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — Deep Link E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-12（?week=N&game=M → boxscore tab + chip W{N} + scroll + highlight）
 *   AC-12b（從 deep link 切回 leaders → URL 移除 week/game query）
 *
 * Deep Link 規則：
 *   /boxscore?week=N&game=M → boxscore tab + chip W{N} + 第 M 場 highlight + scroll
 *   切回 leaders → URL 清除 tab/week/game
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Deep Link @boxscore', () => {
  // ────── AC-12: deep link from /schedule ──────
  test('AC-12: /boxscore?week=5&game=1 → boxscore tab + chip W5 + 第 1 場 highlight + scroll', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?week=5&game=1');

    // 自動切 boxscore tab
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');

    // chip W5 為 active
    const activeChip = page.locator('[data-testid="bs-week-chip"][data-active="true"]');
    await expect(activeChip).toContainText(/5/);

    // 第 1 場卡片 highlight + 在視窗內
    const card = page.locator('[data-testid="bs-game-card"][data-game="1"]');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-highlighted', 'true');
    await expect(card).toBeInViewport({ timeout: 3000 });
  });

  // ────── [qa-v2 補充] 切回 leaders 後 highlight 移除 ──────
  test('[qa-v2 補充] AC-12b: 從 deep link 進入後切回 leaders → URL 移除 week/game query', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?week=5&game=1');

    // leaders tab 為預設，URL 清乾淨（不帶 tab/week/game）— impl 設計
    const leadersTab = page.locator('[data-testid="sub-tab"][data-tab="leaders"]');
    await expect(async () => {
      await leadersTab.click();
      await expect(page).not.toHaveURL(/week=/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/game=/);
    await expect(page).not.toHaveURL(/tab=/);
  });
});
```

- [ ] **Step 2：確認測試可執行**

```bash
npx playwright test tests/e2e/features/boxscore/deep-link.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 3：Commit**

```bash
git add tests/e2e/features/boxscore/deep-link.spec.ts
git commit -m "refactor(e2e): split boxscore deep-link spec (AC-12, 12b)"
```

---

## Task 4：建立 boxscore/boxscore-tab/chip-timeline.spec.ts（AC-2, 3）

**Files:**
- Create: `tests/e2e/features/boxscore/boxscore-tab/chip-timeline.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 chip-timeline.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — Boxscore Tab：Chip Timeline E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-2（進入 boxscore tab → chip timeline 顯示，預設當前週 active）
 *   AC-3（點另一週 chip → 顯示該週 6 場比賽）
 *
 * 資料說明：ALL_BOX_GAMES 涵蓋 W1/W5/W6，fetchBoxscore 解析後 currentWeek = max = 6
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Tab — Chip Timeline @boxscore', () => {
  // ────── AC-2: chip timeline 切週 + 預設當前週 ──────
  test('AC-2: 進入 boxscore tab → chip timeline 顯示，預設當前週 active', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const activeChip = page.locator('[data-testid="bs-week-chip"][data-active="true"]');
    // fetchBoxscore 解析後 currentWeek = max(weeks)，ALL_BOX_GAMES 涵蓋 W1/W5/W6 → 預設 W6 active
    await expect(activeChip).toContainText(/6/);
  });

  // ────── AC-3: 切換 chip → 該週 6 場 ──────
  test('AC-3: 點另一週 chip → 顯示該週 6 場比賽', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    await page.locator('[data-testid="bs-week-chip"][data-week="1"]').click();
    const cards = page.locator('[data-testid="bs-game-card"]');
    await expect(cards).toHaveCount(6);
  });
});
```

- [ ] **Step 2：確認測試可執行**

```bash
npx playwright test tests/e2e/features/boxscore/boxscore-tab/chip-timeline.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 3：Commit**

```bash
git add tests/e2e/features/boxscore/boxscore-tab/chip-timeline.spec.ts
git commit -m "refactor(e2e): split boxscore chip-timeline spec (AC-2, 3)"
```

---

## Task 5：建立 boxscore/boxscore-tab/game-cards.spec.ts（AC-4, 4b）

**Files:**
- Create: `tests/e2e/features/boxscore/boxscore-tab/game-cards.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 game-cards.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — Boxscore Tab：Game Cards E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-4（每場標題 + 雙隊表格 + 工作人員 collapsible 預設摺疊）
 *   AC-4b（點工作人員箭頭 → 展開/收起）
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Tab — Game Cards @boxscore', () => {
  // ────── AC-4: 每場顯示標題 + 雙隊表格 + 工作人員 collapsible ──────
  test('AC-4: 每場標題 + 雙隊表格 + 工作人員 collapsible（預設摺疊）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstCard = page.locator('[data-testid="bs-game-card"]').first();
    await expect(firstCard.locator('[data-testid="bs-game-title"]')).toBeVisible();

    // 雙隊表格
    await expect(firstCard.locator('[data-testid="bs-team-table"]')).toHaveCount(2);

    // 工作人員預設摺疊
    const staffPanel = firstCard.locator('[data-testid="bs-staff-panel"]');
    await expect(staffPanel).toBeHidden();
    const toggle = firstCard.locator('[data-testid="bs-staff-toggle"]');
    await expect(toggle).toBeVisible();
  });

  // ────── AC-4b: 點 toggle 展開工作人員 ──────
  test('AC-4b: 點工作人員箭頭 → 展開/收起', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const card = page.locator('[data-testid="bs-game-card"]').first();
    const toggle = card.locator('[data-testid="bs-staff-toggle"]');
    const panel = card.locator('[data-testid="bs-staff-panel"]');

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/裁判/);

    await toggle.click();
    await expect(panel).toBeHidden();
  });
});
```

- [ ] **Step 2：確認測試可執行**

```bash
npx playwright test tests/e2e/features/boxscore/boxscore-tab/game-cards.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 3：Commit**

```bash
git add tests/e2e/features/boxscore/boxscore-tab/game-cards.spec.ts
git commit -m "refactor(e2e): split boxscore game-cards spec (AC-4, 4b)"
```

---

## Task 6：建立 boxscore/boxscore-tab/player-table.spec.ts（AC-5, 6, 6b, 7, 8）

**Files:**
- Create: `tests/e2e/features/boxscore/boxscore-tab/player-table.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 player-table.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — Boxscore Tab：Player Table E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-5（球員表格含 11 欄）
 *   AC-6（球員表格末尾顯示合計 row）
 *   AC-6b（DNP 球員不計入合計 row）[qa-v2 補充]
 *   AC-7（DNP 球員顯示灰色 + 「(未出賽)」標籤）
 *   AC-8（球員 row 不可點擊）
 *
 * DNP 合計驗證策略：
 *   AC-6b 使用單場含 DNP 的 fixture，確保合計只算出賽球員
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
  mockBoxscoreGame,
} from '../../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
  mockBoxscoreSheetsAPI,
  mockLeadersAPI,
} from '../../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Tab — Player Table @boxscore', () => {
  // ────── AC-5: 球員表格 11 欄 ──────
  test('AC-5: 球員表格含 11 欄（name/pts/fg2/fg3/ft/treb/ast/stl/blk/tov/pf）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstTable = page.locator('[data-testid="bs-team-table"]').first();
    const headers = firstTable.locator('thead th');
    await expect(headers).toHaveCount(11);
  });

  // ────── AC-6: 表格末尾合計 row ──────
  test('AC-6: 球員表格末尾顯示合計 row', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstTable = page.locator('[data-testid="bs-team-table"]').first();
    const totalsRow = firstTable.locator('[data-testid="bs-totals-row"]');
    await expect(totalsRow).toBeVisible();
    await expect(totalsRow).toContainText(/合計/);
  });

  // ────── [qa-v2 補充] DNP 球員不計入合計 ──────
  test('[qa-v2 補充] AC-6b: DNP 球員不計入合計 row', async ({ page }) => {
    // 使用單場 with DNP，確保合計只算出賽 5 名球員
    const game = mockBoxscoreGame(5, 1, { homeTeam: '紅', awayTeam: '白', homeScore: 34, awayScore: 22, withDnp: true });
    await mockBoxscoreSheetsAPI(page, [game]);
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore&week=5&game=1');

    const card = page.locator('[data-testid="bs-game-card"][data-game="1"]');
    const homeTable = card.locator('[data-testid="bs-team-table"][data-team="紅"]');
    const totalsRow = homeTable.locator('[data-testid="bs-totals-row"]');

    // 合計 pts 應等於 fixture 中 home.totals.pts
    await expect(totalsRow).toContainText(String(game.home.totals.pts));
  });

  // ────── AC-7: DNP 球員視覺處理 ──────
  test('AC-7: DNP 球員顯示灰色 + 「(未出賽)」標籤', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const dnpRow = page.locator('[data-testid="bs-player-row"][data-dnp="true"]').first();
    await expect(dnpRow).toBeVisible();
    await expect(dnpRow).toContainText(/未出賽|DNP/);
  });

  // ────── AC-8: 球員不可點 ──────
  test('AC-8: 球員 row 不可點擊（無連結，cursor 非 pointer）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const playerRow = page.locator('[data-testid="bs-player-row"][data-dnp="false"]').first();
    const cursor = await playerRow.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).not.toBe('pointer');

    // 不應該是 anchor
    const tagName = await playerRow.evaluate((el) => el.tagName);
    expect(tagName.toLowerCase()).not.toBe('a');
  });
});
```

- [ ] **Step 2：確認測試可執行**

```bash
npx playwright test tests/e2e/features/boxscore/boxscore-tab/player-table.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 3：Commit**

```bash
git add tests/e2e/features/boxscore/boxscore-tab/player-table.spec.ts
git commit -m "refactor(e2e): split boxscore player-table spec (AC-5, 6, 6b, 7, 8)"
```

---

## Task 7：建立 boxscore/leaders-tab.spec.ts（AC-9, 9b, 10, 10b, 10c）

**Files:**
- Create: `tests/e2e/features/boxscore/leaders-tab.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 leaders-tab.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — Leaders Tab E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-9（leaders tab 顯示 6 類別獨立卡片）
 *   AC-9b（每個類別卡片含 top 10）
 *   AC-10（每位球員顯示 rank、名字、隊色點、數值）
 *   AC-10b（scoring 卡片顯示進階指標 2P%/3P%/FT%）
 *   AC-10c（rebound 卡片顯示進階指標 進攻/防守籃板）
 *
 * 類別清單：scoring / rebound / assist / steal / block / eff
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Leaders Tab @boxscore', () => {
  // ────── AC-9: 6 類別獨立卡片 ──────
  test('AC-9: leaders tab 顯示 6 類別獨立卡片', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const cards = page.locator('[data-testid="leaders-card"]');
    await expect(cards).toHaveCount(6);

    for (const cat of ['scoring', 'rebound', 'assist', 'steal', 'block', 'eff']) {
      await expect(page.locator(`[data-testid="leaders-card"][data-category="${cat}"]`)).toBeVisible();
    }
  });

  // ────── AC-9b: 每類 top 10 ──────
  test('AC-9b: 每個類別卡片含 top 10', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const scoringCard = page.locator('[data-testid="leaders-card"][data-category="scoring"]');
    const rows = scoringCard.locator('[data-testid="leader-row"]');
    await expect(rows).toHaveCount(10);
  });

  // ────── AC-10: 球員顯示 rank/名字/隊色點/數值 ──────
  test('AC-10: 每位球員顯示 rank、名字、隊色點、數值', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstRow = page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"][data-rank="1"]');
    await expect(firstRow).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-name"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-team-dot"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-val"]')).toContainText(/\d/);
  });

  // ────── AC-10b: scoring 進階指標 2P%/3P%/FT% ──────
  test('AC-10b: scoring 卡片顯示進階指標 2P%/3P%/FT%', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstScoring = page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"]').first();
    const advanced = firstScoring.locator('[data-testid="leader-advanced"]');
    await expect(advanced).toContainText(/%/);
  });

  // ────── AC-10c: rebound 進階指標 進攻/防守籃板 ──────
  test('AC-10c: rebound 卡片顯示進階指標（進攻/防守籃板）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstRebound = page.locator('[data-testid="leaders-card"][data-category="rebound"] [data-testid="leader-row"]').first();
    const advanced = firstRebound.locator('[data-testid="leader-advanced"]');
    await expect(advanced).toContainText(/\d/);
  });
});
```

- [ ] **Step 2：確認測試可執行**

```bash
npx playwright test tests/e2e/features/boxscore/leaders-tab.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 3：Commit**

```bash
git add tests/e2e/features/boxscore/leaders-tab.spec.ts
git commit -m "refactor(e2e): split boxscore leaders-tab spec (AC-9, 9b, 10, 10b, 10c)"
```

---

## Task 8：建立 boxscore/states.spec.ts（AC-17~21b）

**Files:**
- Create: `tests/e2e/features/boxscore/states.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 states.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — Three-State（Loading / Error / Empty）E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-17（資料載入中 → skeleton → 載入後 skeleton 消失）
 *   AC-18（Sheets API 失敗 → 限縮錯誤 + 重試按鈕）
 *   AC-18b（boxscore 失敗切到 leaders → leaders 仍正常）
 *   AC-19（leaders endpoint 失敗 → 限縮錯誤 + 重試按鈕）
 *   AC-19b（重試按鈕 → 重新 fetch leaders）
 *   AC-20（該週 boxscore 為空 → empty state）
 *   AC-21（leaders 全空 → empty state）
 *   AC-21b（leaders 部分類別空 → 個別空卡，其他正常）[qa-v2 補充]
 *
 * 錯誤限縮原則：boxscore 失敗不影響 leaders panel，反之亦然
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
  mockEmptyLeaders,
  mockPartialLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
  mockBoxscoreSheetsAPI,
  mockLeadersAPI,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Three-State (Loading / Error / Empty) @boxscore', () => {
  // ────── AC-17: skeleton 載入中 ──────
  test('AC-17: 資料載入中 → 看到 skeleton', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES, { delayMs: 1500 });
    await mockLeadersAPI(page, mockFullLeaders(), { delayMs: 1500 });
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-skeleton"]')).toBeVisible();
    // 載入後 skeleton 消失
    await expect(page.locator('[data-testid="bs-game-card"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="bs-skeleton"]')).toHaveCount(0);
  });

  // ────── AC-18: boxscore Sheets API 失敗 → 限縮錯誤 ──────
  test('AC-18: Sheets API 失敗（boxscore） → 「無法載入逐場數據」+ 重試（限縮 boxscore 區塊）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    const error = page.locator('[data-testid="bs-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/無法載入逐場數據|無法載入Box/);
    await expect(error.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ────── AC-18b: 切到 leaders tab 仍正常 ──────
  test('AC-18b: boxscore 失敗時切到 leaders tab → leaders 仍正常顯示（錯誤限縮）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-error"]')).toBeVisible();
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-error"]')).toHaveCount(0);
  });

  // ────── AC-19: leaders endpoint 失敗 → 限縮錯誤 ──────
  test('AC-19: leaders stats endpoint 失敗 → 「無法載入領先榜」+ 重試（限縮 leaders 區塊）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, null, { allFail: true });
    await page.goto('boxscore?tab=leaders');

    const error = page.locator('[data-testid="leaders-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/無法載入領先榜|無法載入排行/);
    await expect(error.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ────── AC-19b: 重試按鈕觸發再次 fetch ──────
  test('AC-19b: 點重試按鈕 → 重新 fetch leaders', async ({ page }) => {
    let callCount = 0;
    await page.route(/script\.google\.com\/macros\/s\/.+\/exec\?type=stats/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });
    await page.route(/\/data\/(leaders|stats)\.json$/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await page.goto('boxscore?tab=leaders');

    const retry = page.locator('[data-testid="leaders-error"]').getByRole('button', { name: /重試/ });
    await expect(retry).toBeVisible();

    const initial = callCount;
    await retry.click();
    await expect.poll(() => callCount).toBeGreaterThan(initial);
  });

  // ────── AC-20: 該週 boxscore 為空 ──────
  test('AC-20: 該週 boxscore 為空 → 「該週尚無 Box Score」', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, []); // 完全沒有 games
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="bs-empty"]')).toContainText(/尚無\s*Box\s*Score/i);
  });

  // ────── AC-21: leaders 全空 ──────
  test('AC-21: leaders 全空（賽季初）→ 「賽季初尚無球員數據」', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, mockEmptyLeaders());
    await page.goto('boxscore?tab=leaders');

    await expect(page.locator('[data-testid="leaders-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-empty"]')).toContainText(/賽季初|尚無球員數據/);
  });

  // ────── [qa-v2 補充] 部分類別空 ──────
  test('[qa-v2 補充] AC-21b: leaders 部分類別空 → 個別卡片顯示 empty，其他正常', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, mockPartialLeaders());
    await page.goto('boxscore?tab=leaders');

    // scoring 有資料
    await expect(page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"]')).toHaveCount(10);
    // rebound 空（fixture 設定）
    const reboundCard = page.locator('[data-testid="leaders-card"][data-category="rebound"]');
    await expect(reboundCard).toBeVisible();
    await expect(reboundCard.locator('[data-testid="leader-row"]')).toHaveCount(0);
  });
});
```

- [ ] **Step 2：確認測試可執行**

```bash
npx playwright test tests/e2e/features/boxscore/states.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 3：Commit**

```bash
git add tests/e2e/features/boxscore/states.spec.ts
git commit -m "refactor(e2e): split boxscore states spec (AC-17~21b)"
```

---

## Task 9：建立 boxscore/rwd.spec.ts（AC-15, 16）

**Files:**
- Create: `tests/e2e/features/boxscore/rwd.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：建立 rwd.spec.ts，含 docstring**

```typescript
/**
 * /boxscore 頁面 — RWD 回歸 E2E
 *
 * @tag @boxscore
 * Coverage:
 *   AC-15（桌機 ≥768 → boxscore 11 欄完整 + leaders 兩欄並排）
 *   AC-16（手機 <768 → boxscore 表格橫向捲動 + leaders 垂直堆疊）
 *
 * 執行策略：
 *   AC-15 在 desktop project 跑（viewport.width ≥ 768）
 *   AC-16 在 mobile project 跑（viewport.width < 768）
 *   各自用 test.skip() 過濾
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
} from '../../../fixtures/boxscore';
import {
  mockFullLeaders,
} from '../../../fixtures/leaders';
import {
  mockBoxscoreAndLeaders,
} from '../../../helpers/mock-api';

// Covers: E-1
const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Page RWD @boxscore', () => {
  // ────── AC-15 desktop ──────
  test('AC-15 (regression desktop): 桌機 ≥768 → boxscore 11 欄完整 + leaders 兩欄並排', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width < 768, 'desktop project only');
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const headers = page.locator('[data-testid="bs-team-table"]').first().locator('thead th');
    await expect(headers).toHaveCount(11);

    // leaders tab 兩欄並排：scoring 和第二張卡 Y 接近
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    const cards = page.locator('[data-testid="leaders-card"]');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    expect(Math.abs((box1?.y ?? 0) - (box2?.y ?? 0))).toBeLessThan(20);
    expect((box2?.x ?? 0)).toBeGreaterThan(box1?.x ?? 0);
  });

  // ────── AC-16 mobile ──────
  test('AC-16 (regression-mobile): 手機 <768 → boxscore 表格橫向捲動 + leaders 垂直堆疊', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= 768, 'mobile project only');
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    // 表格容器應 overflow-x scrollable
    const tableContainer = page.locator('[data-testid="bs-team-table"]').first().locator('..');
    const overflowX = await tableContainer.evaluate((el) => getComputedStyle(el).overflowX);
    expect(['auto', 'scroll']).toContain(overflowX);

    // leaders 垂直堆疊：兩張卡 X 接近
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    const cards = page.locator('[data-testid="leaders-card"]');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    expect(Math.abs((box1?.x ?? 0) - (box2?.x ?? 0))).toBeLessThan(20);
    expect((box2?.y ?? 0)).toBeGreaterThan(box1?.y ?? 0);
  });
});
```

- [ ] **Step 2：確認測試可執行**

```bash
npx playwright test tests/e2e/features/boxscore/rwd.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 3：Commit**

```bash
git add tests/e2e/features/boxscore/rwd.spec.ts
git commit -m "refactor(e2e): split boxscore rwd spec (AC-15, 16)"
```

---

## Task 10：拆分 tests/helpers/mock-api.ts → mock-api/ 目錄

**Files:**
- Create: `tests/helpers/mock-api/schedule.ts`
- Create: `tests/helpers/mock-api/boxscore.ts`
- Create: `tests/helpers/mock-api/standings.ts`
- Create: `tests/helpers/mock-api/leaders.ts`
- Create: `tests/helpers/mock-api/index.ts`
- Delete: `tests/helpers/mock-api.ts`（在 Step 4 刪除）

## Style Rules

無命中

- [ ] **Step 1：建立 mock-api/schedule.ts（Covers: I-3）**

```typescript
/**
 * Playwright Mock — Schedule & 通用 GAS/JSON 攔截
 *
 * 涵蓋範圍：
 *   - mockScheduleAPI：攔截 GAS endpoint + /data/schedule.json
 *   - mockKindAPI：通用兩層攔截（GAS 優先，失敗 fallback JSON）
 *
 * 使用方式：
 *   await mockScheduleAPI(page, mockFullSchedule());
 *   await mockScheduleAPI(page, null, { gasFails: true });
 *   await mockScheduleAPI(page, null, { allFail: true });
 *   await mockScheduleAPI(page, schedule, { delayMs: 2000 });
 */

import type { Page, Route } from '@playwright/test';
import type { ScheduleData } from '../../fixtures/schedule';

export interface MockOptions<T> {
  /** GAS 是否失敗（true 時會 fallback 到 JSON） */
  gasFails?: boolean;
  /** GAS + JSON 都失敗 */
  allFail?: boolean;
  /** 延遲毫秒數（模擬慢速網路） */
  delayMs?: number;
  /** 自訂 JSON fallback 內容（不指定就用 data 同一份） */
  fallbackJson?: T;
}

const GAS_PATTERN = /script\.google\.com\/macros\/s\/.+\/exec/;

export async function mockKindAPI<T>(
  page: Page,
  jsonPattern: RegExp,
  data: T | null,
  opts: MockOptions<T> = {},
): Promise<void> {
  const { gasFails = false, allFail = false, delayMs = 0, fallbackJson } = opts;

  await page.route(GAS_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail || gasFails) {
      await route.fulfill({ status: 500, body: 'GAS error' });
      return;
    }
    if (data) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
      return;
    }
    await route.fulfill({ status: 500, body: 'No data' });
  });

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

- [ ] **Step 2：建立 mock-api/standings.ts（Covers: I-3）**

```typescript
/**
 * Playwright Mock — Standings（戰績榜）攔截
 *
 * 涵蓋範圍：
 *   - mockStandingsAPI：攔截 GAS endpoint + /data/standings.json
 *
 * 使用方式：
 *   await mockStandingsAPI(page, mockFullStandings());
 *   await mockStandingsAPI(page, null, { gasFails: true });
 *   await mockStandingsAPI(page, null, { allFail: true });
 */

import type { Page } from '@playwright/test';
import type { StandingsData } from '../../fixtures/standings';
import { mockKindAPI, type MockOptions } from './schedule';

export async function mockStandingsAPI(
  page: Page,
  standings: StandingsData | null,
  opts: MockOptions<StandingsData> = {},
): Promise<void> {
  return mockKindAPI<StandingsData>(page, /\/data\/standings\.json$/, standings, opts);
}
```

- [ ] **Step 3：建立 mock-api/leaders.ts（Covers: I-3）**

```typescript
/**
 * Playwright Mock — Leaders（龍虎榜）攔截
 *
 * 涵蓋範圍：
 *   - mockLeadersAPI：攔截 GAS ?type=stats endpoint + /data/(leaders|stats).json
 *
 * 使用方式：
 *   await mockLeadersAPI(page, mockFullLeaders());
 *   await mockLeadersAPI(page, null, { allFail: true });
 *   await mockLeadersAPI(page, leaders, { delayMs: 1500 });
 */

import type { Page, Route } from '@playwright/test';
import type { LeaderData } from '../../fixtures/leaders';

const LEADERS_JSON_PATTERN = /\/data\/(leaders|stats)\.json$/;

export interface LeadersMockOptions {
  /** GAS stats endpoint 是否失敗（true → fallback 到 JSON） */
  gasFails?: boolean;
  /** GAS + JSON fallback 都失敗 */
  allFail?: boolean;
  /** 延遲毫秒數 */
  delayMs?: number;
}

export async function mockLeadersAPI(
  page: Page,
  leaders: LeaderData | null,
  opts: LeadersMockOptions = {},
): Promise<void> {
  const { gasFails = false, allFail = false, delayMs = 0 } = opts;

  // GAS 攔截（type=stats）
  await page.route(/script\.google\.com\/macros\/s\/.+\/exec\?type=stats/, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail || gasFails) {
      await route.fulfill({ status: 500, body: 'GAS stats error' });
      return;
    }
    if (leaders) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(leaders),
      });
      return;
    }
    await route.fulfill({ status: 500, body: 'No leaders data' });
  });

  // JSON fallback 攔截
  await page.route(LEADERS_JSON_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (allFail) {
      await route.fulfill({ status: 500, body: 'JSON fallback failed' });
      return;
    }
    if (leaders) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(leaders),
      });
      return;
    }
    await route.continue();
  });
}
```

- [ ] **Step 4：建立 mock-api/boxscore.ts（Covers: I-3）**

```typescript
/**
 * Playwright Mock — Boxscore（逐場數據）攔截
 *
 * 涵蓋範圍：
 *   - mockBoxscoreSheetsAPI：攔截 Google Sheets API 直打請求（boxscore tab）
 *   - mockBoxscoreAndLeaders：同時 mock boxscore + leaders（頁面常用組合）
 *
 * 使用方式：
 *   await mockBoxscoreSheetsAPI(page, [game1, game2]);
 *   await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
 *   await mockBoxscoreSheetsAPI(page, games, { delayMs: 1500 });
 *   await mockBoxscoreAndLeaders(page, { boxscore: games, leaders: mockFullLeaders() });
 */

import type { Page, Route } from '@playwright/test';
import type { BoxscoreGame, BoxscoreData } from '../../fixtures/boxscore';
import { mockRawBoxscoreSheetsResponse } from '../../fixtures/boxscore';
import type { LeaderData } from '../../fixtures/leaders';
import { mockLeadersAPI, type LeadersMockOptions } from './leaders';

const SHEETS_PATTERN = /sheets\.googleapis\.com\/v4\/spreadsheets\/.+\/values\/.+/;

export interface BoxscoreMockOptions {
  /** Sheets API 是否失敗 */
  sheetsFails?: boolean;
  /** 延遲毫秒數 */
  delayMs?: number;
}

export async function mockBoxscoreSheetsAPI(
  page: Page,
  games: BoxscoreGame[],
  opts: BoxscoreMockOptions = {},
): Promise<void> {
  const { sheetsFails = false, delayMs = 0 } = opts;

  await page.route(SHEETS_PATTERN, async (route: Route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (sheetsFails) {
      await route.fulfill({ status: 500, body: 'Sheets API error' });
      return;
    }
    const body = mockRawBoxscoreSheetsResponse(games);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/** 同時 mock boxscore + leaders（單頁 e2e 常用組合） */
export async function mockBoxscoreAndLeaders(
  page: Page,
  opts: {
    boxscore?: BoxscoreGame[];
    leaders?: LeaderData | null;
    boxOpts?: BoxscoreMockOptions;
    leadersOpts?: LeadersMockOptions;
  } = {},
): Promise<void> {
  await mockBoxscoreSheetsAPI(page, opts.boxscore ?? [], opts.boxOpts);
  await mockLeadersAPI(page, opts.leaders ?? null, opts.leadersOpts);
}

// re-export type for fixture consumers
export type { BoxscoreData, LeaderData };
```

- [ ] **Step 5：建立 mock-api/index.ts（re-export all，Covers: E-2）**

```typescript
/**
 * tests/helpers/mock-api — Re-export 統一入口
 *
 * 涵蓋範圍：
 *   集合 schedule / standings / boxscore / leaders 四個 mock 模組，
 *   供所有 E2E spec 以不變的 import path 使用：
 *   `import { ... } from '../../helpers/mock-api'`
 *
 * 子模組說明：
 *   schedule.ts  — mockScheduleAPI + mockKindAPI（通用兩層攔截）
 *   standings.ts — mockStandingsAPI
 *   boxscore.ts  — mockBoxscoreSheetsAPI + mockBoxscoreAndLeaders
 *   leaders.ts   — mockLeadersAPI
 */

export { mockScheduleAPI, mockKindAPI } from './schedule';
export type { MockOptions } from './schedule';

export { mockStandingsAPI } from './standings';

export { mockBoxscoreSheetsAPI, mockBoxscoreAndLeaders } from './boxscore';
export type { BoxscoreMockOptions } from './boxscore';

export { mockLeadersAPI } from './leaders';
export type { LeadersMockOptions } from './leaders';

// re-export types for fixture consumers
export type { BoxscoreData, LeaderData } from './boxscore';
```

- [ ] **Step 6：刪除舊的 mock-api.ts**

```bash
git rm tests/helpers/mock-api.ts
```

- [ ] **Step 7：確認所有既有 spec 仍可執行（Covers: E-2）**

```bash
npx playwright test tests/e2e/features/schedule.spec.ts tests/e2e/features/standings.spec.ts --reporter=list
```
預期：PASS（import path `../../helpers/mock-api` 透過 index.ts re-export 維持不變）

- [ ] **Step 8：Commit**

```bash
git add tests/helpers/mock-api/
git commit -m "refactor(helpers): split mock-api.ts into mock-api/ submodules"
```

---

## Task 11：產生 I-1~I-5 Bash 驗證腳本並執行

**Files:**
- 無永久新增（驗證腳本直接內嵌在本 Task，執行完畢即可）

## Style Rules

無命中

- [ ] **Step 1：執行 bash 驗證腳本（Covers: I-1, I-2, I-3, I-4, I-5）**

```bash
#!/usr/bin/env bash
set -e
ROOT="/Users/waterfat/Documents/taan-basketball-league-issue-9"
FAIL=0

echo "=== I-1: folder-audit.sh exit 0 ==="
bash "$ROOT/scripts/folder-audit.sh" && echo "PASS I-1" || { echo "FAIL I-1"; FAIL=$((FAIL+1)); }

echo ""
echo "=== I-2: boxscore/ 9 個 spec 頂部有 docstring ==="
SPECS=(
  "tests/e2e/features/boxscore/hero.spec.ts"
  "tests/e2e/features/boxscore/tab-switch.spec.ts"
  "tests/e2e/features/boxscore/deep-link.spec.ts"
  "tests/e2e/features/boxscore/leaders-tab.spec.ts"
  "tests/e2e/features/boxscore/states.spec.ts"
  "tests/e2e/features/boxscore/rwd.spec.ts"
  "tests/e2e/features/boxscore/boxscore-tab/chip-timeline.spec.ts"
  "tests/e2e/features/boxscore/boxscore-tab/game-cards.spec.ts"
  "tests/e2e/features/boxscore/boxscore-tab/player-table.spec.ts"
)
for spec in "${SPECS[@]}"; do
  FILE="$ROOT/$spec"
  if [ ! -f "$FILE" ]; then
    echo "FAIL I-2: 檔案不存在 $spec"; FAIL=$((FAIL+1)); continue
  fi
  if head -1 "$FILE" | grep -q '^/\*\*'; then
    echo "PASS I-2: $spec"
  else
    echo "FAIL I-2: 缺 docstring — $spec"; FAIL=$((FAIL+1))
  fi
done

echo ""
echo "=== I-3: mock-api/ 4 個子檔頂部有 docstring ==="
MOCKS=(
  "tests/helpers/mock-api/schedule.ts"
  "tests/helpers/mock-api/standings.ts"
  "tests/helpers/mock-api/leaders.ts"
  "tests/helpers/mock-api/boxscore.ts"
)
for mock in "${MOCKS[@]}"; do
  FILE="$ROOT/$mock"
  if [ ! -f "$FILE" ]; then
    echo "FAIL I-3: 檔案不存在 $mock"; FAIL=$((FAIL+1)); continue
  fi
  if head -1 "$FILE" | grep -q '^/\*\*'; then
    echo "PASS I-3: $mock"
  else
    echo "FAIL I-3: 缺 docstring — $mock"; FAIL=$((FAIL+1))
  fi
done

echo ""
echo "=== I-4: CLAUDE.md 含 docstring 歸屬規則 ==="
if grep -q 'docstring' "$ROOT/CLAUDE.md"; then
  echo "PASS I-4"
else
  echo "FAIL I-4: CLAUDE.md 未含 docstring 關鍵字"; FAIL=$((FAIL+1))
fi

echo ""
echo "=== I-5: TESTING.md 含 E2E 粒度原則節 ==="
if grep -q 'E2E 檔案粒度原則\|E2E 粒度\|E2E.*粒度' "$ROOT/tests/TESTING.md"; then
  echo "PASS I-5"
else
  echo "FAIL I-5: TESTING.md 未含粒度原則節"; FAIL=$((FAIL+1))
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "✅ 所有 I-* 驗證通過（I-1~I-5）"
else
  echo "❌ $FAIL 個驗證失敗"
  exit 1
fi
```

預期：所有 PASS

---

## Task 12：更新 CLAUDE.md「強制開發流程」（Covers: I-4）

**Files:**
- Modify: `CLAUDE.md`

## Style Rules

無命中

- [ ] **Step 1：在「強制開發流程」區塊新增 docstring 歸屬規則**

在 `CLAUDE.md` 的「強制開發流程」區塊，`改動 gas/Code.gs` 那行之前或之後新增一行：

```markdown
- E2E `.spec.ts` 每個子檔最上方必須加 `/** docstring */` 標明涵蓋範圍（Coverage tag）；`tests/helpers/mock-api/` 的子模組同樣須加 docstring 標明負責的攔截頁面
```

完整插入後「強制開發流程」區塊末尾應如下（精確字串以 Edit 工具插入，不整段覆寫）：

```markdown
## 強制開發流程

- 每次 commit 前必須執行 `npm test`，測試未通過不得 commit
- 新增/修改頁面元件 → 必須同步新增/更新對應 Vitest 單元測試
- 新增/修改頁面 → 必須同步更新對應 Playwright E2E 測試
- `/review` 重構完 → 補齊測試覆蓋
- **部署後必須跑 `./scripts/e2e-test.sh https://waterfat.github.io/taan-basketball-league/` 驗收**
- 改動 `gas/Code.gs` → 需手動重新部署 Apps Script webapp（Code.gs 不在 Astro build 範圍）
- E2E `.spec.ts` 每個子檔最上方必須加 `/** docstring */` 標明涵蓋範圍（Coverage tag）；`tests/helpers/mock-api/` 的子模組同樣須加 docstring 標明負責的攔截頁面
```

- [ ] **Step 2：驗證（Covers: I-4）**

```bash
grep 'docstring' /Users/waterfat/Documents/taan-basketball-league-issue-9/CLAUDE.md
```
預期：輸出含 `docstring` 的一行

- [ ] **Step 3：Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): add docstring ownership rule to dev flow"
```

---

## Task 13：更新 tests/TESTING.md 補「E2E 檔案粒度原則」節（Covers: I-5）

**Files:**
- Modify: `tests/TESTING.md`

## Style Rules

無命中

- [ ] **Step 1：在「E2E 三層覆蓋」節後方插入新節**

插入的新節完整內容：

```markdown
## E2E 檔案粒度原則

- **單一 spec 最大行數：200 行**（超過時按功能群組拆成子檔，放同一子目錄）
- **子目錄規則**：共用同一頁面的多個 spec 放 `features/<page>/` 子目錄（如 `features/boxscore/`）；深一層互動群組再往下一層（如 `features/boxscore/boxscore-tab/`）
- **docstring 必填**：每個 `.spec.ts` 與 `tests/helpers/mock-api/` 子模組最上方必須有 `/** docstring */`，標明 Coverage（AC 編號）與測試資料策略
- **import path**：子目錄 spec 使用相對路徑 `../../../fixtures/`；helper 模組統一從 `tests/helpers/mock-api` import（index.ts re-export 不需改 import path）
- **並行安全**：同一目錄的 spec 不得共用 `let` 狀態（用 fixture 隔離），確保 `--workers` 並行下無競態
```

- [ ] **Step 2：驗證（Covers: I-5）**

```bash
grep 'E2E 檔案粒度原則' /Users/waterfat/Documents/taan-basketball-league-issue-9/tests/TESTING.md
```
預期：輸出含「E2E 檔案粒度原則」的一行

- [ ] **Step 3：Commit**

```bash
git add tests/TESTING.md
git commit -m "docs(testing): add E2E file granularity guidelines"
```

---

## Task 14：刪除舊 boxscore.spec.ts + 全量 E2E 驗收

**Files:**
- Delete: `tests/e2e/features/boxscore.spec.ts`

## Style Rules

無命中

- [ ] **Step 1：確認 9 個子檔齊全**

```bash
ls /Users/waterfat/Documents/taan-basketball-league-issue-9/tests/e2e/features/boxscore/
ls /Users/waterfat/Documents/taan-basketball-league-issue-9/tests/e2e/features/boxscore/boxscore-tab/
```
預期：共 9 個 `.spec.ts`（根目錄 6 + `boxscore-tab/` 3）

- [ ] **Step 2：刪除舊 spec**

```bash
git rm tests/e2e/features/boxscore.spec.ts
git commit -m "refactor(e2e): remove original monolithic boxscore.spec.ts"
```

- [ ] **Step 3：全量執行 boxscore E2E（Covers: E-1）**

```bash
npx playwright test tests/e2e/features/boxscore/ --reporter=list
```
預期：30 個 test PASS（對應原 spec 的 30 個 test case 全數保留）

- [ ] **Step 4：確認其他 spec 不受影響（Covers: E-2）**

```bash
npx playwright test tests/e2e/features/schedule.spec.ts tests/e2e/features/standings.spec.ts --reporter=list
```
預期：PASS

- [ ] **Step 5：執行 Task 11 驗證腳本（I-1~I-5 全過）**

```bash
bash /tmp/verify-i1-i5.sh
```
預期：`✅ 所有 I-* 驗證通過（I-1~I-5）`

---

## E2E 業務流程清單（聚焦業務規則）

以下案例聚焦**業務行為**，不含 Playwright 操作細節：

| # | 業務行為 | 預期結果 |
|---|----------|---------|
| 1 | 訪客打開 `/boxscore` | Hero header 顯示聯盟名稱 + 第 N 季 |
| 2 | `/boxscore` 無 query 進入 | 預設顯示 leaders tab |
| 3 | 切換至 boxscore tab | URL 更新 `?tab=boxscore`；reload 後仍停留 boxscore tab |
| 4 | 帶 `?tab=leaders` 直接訪問 | 顯示 leaders tab |
| 5 | 帶 `?tab=boxscore` 直接訪問 | 顯示 boxscore tab |
| 6 | 帶 `?week=5&game=1` 訪問 | 自動切 boxscore tab，W5 chip active，第 1 場卡片 highlight 且在視窗內 |
| 7 | 從 deep link 切回 leaders | URL 清除 tab/week/game 參數 |
| 8 | 進入 boxscore tab | chip timeline 顯示所有週，預設當前最大週 active |
| 9 | 點另一週 chip | 顯示該週 6 場比賽 |
| 10 | 每場 game card | 顯示標題 + 雙隊球員表格 + 工作人員 collapsible（預設摺疊） |
| 11 | 點工作人員 toggle | 展開/收起工作人員列表 |
| 12 | 球員表格 | 含 11 欄（name/pts/fg2/fg3/ft/treb/ast/stl/blk/tov/pf）+ 合計 row |
| 13 | DNP 球員 | 顯示灰色 + 「未出賽」標籤；不計入合計 row pts |
| 14 | 球員 row | 不可點擊（cursor 非 pointer，非 anchor） |
| 15 | leaders tab | 顯示 6 類別卡片（scoring/rebound/assist/steal/block/eff），各含 top 10 |
| 16 | 每位球員 row | 顯示 rank、名字、隊色點、數值 |
| 17 | scoring 卡片 | 顯示進階指標 2P%/3P%/FT% |
| 18 | rebound 卡片 | 顯示進階指標（進攻/防守籃板）|
| 19 | 資料載入中 | skeleton 可見；載入完成後 skeleton 消失，game card 出現 |
| 20 | Sheets API 失敗 | boxscore 區塊顯示限縮錯誤 + 重試按鈕；leaders tab 不受影響 |
| 21 | leaders endpoint 失敗 | leaders 區塊顯示限縮錯誤 + 重試按鈕；boxscore tab 不受影響 |
| 22 | 點重試按鈕 | 重新觸發 fetch（callCount 增加） |
| 23 | 該週 boxscore 為空 | 顯示「尚無 Box Score」empty state |
| 24 | leaders 全空 | 顯示「賽季初尚無球員數據」empty state |
| 25 | leaders 部分類別空 | 空類別卡片顯示 empty；其他類別正常顯示 |
| 26 | 桌機 ≥768 | boxscore 11 欄完整；leaders 兩欄並排 |
| 27 | 手機 <768 | boxscore 表格橫向捲動；leaders 垂直堆疊 |

---

## OPS 部署驗收 Test Case（供 Phase 5 ops-v2 使用）

> 本 Issue 為純測試重構，不涉及任何 prod 程式碼變更，無需新增部署驗收項目。
> 
> 現有驗收指令維持：
> ```bash
> ./scripts/e2e-test.sh https://waterfat.github.io/taan-basketball-league/
> ```
> 
> 若有 CI 跑 E2E，確認 GitHub Actions 中 boxscore spec 的 glob pattern 仍能命中新的子目錄結構：
> - 舊：`tests/e2e/features/boxscore.spec.ts`
> - 新：`tests/e2e/features/boxscore/**/*.spec.ts`（若 CI 有明確指定路徑需更新）
