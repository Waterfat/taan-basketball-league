# Issue #3 QA Plan — /standings 戰績榜頁面

**Issue**: [L] feature: /standings 戰績榜頁面實作
**Worktree**: `../taan-basketball-league-issue-3`
**Platforms**: Web（Astro 6 + Tailwind 4 + React island）
**E2E 工具**：Playwright（regression + features projects）
**Dispatch payload 摘要**：integration_tests=`@api-fallback @standings`，e2e_tests=`@standings`

## 平台偵測
- Web ✅（Astro multi-page，已有 `/schedule` page 範例可複用 island pattern）
- TG Bot：無
- Native App：無

## Fixture Inventory

| Entity | 既有檔 | 新增檔 | 4-action |
|--------|-------|-------|---------|
| ScheduleData | `tests/fixtures/schedule.ts` | — | 直接用（沿用 #1 補的 helper / 工廠）|
| **StandingsData** | — | `tests/fixtures/standings.ts` | **補**（含 `mockFullStandings`、`mockEmptyStandings`、`mockZeroRecordStandings`、`mockEightTeamStandings`）|
| Mock API helper | `tests/helpers/mock-api.ts`（單一 `mockScheduleAPI`）| 同檔加 `mockStandingsAPI` | **修改**（向後相容：`mockScheduleAPI` 簽章不變）|

### Refactor Backlog
- `mockKindAPI<T>` 私有底層已抽出，未來新增 `roster` / `boxscore` API 可直接複用，不再列為 backlog。

### Deprecated scan
- `tests/checklists/e2e.md` 不存在（已廢棄目錄；本 Issue 無遷移需求）。
- `tests/e2e/issues/` 不存在。

## AC 行為抽取

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|------------|------|------|-----|------|------|
| E-1 | B-1 | Hero header 顯示「STANDINGS」+「例行賽」+「第 25 季 · 第 5 週」+ 6 隊 | e2e | ❌→已補寫 | `tests/e2e/features/standings.spec.ts` `AC-1` |
| E-2 | B-2 | 每列含 7 欄位（rank/dot+name/wins/losses/pct/history×6/streak） | e2e | ❌→已補寫 | `standings.spec.ts` `AC-2` |
| E-3 | B-3 | 連勝隊伍 streak → `data-streak-type=win` + ↑ icon | e2e | ❌→已補寫 | `standings.spec.ts` `AC-3` |
| E-4 | B-4 | 連敗隊伍 streak → `data-streak-type=lose` + ↓ icon | e2e | ❌→已補寫 | `standings.spec.ts` `AC-4` |
| E-5 | B-5 | history 圓點：W → 隊伍主色、L → 灰色（`data-result` 屬性） | e2e | ❌→已補寫 | `standings.spec.ts` `AC-5` |
| E-6 | B-6 | 點擊隊伍列 → 導向 `/roster?team=<id>` | e2e | ❌→已補寫 | `standings.spec.ts` `AC-6` |
| E-7 | B-7 | rank 順序 = 後台給的順序（前端不重排） | e2e | ❌→已補寫 | `standings.spec.ts` `AC-7` |
| E-8 | B-8 | RWD mobile：6 張卡片垂直堆疊 | e2e | ❌→已補寫 | `standings.spec.ts` `AC-8 (regression-mobile)` |
| E-9 | B-9 | RWD desktop：橫排表格 6 列 | e2e | ❌→已補寫 | `standings.spec.ts` `AC-9 (regression desktop)` |
| E-10 | B-10 | Loading → skeleton（hero 灰塊 + 6 列灰塊） | e2e | ❌→已補寫 | `standings.spec.ts` `AC-10` |
| E-11 | B-11 | Error → 「無法載入戰績」+ 重試按鈕 | e2e | ❌→已補寫 | `standings.spec.ts` `AC-11` |
| E-12 | B-12 | [qa-v2 補充] 點重試按鈕 → 重新發 fetch | e2e | ❌→已補寫 | `standings.spec.ts` `AC-11b` |
| E-13 | B-13 | Empty（teams=[]）→ 「賽季尚未開始」+ 看球員按鈕 | e2e | ❌→已補寫 | `standings.spec.ts` `AC-12` |
| E-14 | B-14 | [qa-v2 補充] 點「看球員名單」→ /roster | e2e | ❌→已補寫 | `standings.spec.ts` `AC-12b` |
| E-15 | B-15 | 0勝 0敗 → pct 顯示「—」、不顯示 0.0% | e2e | ❌→已補寫 | `standings.spec.ts` `AC-13` |
| E-16 | B-16 | 8 隊資料 → 不爆版（無水平 overflow） | e2e | ❌→已補寫 | `standings.spec.ts` `AC-14` |
| I-1 | B-fetch | `fetchData('standings')` GAS 失敗 → 走 `/data/standings.json` | integration | ❌→已補寫 | `tests/integration/api-fallback.integration.test.ts`（新增 standings case） |
| I-2 | B-fetch | `fetchData('standings')` GAS+JSON 都失敗 → `source: error` | integration | ❌→已補寫 | 同上 |
| I-3 | B-fetch | `fetchData('schedule')` 既有覆蓋（4 cases） | integration | ✅ 既有 | 同檔 |
| U-1 | B-pct | `formatPct(wins, losses)`：0/0 → '—'、否則回傳 `xx.x%` | unit | ⬜ Phase 2 | `tests/unit/standings-utils.test.ts` |
| U-2 | B-streak | `getStreakClasses(streakType)`：win → orange + up、lose → red + down、none → 預設 | unit | ⬜ Phase 2 | 同上 |
| U-3 | B-history | `getHistoryDotColor(result, teamId)`：W → 隊伍主色、L → 灰 | unit | ⬜ Phase 2 | 同上 |
| U-4 | B-rank | `sortStandings(teams)` 不重排（identity）— 防止意外排序 | unit | ⬜ Phase 2 | 同上 |
| U-5 | B-roster-link | `buildRosterLink(team)` → `/roster?team=<TeamColorId>` | unit | ⬜ Phase 2 | 同上 |

> 說明：sp-writing-plans-v2 從此表讀取所有 U-/I-/E-* ID。Phase 3 讀 I-* 行；Phase 6 讀 E-* 行；Task 設計讀 U-* 行（✅ 跳過、⬜ 建立）。

## Phase 3 執行清單（Integration + Unit）

```bash
npx vitest run
```

涵蓋：
- ✅ 既有 `tests/integration/api-fallback.integration.test.ts`（4 cases）
- 新補 standings 2 cases（同檔末段）
- ✅ 既有 unit：`schedule-utils.test.ts`、`staff-display.test.ts`、`sample.test.ts`
- ⬜ Phase 2 task 補：`tests/unit/standings-utils.test.ts`（U-1 ~ U-5）

Phase 3 通過條件：
- 所有 unit + integration test 通過
- code-review-graph `detect_changes_tool` test_gaps = 0（或記錄缺口已被間接覆蓋）

## Phase 6 執行清單（E2E）

```bash
npx playwright test tests/e2e/regression
npx playwright test tests/e2e/features/standings.spec.ts
```

涵蓋：
- 新補 `tests/e2e/features/standings.spec.ts`（17 個 test，含 RWD describe 2 個 — 含 mobile/desktop project skip）
- 既有 `tests/e2e/regression/schedule.regression.spec.ts`（5-tab nav 中應仍可導到 /standings）
- ⬜ 視結果決定是否補一支 `tests/e2e/regression/standings.regression.spec.ts`（純 smoke：頁面載入、6 列可見）

Phase 6 通過條件：UAT URL E2E 全部通過、無 console error。
