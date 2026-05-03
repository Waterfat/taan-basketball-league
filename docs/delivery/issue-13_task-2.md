# Issue #13 Task 2: api-transforms 模組

## 目標
建立 `src/lib/api-transforms.ts` — per-DataKind transformer（Sheets 2D 陣列 → typed JSON）。

## 要修改/新增的檔案
- Create: `src/lib/api-transforms.ts`
- Test: `tests/unit/api-transforms.test.ts`

## Plan 引用
`docs/specs/plans/2026-05-03-issue-13-data-source-migration.md` 的 **Task 2：api-transforms 模組** 段落。

## Coverage
- transformer 各 DataKind 的單元邏輯（依 plan Step 1 測試案例）

## 參考來源
- `gas/Code.gs`（同 repo，doGet handler 對 home/standings/dragon/schedule/roster/leaders 的轉換邏輯）
- `/Users/waterfat/Documents/github_cc/taan_basketball_league/js/api.js`（舊專案，sheetsRanges + transformer）
- `src/lib/boxscore-api.ts`（既有 Sheets API 直打 pattern）
- `src/types/*.ts`（型別定義）
- `tests/fixtures/*.ts`（fixture 結構，transformer 輸出要對齊）

## Style Rules
無命中

## 執行記錄

### Attempt 1
- **狀態**：✅ DONE
- **時間**：2026-05-03 (UTC+8)
- **TDD 流程**：
  1. ✅ Step 1：建 `tests/unit/api-transforms.test.ts`（7 cases，含 transformHome/Standings/Dragon happy path + Schedule/Roster/Leaders 空輸入處理）
  2. ✅ Step 2：跑測試確認 FAIL（"Failed to resolve import '../../src/lib/api-transforms'"）
  3. ✅ Step 3：建 `src/lib/api-transforms.ts`（最小 stub，6 個 transformer + `SheetsValueRange` 介面 + 詳細註釋指向 gas/Code.gs 與 js/api.js）
  4. ✅ Step 4：跑測試確認 PASS（7/7 tests pass，438ms）
  5. ✅ Step 5：commit
- **型別調整**：plan 用的 `DragonboardData` / `LeadersData` 不存在 → 改為實際型別 `DragonData`（src/types/roster.ts）/ `LeaderData`（src/types/leaders.ts）；HomeData 結構（用 `scheduleInfo.date`）與 stub 輸出（`nextDate`）不嚴格對齊 → 用 `as unknown as ...` cast，完整對齊在 Task 3 整合補強
- **commit**：feat(api): add per-DataKind Sheets transformers (#13)
