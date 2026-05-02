# Issue #4: [L] feature: /boxscore 數據頁實作（含領先榜 sub-tab）

**分級**：L
**Issue**: https://github.com/waterfat/taan-basketball-league/issues/4
**START_SECONDS**: 1777736541
**Worktree**: feat/4-boxscore-page

## Phase 0 — 開工

- [x] 0.1 讀 Issue + 分級
- [x] 0.2 git-ops-v2 create-worktree（`../taan-basketball-league-issue-4` on `feat/4-boxscore-page`）
- [x] 0.3 TaskCreate Phase Tasks（Tasks 1-7 + 「升級 regression spec」Task 8）

## Phase 1 — 規劃

- [x] 1.0 plan_done 偵測（無計畫檔、無 `planned` label、Issue body 無 `## Plan` → false）
- [x] 1.1 qa-v2 plan #4 → `issue-4_qaplan.md`（38 行為 + 32 E2E + 5 regression + 10 integration + 6 unit ⬜）
- [x] 1.2 qa-v2 補寫 e2e + integration（fixtures/boxscore.ts、fixtures/leaders.ts、helpers/mock-api.ts 擴充、e2e/features/boxscore.spec.ts、e2e/regression/boxscore.regression.spec.ts、integration/boxscore-parse.integration.test.ts）
- [x] 1.3 sp-writing-plans-v2 → `docs/specs/plans/issue-4_boxscore-page.md`（8 tasks，群組 A=[1,5,8] / 群組 B=[2,3,4] / 序列 6→7）+ Issue 加 `planned` label
- [x] 1.4 Read plan 全檔，dispatch payload 暫存（tasks=8 / integration_tests=I-1~I-10 / env_vars=[PUBLIC_SHEETS_API_KEY, PUBLIC_SHEET_ID] / e2e_cases=E-1~E-32 + R-1~R-5）

## Phase 2 — 執行

### 群組 A（並行：Task 1, 5, 8）

- [x] Task 1 — types/boxscore + boxscore-utils + U-1, U-2（commit `e6e8814`，9/9 unit + I-1~I-4 PASS）
- [x] Task 5 — leaders types + format + LeadersPanel + 子元件 + U-6（commit `1010382`，7/7 unit + I-8~I-10 PASS）
- [x] Task 8 — .env.example 新增 PUBLIC_SHEETS_API_KEY + PUBLIC_SHEET_ID（commit `9898f17`）

### 群組 B（並行：Task 2, 3, 4）

- [x] Task 2 — boxscore-api（commit `7b62991` + `26e0b87` 補 vitest 環境變數，I-5~I-7 由紅轉綠）
- [x] Task 3 — boxscore-deep-link + U-3, U-4, U-5（commit `b37b06a`，17/17 PASS）
- [x] Task 4 — BoxscorePanel + 6 子元件（commit `b9ca8fc`，testid `data-highlighted` 對齊 spec）

### 群組 C（序列）

- [x] Task 6 — BoxscoreApp + Hero + SubTabs URL sync（commit `aee4d22`，66/66 PASS）
- [x] Task 7 — boxscore.astro 頁面整合（commit `f4fb61c`，build PASS、dist/boxscore/index.html 15037 bytes）

**Phase 2 整合狀態**：8/8 task 完成；66/66 unit + integration PASS；`npx tsc --noEmit` 無錯；`npm run build` 成功。

## Phase 2 — 執行

（依計畫檔自動填入 task index）

## Phase 3 整合測試

**結果**：✅（人工 override，test_gaps=56 經驗證為工具 false positive，沿用 Issue #3 前例）
**執行時間**：2026-05-02 00:22 TST
**test_gaps**：56（code-graph detect_changes 報；經 Plan Coverage Matrix 對照，全部由 E2E 32+5 case 涵蓋）

> **主人決策（Option A）**：code-graph `detect_changes_tool` 把 React 元件內 inline arrow（`handler` / `deriveBase` / `readUrlState`）、presentational 元件（`BoxscoreEmpty` / `LeadersEmpty` / `LeadersError` 等）、useCallback 內部 closure 全部列入 untested。Plan 設計時這些就由 E2E 涵蓋（spec 已存在 features/boxscore.spec.ts 32 case + regression 5 case），同 Issue #3 工具 false positive 模式。實質覆蓋充足，繼續 Phase 4。

### 執行清單
- ✅ Vitest unit + integration: **95/95 passed**（10 test files）
  - boxscore-utils.test.ts (U-1 + U-2): 9 cases
  - boxscore-deep-link.test.ts (U-3 + U-4 + U-5): 17 cases
  - leaders-format.test.ts (U-6): 7 cases
  - boxscore-parse.integration.test.ts (I-1 ~ I-10): 10 cases
  - 既有 schedule (U) + standings (rebase 後合併進來) + sample / staff-display: 52 cases
- ✅ Build smoke：`npm run build` 成功（dist/boxscore/index.html 15037 bytes）
- ✅ Rebase origin/main 完成（解決 tests/helpers/mock-api.ts 衝突 — 保留 Issue #3 的 `mockKindAPI<T>` 抽象 + 加入本 Issue 的 `mockBoxscoreSheetsAPI` / `mockLeadersAPI` / `mockBoxscoreAndLeaders`）

### 工具誤判分析

`detect_changes_tool` 報 56 個 untested，分布如下（皆由 E2E 涵蓋）：

| 類別 | 數量 | 實際覆蓋來源 |
|------|-----:|------------|
| BoxscoreApp 內部 closure（readUrlState / handleSelectTab / handleWeekChange / handler / deriveBase）| ~5 | E-6 / E-7 / E-8 / E-11（切 tab + URL sync + popstate） |
| 11 個 React 元件本體（BoxscoreApp / BoxscorePanel / LeadersPanel 等）| ~16 | E-1 ~ E-32 + R-1 ~ R-5 |
| Skeleton / Error / Empty 三狀態 presentational 元件 | ~6 | E-17 / E-23 / E-24 / E-26 / E-28 / E-29 |
| inline arrow / map callback / useEffect cleanup | ~25 | 跟著元件被 E2E 覆蓋 |
| 測試本身的 describe/it block（graph 把它當 function） | ~4 | 不應列入 |

**結論**：與 Issue #3 同樣的 tree-sitter call-edge 解析缺陷，無法將 React 元件 props/E2E `data-testid` 視為覆蓋邊。在此專案規模下無法靠補 unit test 解除（補完 11 個元件 smoke test 預期 test_gaps 也只小幅下降，因 inline closure 無法被獨立 unit 測試）。

### 與 Issue #1 / #3 對照

| Issue | test_gaps | 處理 |
|-------|----------|------|
| #1 | 0（graph 未建） | 跳過 |
| #3 | 18 | Option A 人工 override |
| #4 | 56 | Option A 人工 override（本 Issue）|

實質覆蓋（不依賴 graph）：
- 26 個 unit test（U-1 ~ U-6 全直接調用）
- 10 個 integration test（透過真實 transformBoxscore + fetchBoxscore + fetchData）
- 32 + 5 個 E2E spec（已存在 features/regression，待 Phase 6 UAT 跑）

**主人決策**：Option A — 視為工具誤判，繼續 Phase 4。

## Phase 4 — 程式碼交付

- [ ] 4.1 commit + push feat branch
- [ ] 4.2 開 PR
- [ ] 4.3 merge to main + 同步本地

## Phase 5 — 部署記錄

（待 Phase 4 完成）

## Phase 6 — E2E 驗收

（待 Phase 5 完成）
