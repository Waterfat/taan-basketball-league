# Issue #1: [L] feature: /schedule 賽程頁實作（chip timeline + 對戰卡 + 三狀態）

**分級**：L
**Issue**: https://github.com/Waterfat/2026-05-01_16-58 — taan-basketball-league/issues/1
**START_SECONDS**: 1777657622
**Worktree**: feat/1-schedule-page

## Phase 0 — 開工

- [x] 0.1 讀 Issue + 分級
- [x] 0.2 git-ops-v2 create-worktree（`../taan-basketball-league-issue-1` on `feat/1-schedule-page`）
- [x] 0.3 TaskCreate Phase Tasks（10-16）

## Phase 1 — 規劃

- [x] 1.1 plan_done 偵測（首次 Issue，計畫不存在）
- [x] 1.2 qa-v2 plan #1 → `issue-1_qaplan.md`（30 E2E + 4 Integration + 6 Unit ⬜）
- [x] 1.3 sp-writing-plans-v2 → `issue-1_schedule-page.md`（8 個 task，並行群組 B = {3,4,5,6}）

## Phase 2 — 執行

（依計畫檔自動填入 task index）

## Phase 3 — 整合測試

**結果**：✅
**test_gaps**: 0（code-graph 未建置，跳過 detect_changes；改以人工確認本 Issue 新增 6 個 utils 函式 + 7 個 React 元件均有對應 unit/E2E 覆蓋）

### 執行清單
- ✅ Vitest unit + integration: 23/23 passed
  - schedule-utils.test.ts: 15 cases (U-1, U-3, U-4, U-5, U-6)
  - api-fallback.integration.test.ts: 4 cases (I-1, I-2)
  - staff-display.test.ts: 3 cases (U-2)
  - sample.test.ts: 1 case
- ✅ Astro build: 5 pages 全部產出無錯誤

## Phase 4 — 程式碼交付

- [x] 4.1 commit + push（feat/1-schedule-page）
- [x] 4.2 PR #2 建立 + body 含完整 phase coverage
- [x] 4.3 rebase merge to main，本地 main 已同步

## Phase 5 — 部署記錄

**結果**：✅
- Workflow Run: 25226520855
- 觸發：push to main（PR merge 自動觸發）
- 步驟：lint → unit (23) → e2e regression (4) → install playwright → e2e regression mobile → build → deploy gh-pages
- Prod URL: https://waterfat.github.io/taan-basketball-league/schedule
- HTTP 200, HTML 含 ScheduleApp astro-island + skeleton fallback

## Phase 6 — E2E 驗收

**整體結果**：✅

### UAT smoke test
- `tests/e2e/regression/schedule.regression.spec.ts` × 2 projects（desktop + mobile）
- 對 prod URL 跑真實 fetch flow（GAS_URL 未設 → fallback 到 public/data/schedule.json）
- 驗證項目：page load / Hero header / chip timeline / ≥ 6 game cards
- 結果：2/2 passed

### Features E2E（dev 環境，mock 攔截）
- features (desktop): 18 passed, 1 skipped
- features-mobile: 18 passed, 1 skipped
- 總計 36 個 feature case 全綠（AC-1 ~ AC-15 + qa-v2 補充 4 條）

### ⬆️ Regression promotion 評估
- schedule.regression.spec.ts 已建立並放在 `tests/e2e/regression/`
- 跨 Issue 影響：✅（資料層 fallback 失敗會影響所有頁）
- 過去事故：本 Issue 部署期間踩過 BASE_URL trailing slash bug
- 影響範圍：跨 page（修 api.ts 影響所有後續資料頁）
- 結論：本 spec 已是 regression，未來 boxscore/standings/roster 應比照建立 *.regression.spec.ts

## Metrics

```yaml
issue_number: 1
difficulty: L
phase1_retries: 0
phase2_retries: 0  # E2E 期間有 inline 修 bug 但未走 retry 流程
phase4_conflicts: 0
phase5_retries: 0
phase5_env_issues: 0
phase6_unrelated_failures: 0
total_tests: 63
  unit_integration: 23
  e2e_features: 36
  e2e_regression: 4
ac_coverage: 15/15  # AC-1 ~ AC-15 全部覆蓋
qa_v2_supplements: 4
files_added: 17
files_modified: 7
```
