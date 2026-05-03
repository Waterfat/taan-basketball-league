# Issue #14 Task 2 — matchups-toggle-utils

**Goal**：建立共用切換 utility，供 B1（home）+ B7（schedule）兩個 toggle 使用。

**Files**：
- `src/lib/matchups-toggle-utils.ts`（新）
- `tests/unit/matchups-toggle-utils.test.ts`（新）

**Plan reference**：見 `docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 2 段落

## Acceptance
- 新檔含 `resolveDefaultView(weekMatchups)` / `parseViewQuery(search)` / `updateViewQuery(view)` 三個 export
- 對應 unit test：U-101（parseViewQuery）+ U-102（resolveDefaultView 三情境：games 全空 / games 有 / weekMatchups undefined）
- `npm test -- tests/unit/matchups-toggle-utils.test.ts` 全綠

## Style Rules
N/A（utility 無 UI）

## Result

- 新增 `src/lib/matchups-toggle-utils.ts`（`MatchupView` type + `resolveDefaultView` / `parseViewQuery` / `updateViewQuery` 三個 export，`updateViewQuery` 含 SSR guard）
- 新增 `tests/unit/matchups-toggle-utils.test.ts`，cover U-101（4 個 parseViewQuery 斷言）+ U-102（games 全空 / games 有 / undefined 三情境）
- `npx tsc --noEmit -p tsconfig.json` → exit 0
- `npm test -- tests/unit/matchups-toggle-utils.test.ts` → **4 passed (4)**，Test Files 1 passed
- 無 deviation：實作 / 測試案例命名 / docstring 標籤皆與 `docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 2 程式碼範例一致
