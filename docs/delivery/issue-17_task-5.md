# Issue #17 Task 5：transformSchedule 完整 zip → weeks[]

## 完成項目
- [x] transformSchedule 改寫：對 dates / allSchedule / allMatchups 三組做 zip → allWeeks[]（GameWeek 完整欄位）
- [x] 同步建立 weeks Record（以週次字串為 key）給舊 UI 用
- [x] currentWeek 邏輯：第一個含 status=upcoming 的週；全 finished 則最後一週
- [x] 空 ranges → 回傳結構化空容器（allWeeks: [], weeks: {}, currentWeek: 1）
- [x] api.ts SHEETS_RANGES.schedule 啟用 multi-range（dates / allSchedule / allMatchups）
- [x] api.ts TRANSFORMERS 註冊 schedule → transformSchedule
- [x] tests/unit/api-transforms.test.ts transformSchedule describe 擴充：1 個 happy path（zip）+ 1 個空輸入

## 修改檔案
- `src/lib/api-transforms.ts` — transformSchedule 從 stub 改為完整 zip 實作（GAMES_PER_WEEK = 3，依 plan 第 822-875 行）
- `src/lib/api.ts` — SHEETS_RANGES.schedule 從 `[]` 改為 `['datas!P13:AG13', 'datas!D87:N113', 'datas!D117:F206']`；TRANSFORMERS 加入 schedule
- `tests/unit/api-transforms.test.ts` — transformSchedule describe 改為 Issue #17 版（2 個 it：zip + 空輸入）

## 測試結果

Task 5 範圍 transformSchedule 段全 PASS：

```
$ npx vitest run tests/unit/api-transforms.test.ts -t "transformSchedule"

 Test Files  1 passed (1)
      Tests  2 passed | 15 skipped (17)
   Duration  327ms
```

全檔層級（含其他並行 RED）：

```
 Test Files  1 failed (1)
      Tests  5 failed | 12 passed (17)
```

**5 個 fail 不歸 Task 5**：
- `transformHome (Issue #17) > standings 帶出 streakType` → Task 4 的 RED test（transformHome composite 待補）
- `transformDragon (Issue #17) > multi-range ...` → Task 2 的 RED test
- `transformLeaders (Issue #17) > ...` × 2 → Task 6 的 RED test
- `transformRoster (Issue #17) > ...` 部分 → Task 3 的 RED test

這些由各自 task 完成後 GREEN，不在 Task 5 修改範圍內。

## 設計決策

### GAMES_PER_WEEK = 3（本 issue 範圍）

依 plan 第 828 行明定 `GAMES_PER_WEEK = 3`，對 Sheets multi-range 結構（每週 3 列）執行 zip。GAS handleSchedule 雖支援動態週次數（依 metaRows），但前端走 v4 batchGet path 採固定 3 場/週的 zip 切片邏輯（與舊 js/api.js 一致）。

### currentWeek 邏輯

依 plan 第 871 行：
- 第一個含 `status=upcoming` 比賽的週 → 該週 index + 1
- 全 finished → `Math.max(allWeeks.length, 1)`（避免空陣列回傳 0）

### weeks Record 與 allWeeks 並存

`ScheduleData.weeks` 為 `Record<string, GameWeek>`（optional），給舊 UI（如 RosterTabPanel WeekHeaderRow）以週次字串為 key 直接查；`allWeeks` 為主要 array 給 schedule-utils 走 find / iterate。兩者由 transformer 同時產生，避免下游元件重新組裝。

### 空輸入回傳結構正規化

舊 stub 回傳 `weeks: []`（型別偽裝為 array），改為符合型別 `weeks: {}`、`allWeeks: []`，避免下游 `.find` / `.map` 對 array/Record 混淆。對應 unit test 期望從 `expect(weeks).toEqual([])` 改為 `expect(weeks).toEqual({})`（plan 原文 `[]` 與其 impl `{}` 不一致，採 type-correct 版）。

### dates 欄為空 / 對應 schedule rows 無資料 → 跳過該週

實作中 `if (!date) continue;` 與 `if (games.length === 0) continue;` 確保 dates 一橫列若有空欄、或 allSchedule 列數不足以填滿該週，該週不進 allWeeks（避免 placeholder 空週污染畫面）。

## Style Rules

依任務說明本 task 修改 `src/lib/api.ts` SHEETS_RANGES['schedule'] → 命中 style-skeleton-loading（同 task 4 處理方式）。本 task 純擴充 SHEETS_RANGES + TRANSFORMERS 註冊，未動 fetch 鏈路 / loading UI；style-skeleton-loading 規則於 Task 4 處理範圍內，本 task 不重複實作。
