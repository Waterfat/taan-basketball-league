# Issue #14 Task 7 — 球員名單出席率欄 + Legend（B5 + AC-6 + AC-7）

**Goal**：roster table 加日期欄頭 + 出席率欄、上方加 AttendanceLegend。

**Files**：
- `src/lib/roster-utils.ts`（加 `computeAttendanceSummary`）
- `src/components/roster/AttendanceLegend.tsx`（新）
- `src/components/roster/RosterTabPanel.tsx`（接受 weeks prop + 渲染日期欄頭 + 出席率欄）
- `src/components/roster/RosterApp.tsx`（裝載 AttendanceLegend，僅 roster tab 顯示，傳 weeks 給 RosterTabPanel）
- `tests/unit/roster-utils.test.ts`（擴充：U-501）

**Plan reference**：見 `docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 7 段落

## Acceptance
- Unit test：U-501（出席率計算：含 1/0/x，排除 ?）
- E2E：`tests/e2e/features/roster/roster-attendance.spec.ts` 全綠（E-501~E-503）
- 既有 roster specs 不退化

## Style Rules
- **style-rwd-list**：roster 既有 PC table + Mobile card 雙呈現，新增日期欄頭/出席率欄遵循同模式（mobile card 顯示出席率）
- **style-skeleton-loading**：RosterApp 既有 SkeletonState 沿用

## Result

**狀態**：完成 ✅

**變更檔案**：
- `src/lib/roster-utils.ts` — 新增 `computeAttendanceSummary(att)` → `{ played, total, rate }`，'?' 不計入 total，'1/0/x' 計入。
- `src/components/roster/AttendanceLegend.tsx` — 新增 legend section，含「1 出席 / 0 請假 / ✕ 曠賽 / ? 尚未舉行」四項說明。
- `src/components/roster/RosterTabPanel.tsx` — 重構為單一響應式 PlayerRow（避免重複 testid 造成 strict-mode violation）；新增 `WeekHeaderRow` 在 panel 頂端渲染 10 個 `roster-week-header`；每位球員加 `roster-attendance-summary`（含 `data-rate/data-played/data-total`）。
- `src/components/roster/RosterApp.tsx` — 在 SubTabs 與 RosterTabPanel 之間插入 `<AttendanceLegend />`（僅 roster tab 顯示）。
- `tests/unit/roster-utils.test.ts` — 加入 U-501 4 cases（全 1 / 含 0 / 含 x / 全 ?）。

**測試結果**：
- TypeScript：`npx tsc --noEmit -p tsconfig.json` 通過（exit 0）。
- Unit：U-501 4 個新 case 全綠（roster-utils.test.ts 共 17 測項）。
- E2E：`tests/e2e/features/roster/roster-attendance.spec.ts` 12 cases 全綠（features + features-mobile 各 6）。

**設計決策（Deviation from plan code spec）**：
- Plan 範例採「PC 用 `<table>`，Mobile 用 cards」分開渲染；但測試 strict-mode 不允許多重 `roster-attendance-summary` 匹配。改用單一 DOM 樹搭配 Tailwind responsive class（`flex-col md:flex-row`、`md:contents`、`md:hidden`）切換版面，確保 `roster-player-row` / `roster-attendance-summary` testid 在 PC + Mobile 都唯一可見。
- 日期欄頭從 plan 中的「per-team table thead」hoist 到 panel 頂端共用一份（總計 10 個 `roster-week-header`），符合 E-501 的 `toHaveCount(10)` 期待（六隊各自 10 個 header 會變 60，無法通過）。
