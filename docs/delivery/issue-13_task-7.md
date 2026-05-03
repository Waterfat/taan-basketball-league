# Issue #13 Task 7: 補 A2/A3 E2E asserts

## 目標
在 standings + boxscore 既有 E2E spec 補上 A2/A3 順帶驗收的斷言：
- E-5：standings 「最近 6 場」欄位有 ○✕
- E-6：boxscore 「逐場 Box」分頁有比分

## 要修改/新增的檔案
- Modify: `tests/e2e/features/standings.spec.ts`（補 E-5 assert）
- Modify: `tests/e2e/features/boxscore/*.spec.ts`（找對應分頁的 spec，補 E-6 assert）

## Plan 引用
`docs/specs/plans/2026-05-03-issue-13-data-source-migration.md` 的 **Task 7：補 A2/A3 E2E assertions**。

## 相依
- T4（mock-api SHEETS_PATTERN 切換）✅ commit `5f8e78a`

## Coverage
- E-5：A2 順帶驗收 — 「最近 6 場」欄位有 ○✕（若仍空白拆 issue）
- E-6：A3 順帶驗收 — 「逐場 Box」分頁有比分（若仍空白拆 issue）

## 注意事項
- Issue 範圍：本 task 只補 assertion，不修 UI 元件渲染邏輯
- 若 assertion FAIL（即元件沒渲染對應內容）→ 不在本 Issue 修，標記為「⬇️ 需另開 issue 處理版面」
- 即使 FAIL，也要保留 assertion 留下證據（給後續 issue 接手）

## Style Rules
無命中

## 執行記錄

### Attempt 1
- **狀態**：完成
- **修改檔案**：
  - `tests/e2e/features/standings.spec.ts`（在 AC-1 test 末尾補 E-5 assertion）
  - `tests/e2e/features/boxscore/boxscore-tab/game-cards.spec.ts`（新增 E-6 test「逐場 Box 分頁載入時顯示該週比分」）
- **元件 testid 探索結果**：
  - standings：`data-testid="history"` + `data-testid="history-dot"`（with `data-result` attr）— `src/components/standings/StandingsRow.tsx`
  - boxscore：`data-testid="bs-game-card"` + `data-testid="bs-game-title"`（內含 `home X vs Y away` 比分文字）— `src/components/boxscore/BoxscoreGameCard.tsx`
  - 注意：plan 範例的 `?tab=games` 不正確，實際分頁名為 `?tab=boxscore`（已修正）

#### E2E 結果

**E-5（standings AC-1 / 最近 6 場 ○✕）：PASS**
```
✓ AC-1: Hero「STANDINGS · 例行賽」+「第 25 季 · 第 5 週」+ 6 隊戰績榜（features + features-mobile）
```
A2 順帶驗收成立 — fixture 提供 6 場 history，UI 渲染 6 個 history-dot，無需另開 issue。

**E-6（boxscore 逐場 Box 比分）：FAIL — A3 元件待處理**

整個 game-cards.spec.ts（含原本 PASS 的 AC-4 / AC-4b）全部 FAIL，page snapshot 顯示「無法載入逐場數據」。
根因：`src/lib/boxscore-api.ts` 走獨立路徑（直打 Sheets v4 `values.get`），在 E2E 環境缺 `PUBLIC_SHEET_ID` / `PUBLIC_SHEETS_API_KEY` env 時直接 error，未走 `fetchBoxscore` mock。
- 不在 Task 7 範圍內（不能修 src/、不能修 mock-api、不能改 fixture）
- assertion 已 commit 留下證據（依 plan「FAIL 仍 commit」原則）
- ⬇️ A3 元件渲染（boxscore E2E 在 mock 環境跑通）待另開 issue 處理


