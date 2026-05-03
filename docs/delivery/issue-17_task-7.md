# Issue #17 Task 7：api.ts AC-E1 — Sheets 配置正確時失敗不 fallback static

## 完成項目
- [x] `fetchData` 改寫：配置正確（`isSheetsConfigured() && hasSheetsPath`）且 Sheets 失敗 → 直接回 `source: 'error'`，不再走 static fallback
- [x] 例外情境（仍走 static）：placeholder / 未設定 SHEET_ID/API_KEY / kind 無 transformer（如 roster）
- [x] 既有 `api-fallback.integration.test.ts` 移除 4 條與新行為衝突的 case（schedule / standings / roster / dragon「Sheets 失敗 → fallback static」）
- [x] `boxscore-parse.integration.test.ts > I-9` 修復 cache 污染：beforeEach 加 `vi.resetModules()`

## 修改檔案
- `src/lib/api.ts` — `fetchData` 重構 fallback 分支邏輯，依 `sheetsConfigured && hasSheetsPath` 決定是否走 Sheets path；Sheets path 失敗直接 `source: 'error'`，不再 fallback static。新增 JSDoc 說明 Issue #17 AC-E1 行為變更與合法 static fallback 例外情境
- `tests/integration/api-fallback.integration.test.ts` — 檔頭 docstring 標註 AC-E1 行為改變；刪除 4 條衝突 case（schedule/standings/roster/dragon「Sheets 失敗 → fallback static」），保留 placeholder 情境 + 5 條兩層都失敗情境；清理因移除而 unused 的 fixture imports
- `tests/integration/boxscore-parse.integration.test.ts` — `fetchData("stats") fallback chain` describe 的 beforeEach 加 `vi.resetModules()` 避免 in-memory cache 跨 case 污染；I-8 標題修正為「Sheets 成功」、I-9 標題加 AC-E1 註記

## 測試結果

```
 Test Files  26 passed (26)
      Tests  230 passed (230)
   Start at  01:49:58
   Duration  2.19s
```

**Task 7 範圍全 PASS**：

- `tests/integration/api-no-fallback.integration.test.ts` → 5/5 GREEN（含先前 3 條 RED：standings HTTP 500、standings network throw、dragon HTTP 500）
- `tests/integration/api-fallback.integration.test.ts` → 5/5 GREEN（移除 4 條衝突 case 後剩餘 case 通過：schedule 兩層都失敗、placeholder 走 static、standings/roster/dragon 兩層都失敗）
- `tests/integration/boxscore-parse.integration.test.ts > I-9` → GREEN（cache reset 後 source 正確回 'error'）

整體 234 → 230：
- +0（api-no-fallback 5 條已存在，原 3 條 RED 變 GREEN）
- −4（api-fallback 移除 4 條衝突 case）
- 其餘維持

## 設計決策

### Sheets 配置正確 + 失敗 → 直接 error（行為改變）

依 Issue #17 AC-E1：static JSON 是賽季初範例資料（W3 例行賽前），Sheets 失敗時 fallback static 等於假裝成功，使用者會看到舊資料而非錯誤回饋。改為直接 `source: 'error'` 讓上層 `*App.tsx` 元件渲染 `<ErrorState />`（含重試按鈕）。

### 合法 static fallback 例外（保留三條件）

1. `SHEET_ID` 或 `API_KEY` 未設定（dev 本機未複製 `.env.example` 為 `.env.local`）
2. `SHEET_ID` 或 `API_KEY` 為 `REPLACE_WITH_*` placeholder
3. `SHEETS_RANGES[kind].length === 0` 或 `TRANSFORMERS[kind]` 未註冊（roster/boxscore/rotation/hof）

例外條件用 `hasSheetsPath = SHEETS_RANGES[kind].length > 0 && !!TRANSFORMERS[kind]` 顯式檢查，與 `isSheetsConfigured()` 串聯成單一守門條件。

### `fetchFromSheets` 回 null 視同 error

新邏輯下，`hasSheetsPath` 已成立才會進 Sheets path，`fetchFromSheets` 內部 guard `if (ranges.length === 0 || !transformer) return null` 理論上不會觸發，但保留防禦性處理：回 null 也視同 error 不 fallback（保持單向行為一致）。

### boxscore-parse I-9 cache 污染修復

I-9 之所以從 RED 開始就是因為前一個 case I-8 跑 `fetchData('stats')` 成功 setCache → I-9 從 cache 命中回 `source: 'sheets'` 而非預期的 'error'。其他 integration test（如 api-cache、api-leaders-extended）都 `vi.resetModules()` 避開此問題；boxscore-parse 漏加，本 task 補上。

### api-fallback test 4 條 case 移除（非標 deprecated）

Plan 提供「@deprecated 註記或刪除」兩選項，採刪除（並在原位置留 1 行註解指引到 api-no-fallback test）以避免測試 runner 跑到行為已過時的 assertion，且 git history 可追溯刪除原因。

## Style Rules

### style-skeleton-loading（命中原因：本 task 修改 src/lib/api.ts 的 fetch 鏈路）

本 task 修改範圍純資料層 fallback 邏輯（`fetchData` 的分支條件與錯誤回傳值），不涉及 UI loading state 新增。

依 plan 第 1156-1158 行 Style Rules section 指示：
- 各頁面 `*App.tsx` 已採「方式二：元件內 skeleton state」（status === 'loading' → `<SkeletonState />`），本 task 不需新增 skeleton
- 本 task 改變的是「Sheets 失敗時」的 final 狀態：從「假裝成功（fallback static 顯示舊資料）」改為「`<ErrorState />` 含重試按鈕」
- ErrorState 已存在於 `src/components/{home,roster,standings,schedule,boxscore}/ErrorState.tsx`，本 task 不新增元件，只改 `fetchData` 行為讓 ErrorState 真正被觸發

trigger 命中但行為僅在資料層；UI 層的 ErrorState 觸發已由 `*App.tsx` 既有的 `result.source === 'error'` 條件處理，不需後續 UI 改動。
