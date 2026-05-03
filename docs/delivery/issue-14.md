# Issue #14 — [L] feat: 補齊新網站從舊版遺漏的功能

**分級**：L（11 子項，跨 6 個畫面，含資料層擴充）
**START_SECONDS**：1777809295
**啟動時間**：2026-05-03 TST

## Scope

11 子項補齊舊版功能：
- **B 群（功能補齊，7 項）**：B1 首頁 6 組對戰預覽 + 切換、B2 戰績矩陣、B3 隊伍進攻/防守/差值、B4 領先榜 5 類個人、B5 出席率欄、B6 隊伍 chips、B7 賽程頁切換
- **C 群（龍虎榜細節，4 項）**：C1 平民/奴隸區標題、C2 季後賽加分 chip、C3 選秀規則連結、C4 hero subtitle

## Phase 0 開工
- [x] 0.1 讀 Issue + 分級（L）
- [x] 0.15 spec_done 偵測（已標）
- [x] 0.2 worktree 建立 → `feat/14-missing-features`
- [x] 0.3 Phase Tasks 建立

## Phase 1 規劃
- [x] 1.1 qa-v2 plan → `docs/delivery/issue-14_qaplan.md`
- [x] 1.2 qa-v2 寫 e2e + integration test（8 新 spec + 2 擴充 + 2 integration + 4 fixture 擴充）
- [x] 1.3 sp-writing-plans-v2 → `docs/specs/plans/2026-05-03-issue-14-missing-features.md`（命中 style-rwd-list + style-skeleton-loading）
- [x] 1.4 dispatch payload 抽出（暫存於 pm-v2 context）

## Phase 2 執行

依計畫 9 個 tasks，分 3 個 batch：
- **Batch 1**：T1（型別 + 資料層）— 解鎖所有後續 task
- **Batch 2（6 並行）**：T2 + T5 + T6 + T7 + T8 + T9（皆只依賴 T1）
- **Batch 3（2 並行）**：T3 + T4（依賴 T2 toggle utility）

| Task | 描述 | 狀態 | Delivery |
|------|------|------|---------|
| T1 | 型別 + 資料層擴充 | pending | issue-14_task-1.md |
| T2 | matchups-toggle-utils | pending | issue-14_task-2.md |
| T3 | 首頁對戰預覽（B1）| pending | issue-14_task-3.md |
| T4 | 賽程頁 toggle（B7）| pending | issue-14_task-4.md |
| T5 | 戰績矩陣（B2）| pending | issue-14_task-5.md |
| T6 | 領先榜 11 類 + 三隊伍表（B3 + B4）| pending | issue-14_task-6.md |
| T7 | 球員名單出席率欄（B5）| pending | issue-14_task-7.md |
| T8 | 隊伍 chips（B6）| pending | issue-14_task-8.md |
| T9 | 龍虎榜分組 + Hero（C1~C4）| pending | issue-14_task-9.md |

## Phase 3 整合測試

**結果**：✅ PASSED
**執行時間**：2026-05-03 21:00 TST
**test_gaps**：N/A（code-review-graph 圖未建立，total_nodes=0，依 SOP 跳過 detect_changes_tool）

| 測試類別 | 結果 |
|---------|------|
| integration tests（7 檔案，含 I-1 + I-2 新補）| 45/45 passed |
| code-review-graph test_gaps | skipped（圖未建立）|

整合測試全部通過：
- `tests/integration/api-standings-matrix.integration.test.ts` (I-1) — 4 cases
- `tests/integration/api-leaders-extended.integration.test.ts` (I-2) — 4 cases
- `tests/integration/api-cache.integration.test.ts` — sustained
- `tests/integration/api-cleanup.integration.test.ts` — sustained
- `tests/integration/api-fallback.integration.test.ts` — sustained
- `tests/integration/api-sheets.integration.test.ts` — sustained
- `tests/integration/boxscore-parse.integration.test.ts` — sustained


