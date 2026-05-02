# Issue #4 Task 8: 環境變數整合（.env.example）

## 目標
在 `.env.example` 追加 `PUBLIC_SHEET_ID` 與 `PUBLIC_SHEETS_API_KEY` 範例與設定步驟註解。

## 要修改/新增的檔案
- Modify: `.env.example`

## 驗收標準（來自 plan）
- [x] `.env.example` 含 `PUBLIC_SHEET_ID=REPLACE_WITH_SPREADSHEET_ID`
- [x] `.env.example` 含 `PUBLIC_SHEETS_API_KEY=REPLACE_WITH_API_KEY`
- [x] 註解寫明 4 步驟設定（Cloud Console、referrer 限制、API 限制、Spreadsheet 共用）

## Style Rules
無命中（純設定檔）

## 執行記錄

### Attempt 1
- **時間**：2026-05-02
- **狀態**：✓ 完成
- **Commit**：`9898f17`
- **操作**：
  1. 檢查 `.env.example` 現有內容（已存在 `PUBLIC_GAS_WEBAPP_URL` 與 `PUBLIC_SITE_URL`）
  2. 確認無重複條目（`PUBLIC_SHEET_ID` / `PUBLIC_SHEETS_API_KEY` 不存在）
  3. 在末尾追加註解 + 兩環境變數範例
  4. 維持 1 行空行格式（第 11 行空行）
  5. Commit：`chore(env): add PUBLIC_SHEET_ID + PUBLIC_SHEETS_API_KEY to .env.example (Issue #4 Task 8)`
- **驗收**：
  - ✓ `PUBLIC_SHEET_ID=REPLACE_WITH_SPREADSHEET_ID` 已追加
  - ✓ `PUBLIC_SHEETS_API_KEY=REPLACE_WITH_API_KEY` 已追加
  - ✓ 註解完整含 4 步驟設定說明
  - ✓ 無 `.env.local` 建立（符合規格「由部署時手動設定」）
