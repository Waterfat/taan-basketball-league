# Issue #14 Task 3 — 首頁對戰預覽（B1 + B2.* + AC-E2）

**Goal**：建立 `MatchupsBlock` 取代現有 `ScheduleBlock`，顯示 6 組對戰預覽 + 「對戰組合 / 賽程順序」toggle，含智慧預設、URL sync、unpublished hint。

**Files**：
- `src/components/home/MatchupsBlock.tsx`（新）
- `src/components/home/HomeDashboard.tsx`（替換 child）
- `src/components/home/ScheduleBlock.tsx`（**刪除**）

**Plan reference**：`docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 3

## Acceptance
- E2E：`tests/e2e/features/home/home-matchups.spec.ts` 全綠（E-101~E-106）
- 既有 home spec 不退化（home-rwd / home-hero-schedule / home-leaders-dragon / home-standings / home-states）

## Style Rules
- **style-skeleton-loading**：HomeDashboard 既有 SkeletonState 沿用
- 不適用 **style-rwd-list**（卡片格網非「列表」）

## Result

- **Files**:
  - 新增 `src/components/home/MatchupsBlock.tsx`
  - 修改 `src/components/home/HomeDashboard.tsx`（替換 ScheduleBlock import 與 JSX 為 MatchupsBlock）
  - 刪除 `src/components/home/ScheduleBlock.tsx`
- **TypeScript**: `npx tsc --noEmit -p tsconfig.json` exit 0
- **E2E target spec** `tests/e2e/features/home/home-matchups.spec.ts`: **12 / 12 passed**（features + features-mobile，含 E-101 ~ E-106 + E-106b）
- **Regression** `tests/e2e/features/home/`: **56 / 56 passed**（home-hero-schedule / home-leaders-dragon / home-matchups / home-rwd / home-standings / home-states 皆未退化）
- **Deviations**:
  - `MatchupsBlock` 在容器外層 `data-testid="home-matchups"` 內巢套子節點 `data-testid="home-schedule"`，同時保留舊 `home-schedule` testid 與 `2026 / 2 / 14`、`三重體育館`、`看本週對戰` CTA，以保持既有 home-hero-schedule / home-rwd specs 不退化（既有 spec 用 `mockHomeData()` 不含 weekMatchups，舊 ScheduleBlock 行為仍需保留）
  - `effectiveView` 邏輯：`isOrderUnpublished` 時，即使使用者點 order 仍強制以 combo list 渲染（spec E-105：unpublished 場景 toggle order 後仍顯示 6 張 combo 卡片 + hint）
  - 兩個 list 用條件式渲染（非 hidden 屬性切換），避免 Playwright `getByTestId('matchup-card').toHaveCount(6)` 把兩個 list 的卡片重複計數；非 active 的 list 仍渲染空 `<div data-testid="matchups-{combo,order}-list" hidden />` 占位，讓 `toBeHidden()` / `toBeVisible()` 雙向斷言皆能命中
  - 未動 `src/pages/index.astro` 的 `client:load`（指令限制只能改三個檔案；plan 提到改 `client:visible` 屬於 nice-to-have）
