# Issue #13 Task 4: mock-api helpers 切換 Sheets pattern

## 目標
把 `tests/helpers/mock-api/` 各模組從 GAS_PATTERN（`script.google.com`）切換到 SHEETS_PATTERN（`sheets.googleapis.com/v4/spreadsheets`），並清掉 `index.ts` 第 5 行殘留的 merge conflict marker。

## 要修改/新增的檔案
- Modify: `tests/helpers/mock-api/schedule.ts`（核心 — GAS_PATTERN → SHEETS_PATTERN，export const SHEETS_PATTERN）
- Modify: `tests/helpers/mock-api/index.ts`（清 merge conflict marker、re-export SHEETS_PATTERN）
- Modify: `tests/helpers/mock-api/{home,standings,leaders,roster}.ts`（如需要，因應 mockKindAPI 簽名變更）
- Test: `tests/unit/mock-api-pattern.test.ts`

## Plan 引用
`docs/specs/plans/2026-05-03-issue-13-data-source-migration.md` 的 **Task 4：mock-api helpers 切換 Sheets pattern** 段落。

## Coverage
- U-2：mock-api/ helpers SHEETS_PATTERN 正則匹配實際 Sheets v4 URL

## 注意事項
- 採用「簡化版」mock 策略（plan 推薦）：第一層 Sheets 預設 fail → fallback JSON 提供 ground truth。E2E 不驗 transformer 邏輯，由 unit/integration 覆蓋。
- 維持 `gasFails` 欄位名向後相容（語意改為 sheetsFails，實作上恆為 true 或行為等同）。

## Style Rules
無命中

## 執行記錄

### Attempt 1（2026-05-03）
- **狀態**：DONE
- **Step 1**：建 `tests/unit/mock-api-pattern.test.ts`（4 cases，含 plan U-2 + merge conflict marker 檢查 + SHEETS_PATTERN 匹配 v4 batchGet URL）。
- **Step 2**：跑測試確認 4/4 FAIL（如預期，schedule.ts 仍是 GAS_PATTERN、index.ts 仍含 `<<<<<<< HEAD`）。
- **Step 3**：實作：
  - 改寫 `tests/helpers/mock-api/schedule.ts` 採簡化版 — 第一層 `SHEETS_PATTERN`（`/sheets\.googleapis\.com\/v4\/spreadsheets\/[^/]+\/values/`）恆 fulfill 500，由 fallback JSON 出資料；export `SHEETS_PATTERN` 供共用。
  - 改寫 `tests/helpers/mock-api/index.ts`：移除 `<<<<<<< HEAD` 衝突標記、re-export `SHEETS_PATTERN`。
  - 改寫 `tests/helpers/mock-api/leaders.ts`：**移除**第一層 SHEETS 攔截（避免後註冊優先 LIFO 覆蓋 boxscore.ts 的 SHEETS mock），只保留 JSON fallback 攔截。`gasFails` 欄位保留（向後相容）但實作上不再影響行為。
  - 更新 `home.ts` / `standings.ts` / `roster.ts` 的 docstring（描述改為 Sheets API + 簡化版策略）。
  - 不動 `boxscore.ts`（Issue #4 已用自己的 SHEETS_PATTERN，正確處理 v4 真實 mock payload）。
- **Step 4**：跑 `npm test -- --run tests/unit/mock-api-pattern.test.ts` 確認 4/4 PASS。
- **Step 5**：跑 `npx playwright test tests/e2e/regression`：8 passed / 4 failed。失敗集中在 `boxscore.regression.spec.ts` R-2 / R-3（`boxscore-panel` not visible / `bs-week-chip[data-active]` not found）。已用 `git stash` 還原 baseline 驗證 — 在我的修改之前同樣是這 4 個 case fail（baseline: 6 pass / 4 fail；切換後: 8 pass / 4 fail，提升 2 case）。**這 4 個失敗為 pre-existing failure，與 mock pattern 切換無關**。
- **Step 6**：commit `refactor(test): switch mock-api helpers from GAS to Sheets pattern (#13)`。

## 結論

- ✅ U-2 unit tests 4/4 PASS
- ✅ schedule regression E2E 全綠
- ✅ standings regression E2E 全綠
- ⚠️ boxscore regression 4 個 pre-existing failure（不在 Task 4 範圍）
