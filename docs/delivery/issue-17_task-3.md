# Issue #17 Task 3: transformRoster 完整 6-team 切分

## 目標
把 `transformRoster` 從 Task 2 stub（回 `{ season, teams: [] }`）改為「完整解析 `datas!O19:AH83` flat 球員列、依 `teamId` 分組成 6 隊、解析 weeks header、處理 att 值多型」，符合 `RosterData = { weeks, teams }` 型別契約。

## 要修改/新增的檔案
- Modify: `src/lib/api-transforms.ts`（transformRoster 改寫 + 新增 `parseAttCell` helper + import `AttValue / RosterTeam / RosterWeek` 型別）
- Modify: `tests/unit/api-transforms.test.ts`（transformRoster describe 擴充 3 個 case）

## Plan 引用
`docs/specs/plans/issue-17-data-sync-fix.md` 第 393-527 行 **Task 3：transformRoster 完整 6-team 切分 + season/phase**。

## 設計決策（plan 第 421-431 行）
- 本 Issue 不擴 `RosterData` 型別補 `season` / `phase`，型別維持 `{ weeks, teams }`。
- AC-4 hero phase 修復改由 RosterHero 元件透過另一 API kind（home meta）取得，**不在 Task 3 範圍**。
- 與 plan 範例不同：plan 假設「block 起始列以 cell0='紅' 表示換隊」，但 GAS `handleRoster()`（Code.gs line 206-260）實際輸出為 **flat row** 格式（每列一個球員，前 3 欄為 `name / teamName / teamId`，第 4 欄起為 att 值），靠 `row[2]` teamId 分組。實作以 GAS 實際格式為準。

## 相依
- Task 2（transformDragon Issue #17 擴充）：獨立並行任務，狀態待確認；不阻塞本 task。
- Task 1（transformStandings Issue #17 擴充）：獨立並行任務；不阻塞本 task。
- Task 7（api.ts SHEETS_RANGES 啟用 6 kind）：本 task 完成後才能跑 Sheets path 的 e2e。

## Coverage
- I-3（B-13）：transformRoster 完整 6 隊切分 → 由 `tests/unit/api-transforms.test.ts > transformRoster (Issue #17)` 3 個 case 驗收

## Style Rules
無命中（純資料層 transformer，不涉 fetch / sticky / 列表元件）。

## 執行記錄

### Attempt 1
- **狀態**：✅ DONE
- **TDD 步驟**：
  1. **RED**：擴充 `tests/unit/api-transforms.test.ts` 的 `transformRoster` describe：
     - case 1：`ranges 為空 → weeks: [], teams: []`
     - case 2：`6-team 切分 + att 陣列`（驗 weeks header 解析、6 隊順序、att 多型 1/0/'x'/'?'）
     - case 3：`att 空格解析為 "?"`
     - 跑 `npx vitest run tests/unit/api-transforms.test.ts` → 3/3 RED（既有 stub 回 `{ season, teams: [] }`，無 weeks 欄位）
  2. **GREEN**：改寫 `src/lib/api-transforms.ts > transformRoster`：
     - `import type { AttValue, RosterTeam, RosterWeek }` from `../types/roster`
     - 空 ranges → `{ weeks: [], teams: [] }`（移除 `season` cast，符合 `RosterData` 真實型別）
     - 第一列為 header：前 3 欄固定 `[球員姓名, 隊伍, 隊伍ID]`，第 4 欄起以 regex `/第(\d+)週\s*([\d/]+)?/` 解析成 `RosterWeek[]`
     - 後續每列為球員：`row[0]` name、`row[1]` teamName、`row[2]` teamId
     - 用 `Map<string, RosterTeam>` + `teamOrder: string[]` 維持讀入順序分組
     - 每列 att：`for (c = 3; c < 3 + weeks.length; c++)` 呼叫 `parseAttCell(row[c])`
     - 新增 `parseAttCell(v): AttValue` helper：`'1'/'true' → 1`、`'0'/'false' → 0`、`'x' → 'x'`、其他/空 → `'?'`
     - 過濾全空列 (`row.every((c) => !c)`) 與缺 name/teamId 的列
  3. **驗證**：
     - `npx vitest run tests/unit/api-transforms.test.ts -t "transformRoster"` → **3/3 PASS**（8 skipped 為其他 describe）
     - `npx vitest run tests/unit/api-transforms.test.ts` → 10/11 PASS（剩 1 fail 為 `transformDragon (Issue #17)`，屬 Task 2 範圍，不在本 task scope）
     - `npx tsc --noEmit` → 本 task 修改的兩檔 0 error（既有 `tests/unit/error-empty-states.test.ts` 1 個無關 ts error）
- **檔案改動量**：
  - `src/lib/api-transforms.ts`：+97 / -8 行
  - `tests/unit/api-transforms.test.ts`：transformRoster describe +69 行（取代原 5 行 stub）
- **驗證指令輸出**：
  ```
  Test Files  1 passed (1)
  Tests       3 passed | 8 skipped (11)
  Duration    322ms
  ```
- **未涉及範圍**（守住 task 邊界）：
  - 未動 `src/lib/api.ts`（SHEETS_RANGES.roster 仍為 Task 7 範圍）
  - 未動 `src/types/roster.ts`（型別維持原樣）
  - 未動 `tests/fixtures/roster.ts`（fixture 不變）
  - 未碰其他 transformer（transformDragon Issue #17 fail 為 Task 2 範圍）
