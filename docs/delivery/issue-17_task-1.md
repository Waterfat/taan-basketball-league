# Issue #17 Task 1：transformStandings 補完

## 完成項目
- [x] transformStandings 補 season / phase / currentWeek / matrix 欄位
- [x] 既有 unit test 期望更新（驗 season/phase/currentWeek + 真實 teams 欄位 rank/name/history/streakType）
- [x] integration test Sheets path matrix 擴充（驗 fetchData('standings') Sheets path 也回 season/phase/currentWeek）
- [x] api.ts SHEETS_RANGES.standings 加 meta range（datas!D2:M7）

## 修改檔案
- `src/lib/api-transforms.ts` — transformStandings 改用 multi-range（[0]=戰績、[1]=meta），補 season/phase/currentWeek/teams.{rank,name,history,streakType}；新增 deriveStreakType helper
- `src/lib/api.ts` — SHEETS_RANGES.standings 從 `['datas!P2:T7']` 改為 `['datas!P2:T7', 'datas!D2:M7']`
- `tests/unit/api-transforms.test.ts` — transformStandings describe 改寫為 Issue #17 版本（2 個 it：含 meta 與 meta 缺失）
- `tests/integration/api-standings-matrix.integration.test.ts` — 末尾新增 describe（2 個 it：Sheets path 回 season/phase/currentWeek + batchGet URL 同時 encode P2:T7 + D2:M7）

## 測試結果

Task 1 範圍兩檔全跑：

```
 Test Files  1 failed | 1 passed (2)
      Tests  4 failed | 15 passed (19)
   Start at  01:42:07
```

**Task 1 範圍全 PASS**：
- `tests/unit/api-transforms.test.ts -t "transformStandings"` → 2/2 PASS（11 skipped 為其他 transformer 段）
- `tests/integration/api-standings-matrix.integration.test.ts` → 6/6 PASS（4 既有 + 2 新增 Sheets path）

**其餘 4 個 fail 不歸 Task 1**：
- `transformDragon (Issue #17) > multi-range ...` → Task 2 的 RED test
- `transformSchedule > 回傳空陣列當 ranges 為空` → Task 5 的 RED test（type 已變動）
- `transformLeaders (Issue #17) > 4-block 解析 ...` → Task 6 的 RED test
- `transformLeaders (Issue #17) > ranges 為空 → 回 {}` → Task 6 的 RED test

這些是並行 subagent 寫好的 RED 期望，由各自 transformer 實作完成後 GREEN，**不在 Task 1 修改範圍內**（系統規則禁止 Task 1 動其他 transformer）。

## 設計決策

### matrix 維持由 static JSON 補（不從 Sheets 解析）

依 plan 第 74 行指示與 GAS 端確認：
- **GAS handleStandings**（gas/Code.gs:466-488）會從另一個 sheet tab `對戰矩陣` 讀 matrix，但**前端走的是 Sheets v4 batchGet path（純粹 `datas!*` ranges）**，未涵蓋 `對戰矩陣` tab
- 前端 `js/api.js` 舊 sheetsRanges 也無 matrix 對應 range
- 結論：本 task 在 transformer JSDoc 註明 matrix 由 static JSON fallback 補，未來若要支援 Sheets path matrix，需另起 task 把 `對戰矩陣!A1:G7`（或對應 range）加進 SHEETS_RANGES

### season 採前端 SEASON 常數（=25）

GAS 端 handleStandings 從 `CONFIG.CURRENT_SEASON` 取 season，但前端 batchGet 沒有 config range 可讀，採 transformer 內部 `SEASON = 25` 常數（與 transformHome 一致）。未來換季時改此常數。

### meta range 與 transformHome 共用 datas!D2:M7

transformHome 已經消費同一 range 取 phase / currentWeek，transformer 共用同一格式（行 0 = phase、行 1 = currentWeek）；不重複佔用 sheet 區塊。

## Style Rules
無命中個人風格規則（本 task 不修 fetch 鏈路、不涉及 sticky/fixed、不新增 3+ 欄位列表）。
