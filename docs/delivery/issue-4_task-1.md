# Issue #4 Task 1: 型別 + transformBoxscore + computeTeamTotals + Unit Tests

## 目標
產出 `BoxscoreData/Week/Game/Team/Player` 型別定義，與沿用舊專案 page-boxscore.js 邏輯的 `transformBoxscore(rows: string[][]): BoxscoreWeek[]` 解析器及 `computeTeamTotals(players)` 加總函式（排除 DNP）。

## 要修改/新增的檔案
- Create: `src/types/boxscore.ts`
- Create: `src/lib/boxscore-utils.ts`
- Test: `tests/unit/boxscore-utils.test.ts`
- Test (existing, turn red→green): `tests/integration/boxscore-parse.integration.test.ts` (cases I-1~I-4)

## 驗收標準（來自 qaplan / plan）
- [ ] U-1a~e: 22 行/場偏移、多場、跨週、空、殘缺
- [ ] U-2a~d: totals 純出賽、含 DNP、全 DNP、空陣列
- [ ] I-1: 解析單場
- [ ] I-2: 多場合併
- [ ] I-3: DNP 不計入合計
- [ ] I-4: 空 rows → 空 weeks

## Style Rules
無命中（純型別 + 解析邏輯，不涉及 UI）

## 執行記錄

### Attempt 1

**進度：DONE ✓**

**Step 1: Unit Test**
- 按 plan 樣板（第 198~306 行）建立 `tests/unit/boxscore-utils.test.ts`
- 包含 U-1a~e（transformBoxscore 5 個 case）+ U-2a~d（computeTeamTotals 4 個 case）
- 共 9 個單元測試

**Step 2: 確認失敗**
- 測試失敗如預期：`Cannot find module '../../src/lib/boxscore-utils'`

**Step 3: 實作型別**
- 建立 `src/types/boxscore.ts`，包含 TeamId / BoxscorePlayer / BoxscoreTotals / BoxscoreTeam / BoxscoreGame / BoxscoreWeek / BoxscoreData
- 完全按 plan 樣板（第 320~368 行）抄寫

**Step 4: 實作工具函式**
- 建立 `src/lib/boxscore-utils.ts`，包含：
  - `parsePlayerRow()` - 解析球員行
  - `computeTeamTotals()` - 排除 DNP 後加總
  - `parseStaffRow()` - 解析場邊人員行
  - `parseTitleRow()` - 解析比賽標題行
  - `parseGameChunk()` - 解析 22 行一場的遊戲塊
  - `transformBoxscore()` - 主解析函式，分組週次
- 完全按 plan 樣板（第 372~552 行）抄寫

**Step 5: 測試驗證**

*Unit Tests*
```
Tests: 9 passed (9)
 ✓ U-1a: 22 行/場偏移正確（單場）→ 解析出 home/away 雙隊
 ✓ U-1b: 多場（同週 6 場）依 22 行 chunking 解析全部
 ✓ U-1c: 跨週合併（W1 + W5 兩週）→ 依 week 分組
 ✓ U-1d: 空列陣 → 空 weeks
 ✓ U-1e: 不足 22 行的尾段（殘缺）→ 略過不報錯
 ✓ U-2a: 純出賽球員 → 加總所有欄位
 ✓ U-2b: 含 DNP 球員 → DNP 不計入合計
 ✓ U-2c: 全 DNP → 合計全 0
 ✓ U-2d: 空陣列 → 全 0 totals
```

*Integration Tests (I-1~I-4)*
```
Tests: I-1~I-4 passed (4)
 ✓ I-1: 解析 22 行/場 raw rows → 正確的 BoxscoreGame 結構
 ✓ I-2: 多場合併 raw rows → 解析回各場各週分組
 ✓ I-3: DNP 球員應被標記 dnp=true 且不計入合計
 ✓ I-4: 空 rows 陣列 → 回傳空 weeks
```

（I-5~I-10 預期失敗，屬 Task 5+/fetchBoxscore 範圍）

**Step 6: TypeScript Check**
- `npx tsc --noEmit` 通過，無型別錯誤

**Step 7: Commit**
```
git add src/types/boxscore.ts src/lib/boxscore-utils.ts tests/unit/boxscore-utils.test.ts
git commit -m "feat(boxscore): add types + transformBoxscore parsing utility (Issue #4 Task 1)"
```
Commit hash: `e6e8814`

**備註**
- 為支援 integration 測試編譯，額外建立 `src/lib/boxscore-api.ts`（stub），但未納入本 commit，留待 Task 5 實作
- 所有實作代碼完全按 plan 樣板，零自動簡化或省略
