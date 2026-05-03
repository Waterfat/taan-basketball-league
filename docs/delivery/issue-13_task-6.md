# Issue #13 Task 6: 清理 config / docs

## 目標
移除所有 GAS Webapp 相關設定/型別/文件，加入 Sheets API 直打的 documentation。

## 要修改/新增的檔案
- Modify: `src/env.d.ts`（移除 PUBLIC_GAS_WEBAPP_URL）
- Modify: `.env.example`（移除 PUBLIC_GAS_WEBAPP_URL 區塊）
- Modify: `tests/environments.yml`（移除 GAS env_vars + external.google_sheets_webapp，加 PUBLIC_SHEET_ID + PUBLIC_SHEETS_API_KEY）
- Modify: `README.md`（移除 PUBLIC_GAS_WEBAPP_URL 描述列）
- Modify: `docs/specs/integrations.md`（移除 GAS Webapp 區塊，加 Sheets API 直打描述）

## Plan 引用
`docs/specs/plans/2026-05-03-issue-13-data-source-migration.md` 的 **Task 6：清理 config / docs** 段落。

## Coverage
- I-9：api.ts 不再 reference PUBLIC_GAS_WEBAPP_URL（驗收檔案層級）
- 由已建 `tests/integration/api-cleanup.integration.test.ts` 自動驗證

## 不刪檔案
- `gas/Code.gs`（保留歷史參考）
- `gas/SETUP.md`、`gas/DATA_SOURCE_CHECKLIST.md`（保留歷史參考）

## Style Rules
無命中

## 執行記錄

### Attempt 1
- **狀態**：DONE
- **執行時間**：2026-05-03
- **修改檔案**：
  - `src/env.d.ts`：移除 `PUBLIC_GAS_WEBAPP_URL`，新增 `PUBLIC_SHEET_ID`、`PUBLIC_SHEETS_API_KEY`、`BASE_URL`
  - `.env.example`：移除整個 GAS Webapp 區塊（含註解 + `PUBLIC_GAS_WEBAPP_URL=...` 一行）
  - `tests/environments.yml`：移除 `external.google_sheets_webapp` + `env_vars.PUBLIC_GAS_WEBAPP_URL`，新增 `external.google_sheets_api`、`env_vars.PUBLIC_SHEET_ID`、`env_vars.PUBLIC_SHEETS_API_KEY`
  - `README.md`：技術棧改為「Sheets API v4 直打」、env 表格新增 SHEET_ID/API_KEY 兩列、新增「資料來源」段落
  - `docs/specs/integrations.md`：完整重寫為 Sheets API 直打文件（保留 GAS 檔案註明為歷史參考）
- **cleanup test 結果**：本 task 自家的 6 cases 全 PASS（env.d.ts、.env.example、environments.yml、SHEET_ID/API_KEY 註冊、gas/Code.gs 保留）。剩 3 cases 失敗屬其他 task：2 個 `src/lib/api.ts` cases → Task 3；1 個 `mock-api/index.ts` merge marker case → Task 4。
- **grep 驗證**：
  - `grep -rn "PUBLIC_GAS_WEBAPP_URL" src/ tests/environments.yml .env.example README.md docs/specs/integrations.md` → 1 match（src/lib/api.ts:24，由 Task 3 處理）
  - `grep -rn "script.google.com" src/ .env.example README.md docs/specs/integrations.md` → 0 match
- **結果**：本 task 範圍內檔案全部清理完成，待 Task 3/4 完成後 cleanup test 全綠。
