# Issue #13 Task 3: 重寫 src/lib/api.ts

## 目標
把 `src/lib/api.ts` 從「走 GAS Webapp 中介」改為「直接打 Google Sheets API v4 + 5 分鐘 cache + 失敗 fallback 靜態 JSON」，整合 T1 (`api-cache`) + T2 (`api-transforms`)。

## 要修改/新增的檔案
- Modify: `src/lib/api.ts`（核心重寫）

## Plan 引用
`docs/specs/plans/2026-05-03-issue-13-data-source-migration.md` 的 **Task 3：重寫 `src/lib/api.ts`** 段落（含完整實作碼）。

## 相依
- T1（api-cache）✅ commit `eab7d3a`
- T2（api-transforms）✅ commit `2b0d7a5` + `293df5e`

## Coverage
- I-1, I-2, I-3：fetchData(home/standings/dragon) 直打 Sheets URL
- I-4, I-5, I-6：cache hit / cache 過期 / TTL = 5 分鐘
- I-7, I-8：Sheets fail → fallback static / 兩層全失敗 → error
- 由已建 `tests/integration/api-sheets.integration.test.ts`、`api-cache.integration.test.ts`、`api-cleanup.integration.test.ts` 自動驗證

## Style Rules
無命中

## 執行記錄

### Attempt 1
- **狀態**：✅ DONE
- **Commit**：`aceccaa` `feat(api): replace GAS webapp with direct Sheets v4 API + 5-min cache (#13)`
- **TDD 步驟**：
  1. RED：跑 `tests/integration/api-sheets.integration.test.ts` + `api-cache.integration.test.ts` → 4/9 fail（api.ts 仍用 GAS_URL，無 'sheets' source、無 cache）
  2. GREEN：依 plan Step 2 重寫 `src/lib/api.ts`：
     - import `transform*` from `./api-transforms`、`getCached`/`setCache` from `./api-cache`
     - 維持 10 個 DataKind union
     - `SHEET_ID` / `API_KEY` 從 `import.meta.env.PUBLIC_SHEET_ID` / `PUBLIC_SHEETS_API_KEY` 取
     - `SHEETS_RANGES` map（6 個 kind 有 ranges；boxscore/stats/rotation/hof 為空陣列）
     - `TRANSFORMERS` map（6 個 kind）
     - helpers：`isSheetsConfigured`（驗 placeholder）、`buildBatchUrl`（v4 batchGet URL）
     - `fetchFromSheets<T>` / `fetchFromStatic<T>`（拆出 try-catch 兩層）
     - `fetchData<T>` 入口：cache → Sheets → static → error 四層
     - source enum 改為 `'sheets' | 'static' | 'error'`
  3. 驗證：跑 `api-sheets` + `api-cache` + `api-cleanup` 全綠 (**18/18 passed**)
- **驗證指令輸出**：
  - `grep "PUBLIC_GAS_WEBAPP_URL\|GAS_URL\|script\.google\.com" src/lib/api.ts` → 0 match ✅
  - `grep "sheets\.googleapis\.com\|PUBLIC_SHEET_ID\|PUBLIC_SHEETS_API_KEY" src/lib/api.ts` → 3 match ✅
- **預期 FAIL（不在本 task 範圍）**：
  - `tests/integration/api-fallback.integration.test.ts`：2 cases mock `script.google.com` + 期待 `source: 'gas'`，將由 **Task 5** 重寫
- **整體 integration 測試**：37 passed / 2 failed（fail 都在 api-fallback，T5 範圍）
