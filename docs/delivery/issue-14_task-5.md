# Issue #14 Task 5 — 戰績矩陣（B2 + AC-E1 + BQ-1）

**Goal**：建立 `StandingsMatrix` 元件，整合至 `StandingsApp`，含 RWD 橫向捲動 + 顏色 + 三狀態。

**Files**：
- `src/lib/standings-matrix-utils.ts`（新）
- `src/components/standings/StandingsMatrix.tsx`（新）
- `src/components/standings/StandingsApp.tsx`（整合）
- `src/styles/global.css`（matrix cell 顏色 utility class）
- `tests/unit/standings-matrix-utils.test.ts`（新）

**Plan reference**：見 `docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 5 段落

## Acceptance
- Unit test：U-201（matrix parser cell sign）+ U-202（CSS class mapping）
- E2E：`tests/e2e/features/standings/standings-matrix.spec.ts` 全綠（E-201~E-205）
- 既有 standings spec 不退化

## Style Rules
- **style-rwd-list**：matrix 因為 cell value 短，PC/mobile 都用 `<table>` + `overflow-x-auto`（非「卡片」拆分），docstring 註明此例外
- **style-skeleton-loading**：StandingsApp 既有 SkeletonState/ErrorState/EmptyState 沿用，matrix 不額外加

## Result

**驗收狀態**：全部通過 ✅

| 驗收項 | 結果 |
|--------|------|
| `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| `npm test -- tests/unit/standings-matrix-utils.test.ts`（U-201 + U-202） | 11/11 ✅ |
| `npx playwright test tests/e2e/features/standings/standings-matrix.spec.ts`（E-201~E-205） | 14/14 ✅（features + features-mobile） |
| `npx playwright test tests/e2e/features/standings.spec.ts`（既有 regression） | 30/30 通過、2 skipped（project 隔離預期），不退化 |

**Files changed**：
- `src/lib/standings-matrix-utils.ts`（新）— `getCellSign` / `getCellClass` / `formatCellText`
- `src/components/standings/StandingsMatrix.tsx`（新）— 6×6 table + overflow-x-auto，docstring 註明 RWD 例外
- `src/components/standings/StandingsApp.tsx`（修改）— ok state 渲染 `<StandingsMatrix>`；error state 加 `data-testid="matrix-error"` wrapper（符合 spec 接受的 `[data-testid="matrix-error"], [data-testid="error-state"]` selector）
- `src/styles/global.css`（修改）— 加 `.matrix-cell--positive|negative|zero|self` 顏色 utility class
- `tests/unit/standings-matrix-utils.test.ts`（新）— 11 cases cover null/正/負/零 + class 不重疊

**Deviations / Notes**：
1. 計畫中 CSS 範例使用 `@apply text-green-700 bg-green-50`，因為 Tailwind 4 的 `@apply` 在 `@theme` 之外的 utility class 中不總是可解析（依專案的 `@import "tailwindcss"` 配置），改用直接 hex（`#15803d` / `#f0fdf4` / `#b91c1c` / `#fef2f2`）+ token 變數（`var(--color-txt-mid)` / `var(--color-txt-light)`）。視覺結果一致，且避開 build 期 utility class resolution 風險。
2. `StandingsApp` error 分支用 `<div data-testid="matrix-error">` 包住既有 `<ErrorState>`，避免改 `ErrorState.tsx`（不在允許清單）。既有 `AC-11` spec 用 `getByText` / `getByRole`，不受 wrapper 影響。
3. 元件 docstring 已註明 PC/mobile 共用 `<table>` 是 6×6 矩陣的特殊情境（cell 值短、拆 card 反而難讀），符合 task delivery `## Style Rules` 的例外聲明。
