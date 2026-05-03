# Issue #17 Task 6: transformLeaders 完整 4-block 解析

## 目標
將 `transformLeaders` 從 stub 改寫為完整 4-block 解析（個人類別表 + offense / defense / net 三張隊伍表），並啟用 `leaders` / `stats` 的 Sheets API path（4 個 ranges）。

## 修改檔案
- Modify: `src/lib/api-transforms.ts`
  - 新增 `CATEGORY_MAP`（中文類別名 → LeaderSeason 欄位）
  - `transformLeaders`：4-block 解析（leadersTable / teamOffense / teamDefense / teamNet）
  - 產出 shape 由舊 `{ season, leaders[], teamOffense[], teamDefense[], teamNet[] }` 改為符合型別 `Record<seasonKey, LeaderSeason>`（key = `'25'`）
  - 新增 helper `parseTeamBlock`：第 0 列 = headers / 第 1..N 列 = 各隊資料
  - import 補 `LeaderEntry, LeaderSeason, TeamLeaderTable`
- Modify: `src/lib/api.ts`
  - `SHEETS_RANGES.leaders` 與 `SHEETS_RANGES.stats` 啟用 multi-range：
    `['datas!D212:N224', 'datas!D227:K234', 'datas!D237:K244', 'datas!D247:K254']`
  - `TRANSFORMERS.leaders` / `TRANSFORMERS.stats` 共用 `transformLeaders`
  - 註解更新：刪掉 leaders/stats 在「暫走 static」清單，加入「完整啟用 Sheets path」清單
- Modify: `tests/unit/api-transforms.test.ts`
  - 擴充 `transformLeaders` describe：新增 4-block 解析 happy path 測試，覆蓋 scoring/rebound/assist + offense/defense/net 三張 6 隊表
  - 新增空 ranges → `{}` 的契約測試
- Modify: `tests/integration/api-leaders-extended.integration.test.ts`
  - 末尾新增 `Sheets path 4-block 解析（Issue #17）` describe
  - mock `sheets.googleapis.com`，驗 `fetchData('stats')` Sheets path 回出 offense/defense/net 各 6 列

## Plan 引用
`docs/specs/plans/issue-17-data-sync-fix.md` 第 907-1125 行「## Task 6：transformLeaders 完整 4-block 解析」

## Coverage
- I-6（B-27）：transformLeaders 完整解析 4 個 range
  - Unit：`tests/unit/api-transforms.test.ts > transformLeaders (Issue #17)`（2 cases）
  - Integration：`tests/integration/api-leaders-extended.integration.test.ts > Sheets path 4-block 解析（Issue #17）`（1 case）

## Style Rules
- **style-skeleton-loading**：本 task 純資料層（transformer + SHEETS_RANGES），未新增任何 UI / component / loading state，故無 skeleton 缺口可補。E-8a / E-8b 對應的前端 UI 由其他 task 負責，本 task 無命中。

## 執行記錄

### Attempt 1
- **狀態**：DONE
- **執行時間**：2026-05-04
- **執行步驟**：
  1. 讀 plan + qaplan + Code.gs handleStats + types/leaders.ts + 既有 tests
  2. 擴充 `tests/unit/api-transforms.test.ts` 中 `transformLeaders` describe（4-block happy path + 空 ranges）
  3. 擴充 `tests/integration/api-leaders-extended.integration.test.ts`（末尾加 Sheets path describe）
  4. 改寫 `src/lib/api-transforms.ts`：`transformLeaders` 從 stub 升級為完整 4-block 解析；補 `CATEGORY_MAP` + `parseTeamBlock` helper
  5. 修 `src/lib/api.ts`：`SHEETS_RANGES.leaders` / `SHEETS_RANGES.stats` 改為 4 ranges；註冊 `TRANSFORMERS.leaders` / `TRANSFORMERS.stats`
  6. 跑驗證指令確認 PASS
- **驗證指令**：
  ```bash
  npx vitest run tests/unit/api-transforms.test.ts tests/integration/api-leaders-extended.integration.test.ts
  ```
- **驗證結果**：
  - `transformLeaders` unit tests：2/2 PASS（4-block 解析 + 空 ranges 契約）
  - `api-leaders-extended.integration` 全檔：5/5 PASS（既有 4 + 新 1）
  - 整體：22 tests，3 failures 全部屬於 `transformHome (Issue #17)`（Task 4 範圍，非本 task）

## 設計決策

### CATEGORY_MAP 為何放本檔內常數
`transformLeaders` 是唯一使用者，不需 export。其他 transformer 不會用到中文類別名→欄位的對映。常數放檔內可避免污染外部 namespace。

### LeaderData shape 改變（破壞性）
舊 stub 回傳 `{ season, leaders[], teamOffense[], teamDefense[], teamNet[] }` 是錯誤的型別假設（與 `LeaderData = Record<string, LeaderSeason>` 不符）。Plan 指定改為正確 shape `{ '25': LeaderSeason }`，呼叫端會看到完整 LeaderSeason（含 11 個個人類別 optional + offense/defense/net 三張表）。

### 為何 leaders 與 stats 共用 transformer
GAS 端 `handleStats` 是同一份資料源，前端兩個 DataKind 對應的 Sheets ranges 相同。共用 transformer 避免重複實作；fixture 與 leaders-format.ts 也已採此假設。

### 容錯設計
- 個人類別 row 第一欄不在 CATEGORY_MAP（如賽季初空表 / 額外標記列）→ 跳過
- `parseFloat(v) || 0` 處理「空字串 / NaN」
- ranges 為空 → 回 `{}`，由 fetchData 走 fallback static path（與 plan 指定一致）
- `parseTeamBlock` 對空 block 回 `{ headers: [], rows: [] }`，下游 UI 走 EmptyState
