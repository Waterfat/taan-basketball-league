# Issue #14 Task 8 — 隊伍切換 chips（B6 + AC-8 + BQ-3）

**Goal**：`/roster?tab=roster` 上方加 7 個 chip（全部+紅黑藍綠黃白），點選後 filter 隊伍 section。

**Files**：
- `src/components/roster/TeamFilterChips.tsx`（新）
- `src/components/roster/RosterApp.tsx`（state + 整合 + 傳 selectedTeam 給 RosterTabPanel）
- `src/components/roster/RosterTabPanel.tsx`（接受 selectedTeam prop，依 filter 顯示/隱藏 team section）

**Plan reference**：見 `docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 8 段落

## Acceptance
- E2E：`tests/e2e/features/roster/roster-team-filter.spec.ts` 全綠（E-601~E-604）
- 既有 roster specs 不退化（特別 `deep-link.spec.ts` 的 `?team=紅` 行為）

## Style Rules
- 不適用 **style-rwd-list**（chip 為按鈕列）
- 不適用 **style-skeleton-loading**（client-side filter，無 API）

## Result

**狀態**：完成 ✅

**變更檔案**：
- `src/components/roster/TeamFilterChips.tsx` — 新增 7 個 chip（all + 紅黑藍綠黃白），各 chip 帶 `data-team` 與 `aria-pressed`；隊伍配色從 `TEAM_CONFIG` 讀取（無 hardcode 色碼）。
- `src/components/roster/RosterApp.tsx` — 加入 `selectedTeam` state（預設 `'all'`），並在 SubTabs / AttendanceLegend 後渲染 `<TeamFilterChips>`，傳給 `RosterTabPanel`。
- `src/components/roster/RosterTabPanel.tsx` — 接受新 prop `selectedTeam: TeamFilterValue`，依此判斷每個 `roster-team-section` 是否要設 `hidden` 屬性（HTML `hidden` 屬性 = `display: none`，`toBeHidden()` 會通過）。

**測試結果**：
- TypeScript：通過（exit 0）。
- E2E：`tests/e2e/features/roster/roster-team-filter.spec.ts` 12 cases 全綠（features + features-mobile 各 6 cases，含 E-601~E-604）。
- Deep-link 兼容：`tests/e2e/features/roster/deep-link.spec.ts` 8 cases 全綠（AC-11~AC-12）。

**設計決策（Deviation from plan code spec）**：
- Plan 提到「`?team=` URL state 可整合或併行」；本實作採**併行**策略：
  - **Deep-link `?team=<id>`**（保留既有行為）：寫入 `highlightTeam` state，僅做 ring highlight + scrollIntoView，**不改變顯示/隱藏**。
  - **Chip filter**（新行為）：寫入 `selectedTeam` state（純 client-side，預設 `'all'`），控制 section 的 `hidden` 屬性。
  - 兩者解耦，避免 `?team=red`（id）與 chip 用的中文（`紅`）格式衝突；亦讓 deep-link 行為「載入後自動聚焦該隊但仍顯示其他隊」保持不變。
- TeamFilterValue 用中文鍵（`'紅' | '黑' | ...`），對應 `TEAM_CONFIG` 索引；section filter 比對時以 `team.name.replace('隊','')`（去尾「隊」字）對齊。
