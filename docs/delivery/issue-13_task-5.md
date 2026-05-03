# Issue #13 Task 5: 重寫 api-fallback.integration.test.ts

## 目標
把 `tests/integration/api-fallback.integration.test.ts` 全 12 個 cases 從「mock script.google.com、source: 'gas'」改為「mock sheets.googleapis.com、source: 'sheets'」，與 Task 3 重寫的 api.ts 對齊。

## 要修改的檔案
- Modify: `tests/integration/api-fallback.integration.test.ts`
- Modify: `tests/integration/boxscore-parse.integration.test.ts`（line 148 註解過時，更新）

## Plan 引用
`docs/specs/plans/2026-05-03-issue-13-data-source-migration.md` 的 **Task 5：重寫 `tests/integration/api-fallback.integration.test.ts`**（含完整新檔內容）。

## 相依
- T3（api.ts 重寫）✅ commit `aceccaa`

## Coverage
- I-7：Sheets HTTP 500 → fallback static
- I-8：Sheets + JSON 都失敗 → source: error

## Style Rules
無命中

## 執行記錄

### Attempt 1
- **狀態**：完成
- **執行人**：subagent (Opus 4.7)
- **完成時間**：2026-05-03 15:13 TST
- **動作**：
  1. 讀取舊版 `tests/integration/api-fallback.integration.test.ts`（12 cases，mock `script.google.com`，source `'gas'`）。
  2. Write 整檔重寫，採 plan Step 2 提供的完整新檔（9 cases，mock `sheets.googleapis.com`，source `'sheets' | 'static' | 'error'`）。
     - 移除「GAS 成功 → source: gas」、「roster: GAS 成功 → source: gas」這兩個直接成功的 case（行為已改：第一層 mock 在 transform 後資料欄位空，無法等價驗證；改由 `tests/integration/api-sheets.integration.test.ts` 驗 sheets 成功路徑）。
     - 保留 9 個 fallback / error case：schedule × 3、standings × 2、roster × 2、dragon × 2。
  3. Edit `tests/integration/boxscore-parse.integration.test.ts` line 148 註解：`GAS_URL` → `PUBLIC_SHEET_ID/PUBLIC_SHEETS_API_KEY`；同步把 `expect(['gas', 'static'])` 改成 `expect(['sheets', 'static'])`（避免過時 enum 值殘留）。
  4. 執行 `npm test -- --run tests/integration/`，全部 37 tests / 5 files 綠燈通過。
- **測試結果**：`Test Files 5 passed (5) | Tests 37 passed (37)`，含 api-fallback（重寫版 9 cases）、api-sheets、api-cache、api-cleanup、boxscore-parse。
- **Commit**：`cae79d8`
