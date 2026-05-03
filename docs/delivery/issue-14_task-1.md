# Issue #14 Task 1 — 型別 + 資料層擴充

**Goal**：擴充 `src/types/` 與 `public/data/*.json`，讓 fetcher 從 JSON path 取得時能拿到完整新資料。讓 integration test（I-1, I-2）從 RED → GREEN。

**Files**：
- `src/types/leaders.ts` — 加 5 類 + offense/defense/net + LEADER_CATEGORIES_ORDERED
- `src/types/standings.ts` — 加 MatrixCell + MatrixData
- `src/types/home.ts` — 加 MatchupCombo / MatchupGame / WeekMatchups
- `public/data/standings.json` — matrix.results 改為實際淨勝分（與 fixture 對齊）
- `public/data/leaders.json` — 11 類 + 三表完整 stub
- `public/data/home.json` — 加 weekMatchups
- `public/data/dragon.json` — 加 rulesLink

## Steps
- [x] 擴充 leaders / standings / home 型別
- [x] 更新 standings / leaders / home / dragon JSON
- [x] tsc --noEmit 通過
- [x] integration test green（I-1 + I-2）

## Style Rules
N/A（純資料層，無 UI）

## Acceptance
- TypeScript 型別檢查通過
- `tests/integration/api-standings-matrix.integration.test.ts` 全綠
- `tests/integration/api-leaders-extended.integration.test.ts` 全綠