## Phase 4 程式碼交付

## Phase 5 部署記錄

**結果**：✅ DEPLOYED
**部署時間**：2026-05-03 21:04 TST（13:04 UTC）
**部署目標**：GitHub Pages（https://waterfat.github.io/taan-basketball-league/）
**觸發方式**：push main → GitHub Actions auto-build → push gh-pages → Pages serve（無 UAT 環境，prod 為唯一部署目標）

| 項目 | 結果 |
|------|------|
| Workflow run | 25279930728 — Deploy to GitHub Pages |
| Head SHA | 2f6669c |
| Status | completed / success |
| 耗時 | 約 1 分 34 秒（13:03:00 → 13:04:34 UTC）|

## Phase 6 E2E 驗收

**環境**：Production（https://waterfat.github.io/taan-basketball-league/）
**執行時間**：2026-05-03 21:08 TST
**整體結果**：✅ 全通過

| 指標 | 結果 |
|------|------|
| 通過 | **297 / 297** |
| 失敗 | 0 |
| 跳過 | 8（project scoping，預期）|
| 總耗時 | 1.8 分 |

| 案例集 | 結果 | 備註 |
|---|---|---|
| regression（boxscore + schedule × desktop + mobile）| ✅ 全綠 | P0 沒退化 |
| features/home/（含 home-matchups Issue #14 新）| ✅ 全綠 | E-101~E-106 |
| features/standings/（含 standings-matrix Issue #14 新）| ✅ 全綠 | E-201~E-205 |
| features/standings.spec.ts（既有 + AC-11 等）| ✅ 全綠 | 不退化 |
| features/boxscore/leaders.spec.ts + leaders-team.spec.ts（Issue #14 新）| ✅ 全綠 | E-301~E-304 + E-401~E-403 |
| features/boxscore/leaders-tab.spec.ts（AC-9 6→11 同步）| ✅ 全綠 | sync to BQ-6 |
| features/roster/roster-attendance.spec.ts（Issue #14 新）| ✅ 全綠 | E-501~E-503 |
| features/roster/roster-team-filter.spec.ts（Issue #14 新）| ✅ 全綠 | E-601~E-604 |
| features/roster/dragon-tab.spec.ts + dragon-tab-grouping.spec.ts（擴充 + 新）| ✅ 全綠 | E-801~E-804 |
| features/roster/hero-roster-tab.spec.ts（擴充）| ✅ 全綠 | E-901~E-902 |
| features/schedule/schedule-toggle.spec.ts（Issue #14 新）| ✅ 全綠 | E-701~E-702 |
| features/schedule.spec.ts（既有）| ✅ 全綠 | 不退化 |

11 子項全部部署到 prod 並通過驗收。

## Metrics

```yaml
issue: 14
completed_at: 2026-05-03T21:28:04+08:00
duration_estimate: 1h 33m
issue_type: feat
size: L
phase1_retries: 0
phase2_retries: 0
blocked_count: 1
phase3_retries: 0
phase4_conflicts: 0
phase5_retries: 0
phase5_env_issues: 0
phase6_retries: 0
phase6_unrelated_failures: 0
anomalous_dispatches:
  - "sp-writing-plans-v2 agent stalled at writing step（5+ 分鐘無進度）→ killed via TaskStop → 在當前 context 直接寫 plan（資料完整可用）"
  - "T6 agent 過程中觸發 git stash drop → 用 git fsck --lost-found 找回 dangling commit 3315a17 還原 15 個非 Task 6 scope 檔案；不影響最終結果"
smoothness: 4
```

> smoothness=4：兩個 anomalous events（agent stuck + accidental stash drop）但都自我修復，prod E2E 297/0/8 一次過。

> 規格擴展副作用：`tests/e2e/features/boxscore/leaders-tab.spec.ts AC-9` 由 6 → 11 類同步本 Issue BQ-6 規格（local 上既有 spec 因 fixture 升級已預期 fail，已修正並全綠）。
