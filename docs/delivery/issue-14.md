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

## Phase 6 E2E 驗收

## Metrics
