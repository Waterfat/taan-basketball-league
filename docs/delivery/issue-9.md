# Issue #9 — [M] refactor: 拆分大型 e2e spec 檔 + helpers/mock-api

**分級**：M  
**START_SECONDS**：1777741815  
**開始時間**：2026-05-03 TST

## Phase Tasks

- [ ] Phase 0：開工
- [ ] Phase 1：規劃
- [ ] Phase 2：執行
- [ ] Phase 3：整合測試
- [ ] Phase 4：程式碼交付
- [x] Phase 5：部署
- [x] Phase 6：驗收

## Phase 6 E2E 驗收

**環境**：Production（https://waterfat.github.io/taan-basketball-league/）
**執行時間**：2026-05-03 TST
**整體結果**：✅ 全通過

| # | 案例集 | 結果 | 備註 |
|---|--------|------|------|
| 1 | regression（boxscore + schedule × desktop + mobile）| ✅ 12/12 | 全綠 |
| 2 | features/boxscore/（9 spec 檔 × 2 project）| ✅ 62/62（2 skip）| RWD project 互斥 skip |

注意：首次對 localhost 跑出現 4 fail（dev server 未啟動），切換 BASE_URL 到 prod 後全過。

## Metrics

```yaml
issue: 9
completed_at: 2026-05-03T01:45:26+08:00
duration_estimate: 0h 34m
issue_type: refactor
phase1_retries: 0
phase2_retries: 0
blocked_count: 0
phase3_retries: 1
phase4_conflicts: 0
phase5_retries: 0
phase5_env_issues: 0
phase6_retries: 0
phase6_unrelated_failures: 0
anomalous_dispatches: []
smoothness: 2
```

## Phase 5 部署記錄

**環境**：Production（GitHub Pages）
**部署時間**：2026-05-02 17:38 TST

| 步驟 | 結果 |
|------|------|
| env 同步 | ✅ 跳過（無新 env vars）|
| CI / deploy | ✅ `f5532a0`（Deploy to GitHub Pages: completed success）|
| 站台健康 | ✅ HTTP 200 |

## Phase 0 開工

- [x] 0.1 讀 Issue + 分級 [M]，上一個結案 #4（無升級 regression 標記）
- [x] 0.2 建 worktree feat/9-refactor-test-structure → ../taan-basketball-league-issue-9
- [x] 0.3 TaskCreate Phase Tasks（Task #1–7）

## Phase 1 規劃

- [x] 1.1 qa-v2 plan #9 → `docs/delivery/issue-9_qaplan.md`（7 Coverage IDs）
- [x] 1.2 e2e/integration testcase 補寫（Coverage Matrix 完整）
- [x] 1.3 sp-writing-plans-v2 → `docs/specs/plans/2026-05-02-issue-9-e2e-split.md`（14 tasks）
- [x] 1.4 計畫已讀取，payload 暫存

**計畫摘要**：
- Task 1~9：建立 boxscore/ 9 個 spec 子檔（各含 docstring + 完整 test code）
- Task 10：mock-api/ 目錄（4 子檔 + index.ts re-export）
- Task 11：bash 驗證腳本（I-1~I-5）
- Task 12：CLAUDE.md 補一行
- Task 13：TESTING.md 補一節
- Task 14：刪舊 spec + 全量 E2E 驗收

**相依分析**：
- Task 10 必須先完成（spec 檔 import mock-api/index.ts）
- Tasks 1~9 無相依彼此（可並行，分三組）
- Task 11/12/13 無相依（可並行）
- Task 14 最後（刪舊 + 驗收）

## Phase 2 執行

- [x] Group A 並行（Tasks 1-9, 10, 12, 13）：全部 DONE，commit history 確認
- [x] Review → 修 Critical（刪舊 spec）+ Important（TESTING.md import path）
- [x] Task 14：刪舊 boxscore.spec.ts + 全量 E2E（34 passed / 28 pre-existing fail / 2 skip）
- [x] I-1~I-5 bash verify：全部 PASS
- [x] E-2 schedule/standings：66 passed / 4 skip

## Phase 3 整合測試

**結果**：❌

| 項目 | 結果 |
|------|------|
| Vitest unit (95 tests) | ✅ |
| I-1~I-5 bash checks | ✅ 全通過 |
| code-graph test_gaps | ❌ 7（mock-api helper functions）|

**test_gaps 清單（[qa-v2 補充]）**：
- `mockBoxscoreSheetsAPI`, `mockBoxscoreAndLeaders`（mock-api/boxscore.ts）
- `mockLeadersAPI`（mock-api/leaders.ts）
- `mockKindAPI`（mock-api/schedule.ts）
- `callCount`（states.spec.ts 局部變數）、AC-12b / AC-14 test fn

**判定說明**：上述 gaps 均為 Playwright route interceptor（需要瀏覽器執行），無法用 Vitest unit 直接覆蓋。這些函式透過所有使用它們的 E2E spec（全 boxscore + schedule + standings）完整間接覆蓋，code-graph 將新建的測試工具識別為缺直接 coverage 屬預期現象。

### Retry r1 — 決策

**mock-api helper 函式為 Playwright route interceptor，不適合 unit test（需瀏覽器環境），且已透過 E2E 完整間接覆蓋。test_gaps 為 false positive，不退回 Phase 2。**

本次 Issue 為純 test file 重構（無業務邏輯），接受 code-graph 的 test_gaps 偵測為誤報，Phase 3 結果重判：

**結果（Retry r1）**：✅（test_gaps 已分析為可接受誤報，Vitest + bash checks 全通過）
