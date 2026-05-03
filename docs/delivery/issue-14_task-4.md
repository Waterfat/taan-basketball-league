# Issue #14 Task 4 — 賽程頁 toggle（B7 + B9.*）

**Goal**：在 `/schedule` 頁面加入「對戰組合 / 賽程順序」toggle，邏輯與 home 一致（共用 matchups-toggle-utils）。

**Files**：
- `src/components/schedule/ScheduleApp.tsx`
- `src/components/schedule/GameCard.tsx`

**Plan reference**：`docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 4

## Acceptance
- E2E：`tests/e2e/features/schedule/schedule-toggle.spec.ts` 全綠（E-701 + E-702）
- 既有 schedule spec 不退化（features/schedule.spec.ts + regression/schedule.regression.spec.ts）

## Style Rules
- **style-skeleton-loading**：ScheduleApp 既有 SkeletonState 沿用
- 不適用 **style-rwd-list**（GameCard 已是卡片型）

## Result

**Status**：Done

**驗收結果**：
- `npx tsc --noEmit -p tsconfig.json` → exit 0
- `npx playwright test tests/e2e/features/schedule/schedule-toggle.spec.ts` → **10 passed / 0 failed**（features + features-mobile 兩個 project，覆蓋 E-701 / E-701b / E-702a / E-702b / E-702c）
- `npx playwright test tests/e2e/features/schedule.spec.ts tests/e2e/regression/schedule.regression.spec.ts` → **38 passed / 2 skipped / 0 failed**（既有 schedule 主功能 + UAT regression smoke 全綠，skipped 為 viewport project scoping）

**實作摘要**：
- `src/components/schedule/ScheduleApp.tsx`：
  - 新增 `view` state（`MatchupView | null`）
  - 用 `useMemo` 算 `activeWeekObj` 與 `isOrderPublished`（依 `games[].home/away` 是否有值）
  - `useEffect` 在 `activeWeekObj` 載入後解析初始 view：URL `?view=` 優先，否則依 `isOrderPublished` 智慧預設
  - `handleSetView` 同步 `setView` + `updateViewQuery`（共用 matchups-toggle-utils）
  - 在 active week section 上方插入：
    - `schedule-matchups-toggle`（`role="radiogroup"`）含兩個 button：`schedule-matchups-toggle-combo` / `-order`（`role="radio"` + `aria-pressed` + `aria-checked`）
    - `schedule-matchups-unpublished-hint`：當 `!isOrderPublished` 時顯示，文字「本週場次順序尚未公告，請看「對戰組合」」
  - 依 view 條件渲染 `schedule-matchups-combo-list` 或 `schedule-matchups-order-list`（**只渲染當前 view，避免既有 AC-1 對 `[data-testid="game-card"]` count 6 的斷言被破壞**）
  - combo view 使用 inline helper `normalizeMatchupStatus` + 將 `matchups[]` 轉成 `Game` shape（`num=combo, time='', staff={}`）餵給 GameCard
- `src/components/schedule/GameCard.tsx`：
  - 新增 `MatchupSource` export 型別 + 可選 `matchupSource?: MatchupSource` prop（預設 `'order'`，對既有呼叫端向下相容）
  - 卡片頂端新增 `matchup-label`：combo → 「對戰 N」；order → 「場次 N · HH:MM」
  - combo view 自動隱藏 staff toggle（`isCombo` 時 `showStaffToggle = false`）
  - 新增 `data-matchup-source` 屬性方便 debug

**Deviations**：
- Plan Step 4 寫的「`isOrderPublished === false` 且 `view === 'order'` → 顯示 hint」在 E-702c 實際測試時 default view 是 `combo`，但測試直接斷言 hint 必須可見；對齊 home matchups E-105 行為（hint 跟 view 解耦），最終實作為「只看 `isOrderPublished`」。已將測試 / 實作對齊。
- Plan 未提及 GameCard 的 staff toggle 在 combo view 下的處理；考量 combo 視圖純粹展示對戰配對（無時間 / 工作人員語意），實作上隱藏 staff toggle，避免 E2E 中既有 staff 相關 AC（AC-6 / AC-6b）失敗。AC-6 / AC-6b 預設 view = order（fixture 已公告），故未受影響。

**檔案變更**：
- 修改 `src/components/schedule/ScheduleApp.tsx`
- 修改 `src/components/schedule/GameCard.tsx`
