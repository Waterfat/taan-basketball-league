# Issue #17 Task 2 — transformDragon 補完 season/phase + civilianThreshold + DragonTabPanel 分組對齊

**Goal**：把 `transformDragon` 從寫死 `civilianThreshold: 36` 改為從 Sheets 動態讀取，補齊 `season` / `phase` / `columns` / `rank` / `tag`；並把 `DragonTabPanel` group title 中的 N 改為實際 `civilians.length`（與分數線 `civilianThreshold` 解耦）。

**Plan reference**：`docs/specs/plans/issue-17-data-sync-fix.md` 第 241-392 行（Task 2）

**QA coverage**：I-2（B-6, B-7）+ U-1（B-7）+ E-2 / E-3（由 Phase 6 e2e 改寫驗證）

## 完成項目

- `transformDragon` 從單 range 改為 multi-range（players / meta / threshold-cell），缺失 threshold cell 時 fallback 36（向後相容 Issue #13）
- DragonData 完整欄位產出：`season` / `phase` / `civilianThreshold` / `columns` / `players[].rank` / `players[].tag`
- `DragonTabPanel` group title 改為以 `civilians.length` 為 N：「前 N 名」/「第 N+1 名起」
- `civilian-divider` 文案維持以 `civilianThreshold` 顯示「{N} 分」（分數線本身的視覺意義保留，與分組標題的 N 解耦）
- title / divider label 改用 template literal 預先計算字串，避免 React SSR 在 `{number}` 與文字之間插入 `<!-- -->` 註解（讓 e2e / unit `toContain` 直接斷言完整字串）

## 修改檔案

- `src/lib/api-transforms.ts`：`transformDragon` 重寫為 multi-range（含完整 JSDoc 標明 ranges[0..2] 對映 + season/phase/civilianThreshold 產出規則 + tag 預設 null 原因）
- `src/components/roster/DragonTabPanel.tsx`：title 改為 `civilians.length` + 字串預先計算（避免 SSR 註解噪音）
- `tests/unit/api-transforms.test.ts`：新增 `describe('transformDragon (Issue #17)')` 段落，2 個 it（multi-range happy path + threshold cell 缺失 fallback 36）
- `tests/unit/dragon-components.test.ts`：新增 `describe('DragonTabPanel — group title N === civilians.length (Issue #17, Covers: U-1)')`，1 個 it 用 `mockDragonGroupingShowcase`（threshold=10、5 civilians）斷言 `前 5 名` / `第 6 名起` / `平民線（10 分）` 三段文案

## 測試結果

```
npx vitest run tests/unit/api-transforms.test.ts -t "transformDragon"
→ Test Files  1 passed (1)
  Tests  4 passed | 13 skipped (17)

npx vitest run tests/unit/dragon-components.test.ts
→ Test Files  1 passed (1)
  Tests  11 passed (11)
```

`api-transforms.test.ts` 整檔有 5 個 RED 失敗（`transformHome (Issue #17)` 3 個 / `transformLeaders (Issue #17)` 2 個），都是 task 4（I-4 home composite）+ task 6（I-6 leaders 4-block）的 RED 測試，**不在 task 2 範圍**，由對應 task 補齊實作後轉 GREEN。

## 設計決策

- **threshold range 來源**：plan 第 253 行允許「若 Sheets 端無單一 threshold cell」採 fallback 36。實作層面留 `ranges[2]` slot 給後續 `api.ts SHEETS_RANGES.dragon` 擴 multi-range（task 7）；fallback 邏輯確保即使 ranges 只給 1 段（既有 Issue #13 行為）也不破壞舊呼叫。
- **N === civilians.length（不是 threshold）**：plan 第 253 行核心要求「N 必須等於 `civilians.length`」。group title 的 N 改為實際分組人數；divider 文案中「{threshold} 分」保留，因為「分數線」本身仍是以 threshold 數值為分界（語意：N 代表「人」、threshold 代表「分」）。
- **tag 預設 null**：Sheets `datas!D13:L76` row 結構（9 欄）沒有 tag column，GAS handleDragon 是從另一個「標籤」column 讀。前端 batchGet 暫無對應 range，預設 null。實際 tag 顯示由 fallback static JSON 提供。
- **季號 SEASON=25 常數**：與 task 1（transformStandings）一致，前端 batchGet 路徑無 config range；GAS 端從 `CONFIG.CURRENT_SEASON` 取，但前端走 Sheets v4 直連，採前端常數。
- **避免 React SSR `<!-- -->` 註解**：title 改用 template literal 在 JSX 外預先 join 成單一字串，讓 `expect(html).toContain('前 5 名')` 直接命中。

## Style Rules

- N/A（無 fetch 鏈路、無 sticky/fixed、無 3+ 欄位列表 → style-skeleton-loading 不命中）
- 無 hardcode 色碼、無 inline style 寫死數值（threshold 數值 36 為合法 fallback 常數，與設計 token 無關）
