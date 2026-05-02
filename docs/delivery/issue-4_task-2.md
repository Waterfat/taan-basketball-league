# Issue #4 Task 2: fetchBoxscore（直打 Google Sheets API）

## 目標
實作 `src/lib/boxscore-api.ts` 的 `fetchBoxscore()`，直打 Google Sheets API v4 values.get、套 `transformBoxscore` 解析回 `BoxscoreData`。

## 要修改/新增的檔案
- Create: `src/lib/boxscore-api.ts`（覆蓋 Task 1 暫留的 stub）

## 驗收標準
- [ ] I-5: 成功回應 → source='sheets'，`data.weeks.length > 0`
- [ ] I-6: Sheets API 500 → source='error'，error 含 HTTP 狀態
- [ ] I-7: 網路錯誤 → source='error'，error 含「network」字樣

## Style Rules
無命中（純資料層 fetcher）

## 執行記錄

### Attempt 1
（subagent 執行後填入）
