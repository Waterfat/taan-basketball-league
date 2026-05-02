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

## Phase 3 — 整合測試

（待 Phase 2 完成）

## Phase 4 — 程式碼交付

- [ ] 4.1 commit + push feat branch
- [ ] 4.2 開 PR
- [ ] 4.3 merge to main + 同步本地

## Phase 5 — 部署記錄

（待 Phase 4 完成）

## Phase 6 — E2E 驗收

（待 Phase 5 完成）
