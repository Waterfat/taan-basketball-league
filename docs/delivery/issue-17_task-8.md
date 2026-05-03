# Issue #17 — Task 8 Delivery Record

**Task**：AC-X1 — 16 個 e2e spec 移除 mock pattern（最大 cleanup task）
**Phase**：2（實作）
**狀態**：DONE
**執行日期**：2026-05-04

---

## 摘要

針對 plan 第 1264-1282 列出的 19 個 e2e spec 中、實際含 mock pattern（`page.route` / `mockXxxAPI` / `route.fulfill` / `mock-api` import）的 16 個 spec 進行 cleanup。
依 e2e-guide.md HARD 規則（第 99-124 行 Mock Interceptor Prohibition）三類處理：

- **A 類**：移除 mock，改對 prod URL 跑真實鏈路（保留 e2e）
- **B 類**：降級為 unit/integration test，保留 e2e 中的 prod-friendly happy path
- **C 類**：完全降級為 unit/integration，e2e 整檔移除

---

## 16 個 spec 處理對照表

| # | Spec | 處理方式 | 備註 |
|---|------|---------|------|
| 1 | `tests/e2e/features/standings.spec.ts` | **Rename + A** | → `tests/e2e/features/standings/standings-data.spec.ts`（拆 200 行限制 + 移除 mock） |
| 2 | `tests/e2e/features/standings/standings-matrix.spec.ts` | **A** | in-place 改寫，三狀態 mock 子集（loading/error）降級至 unit/integration |
| 3 | `tests/e2e/features/data-fallback.spec.ts` | **C（檔案移除）** | AC-E1 / E-7 行為已由 `tests/integration/api-no-fallback.integration.test.ts` 完整覆蓋（5 cases），e2e 整檔刪除 |
| 4 | `tests/e2e/features/schedule.spec.ts` | **Rename + A** | → `tests/e2e/features/schedule/schedule-data.spec.ts`（拆 200 行限制 + 移除 mock） |
| 5 | `tests/e2e/features/schedule/schedule-toggle.spec.ts` | **A** | in-place 改寫，unpublished 情境改由 `tests/unit/matchups-toggle-utils.test.ts` 覆蓋 |
| 6 | `tests/e2e/features/home/home-standings.spec.ts` | **A** | in-place，移除 mockHomeAPI |
| 7 | `tests/e2e/features/home/home-hero-schedule.spec.ts` | **A** | in-place |
| 8 | `tests/e2e/features/home/home-leaders-dragon.spec.ts` | **A** | in-place，不寫死球員名 |
| 9 | `tests/e2e/features/home/home-matchups.spec.ts` | **A** | in-place，gamesPublished 邏輯改由 unit 涵蓋 |
| 10 | `tests/e2e/features/home/home-rwd.spec.ts` | **A** | in-place，RWD 結構性 invariant |
| 11 | `tests/e2e/features/home/home-states.spec.ts` | **C（檔案移除）** | 三狀態 mock 觸發 → 新增 `tests/unit/home-states.test.ts`（8 testcase）涵蓋 SkeletonState / ErrorState / EmptyState / streakType=null / FewPlayers / FewDragon |
| 12 | `tests/e2e/features/boxscore/leaders.spec.ts` | **A** | in-place，AC-E3 部分類別空 → unit |
| 13 | `tests/e2e/features/boxscore/leaders-team.spec.ts` | **A** | in-place，E-403 offense empty 子集 → unit |
| 14 | `tests/e2e/features/boxscore/states.spec.ts` | **C（檔案移除）** | 三狀態全 mock-driven → 新增 `tests/unit/boxscore-leaders-states.test.ts`（12 testcase）涵蓋 BoxscoreSkeleton/Error/Empty + LeadersSkeleton/Error/Empty + LeaderCard 部分空狀態 |
| 15 | `tests/e2e/features/boxscore/boxscore-tab/player-table.spec.ts` | **A** | in-place，AC-6b（DNP 合計）→ 既有 boxscore-utils unit |
| 16 | `tests/e2e/regression/boxscore.regression.spec.ts` | **A** | in-place，移除 R-4 / R-5（error/empty 限縮）改由 unit 覆蓋；保留 R-1/R-2/R-3 的 prod 真實鏈路驗證 |

### Plan 第 1264-1282 額外列出的 3 個 roster spec

實際 grep 沒抓到 mock pattern（用的是 `mockRosterAndDragon` helper，不符 `mockXxxAPI` 命名），但 plan 明確列在 Task 8 範圍內：

| # | Spec | 處理方式 |
|---|------|---------|
| 17 | `tests/e2e/features/roster/dragon-tab.spec.ts` | **A**：in-place 改寫，AC-7 / AC-8 / AC-19（threshold 邊界 + 空 dragon）→ 留給 unit 覆蓋 |
| 18 | `tests/e2e/features/roster/dragon-tab-grouping.spec.ts` | **A**：in-place 改寫，threshold 寫死數字（前 10 / 第 11 名起）改為 regex `前 \d+ 名` |
| 19 | `tests/e2e/features/roster/hero-roster-tab.spec.ts` | **A**：in-place 改寫，AC-4（出席色塊樣式）+ AC-18（全 ?）→ 既有 roster-utils unit 覆蓋 |

---

## 降級為 unit / integration 的等價 testcase

| 原 e2e testcase | 等價 unit / integration 路徑 |
|----------------|---------------------------|
| home-states.spec.ts AC-12 (Loading) | `tests/unit/home-states.test.ts` > `AC-12 (Loading): SkeletonState 渲染` |
| home-states.spec.ts AC-13 (Error) | `tests/unit/home-states.test.ts` > `AC-13 (Error): ErrorState 含重試按鈕 + 錯誤訊息` |
| home-states.spec.ts AC-13b (Retry click) | `tests/unit/error-empty-states.test.ts`（既有，含重試 callback 契約） |
| home-states.spec.ts AC-14 (Empty) | `tests/unit/home-states.test.ts` > `AC-14 (Empty): EmptyState 顯示「賽季尚未開始」` |
| home-states.spec.ts AC-15 (null streak) | `tests/unit/home-states.test.ts` > `AC-15 (null streak): MiniStandings 不顯示 streak-icon` |
| home-states.spec.ts AC-16 (Few players) | `tests/unit/home-states.test.ts` > `AC-16 (Few players): MiniLeaders 不報錯` |
| home-states.spec.ts AC-17 (Few dragon) | `tests/unit/home-states.test.ts` > `AC-17 (Few dragon): MiniDragon 不報錯` |
| boxscore/states.spec.ts AC-17 (boxscore loading) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-17 (Boxscore Loading): BoxscoreSkeleton` |
| boxscore/states.spec.ts AC-18 (boxscore error 限縮) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-18 (Boxscore Error)` + `AC-18b (Error 限縮): 架構契約` |
| boxscore/states.spec.ts AC-19 (leaders error) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-19 (Leaders Error): LeadersError` |
| boxscore/states.spec.ts AC-19b (retry click) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-19b (Retry callback)` |
| boxscore/states.spec.ts AC-20 (boxscore empty) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-20 (Boxscore Empty)` |
| boxscore/states.spec.ts AC-21 (leaders empty) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-21 (Leaders Empty)` |
| boxscore/states.spec.ts AC-21b (partial empty) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-21b (Partial empty): LeaderCard` |
| data-fallback.spec.ts E-4 (Sheets fail → static) | `tests/integration/api-no-fallback.integration.test.ts`（5 cases，含 placeholder 例外） |
| data-fallback.spec.ts E-7 (Sheets + JSON fail) | `tests/integration/api-no-fallback.integration.test.ts` > 「Sheets HTTP 500 → 不 fallback」 |
| schedule-toggle.spec.ts E-702b (unpublished combo) | `tests/unit/matchups-toggle-utils.test.ts` > `U-102: games 全空 → combo` |
| schedule-toggle.spec.ts E-702c (unpublished hint) | `tests/unit/matchups-toggle-utils.test.ts` 已涵蓋 resolveDefaultView 行為 |
| standings.spec.ts AC-7 (rank 順序) | `tests/e2e/features/standings/standings-data.spec.ts` > `rank 數字單調遞增` |
| standings.spec.ts AC-10/11/12/13/14（loading/error/empty/0勝/8隊） | 改寫為 `tests/unit/standings-components.test.ts` 既有測試 + `tests/unit/error-empty-states.test.ts` |
| dragon-tab.spec.ts AC-7 (above-threshold 判斷) | `tests/unit/dragon-components.test.ts` 既有元件測試 |
| dragon-tab.spec.ts AC-9 (judge icon) | `tests/unit/dragon-components.test.ts` 既有元件測試 |
| dragon-tab.spec.ts AC-19 (空 dragon) | `tests/unit/error-empty-states.test.ts`（既有 dragon empty 渲染） |
| boxscore.regression.spec.ts R-4 (error 限縮) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-18b / R-4 (Error 限縮): 架構契約` |
| boxscore.regression.spec.ts R-5 (empty) | `tests/unit/boxscore-leaders-states.test.ts` > `AC-21 (Leaders Empty)` |

---

## Rename / 刪除紀錄

### Rename
- `tests/e2e/features/standings.spec.ts` → `tests/e2e/features/standings/standings-data.spec.ts`
- `tests/e2e/features/schedule.spec.ts` → `tests/e2e/features/schedule/schedule-data.spec.ts`

### 刪除（檔案完全移除，由 unit/integration 取代）
- `tests/e2e/features/data-fallback.spec.ts`
- `tests/e2e/features/home/home-states.spec.ts`
- `tests/e2e/features/boxscore/states.spec.ts`

### 新增 unit test
- `tests/unit/home-states.test.ts`（8 testcase）
- `tests/unit/boxscore-leaders-states.test.ts`（12 testcase）

---

## qaplan E-1~E-8b mapping 對照（保證 cleanup 後仍對應）

| E-ID | spec_path | describe_block | 現況 |
|------|-----------|----------------|------|
| E-1 | `tests/e2e/features/standings/standings-data.spec.ts` | `Standings — 真實資料同步` | ✅ 已建立 |
| E-2 | `tests/e2e/features/roster/dragon-tab.spec.ts` | `Roster Page — Dragon tab` | ✅ in-place 改寫 |
| E-3 | `tests/e2e/features/roster/dragon-tab-grouping.spec.ts` | `Dragon tab — 平民區 / 奴隸區 分組標題` | ✅ in-place 改寫 |
| E-4 | `tests/e2e/features/roster/hero-roster-tab.spec.ts` | `Roster Hero — 真實 season + phase` | ✅ in-place 改寫 |
| E-5 | `tests/e2e/features/home/home-hero-schedule.spec.ts` | `Home Hero — 真實 currentWeek + phase` | ✅ in-place 改寫 |
| E-6a | `tests/e2e/features/home/home-standings.spec.ts` | `Home — 戰績榜迷你版` | ✅ in-place 改寫 |
| E-6b | `tests/e2e/features/home/home-leaders-dragon.spec.ts` | `Home — 領先榜 + 龍虎榜` | ✅ in-place 改寫 |
| E-6c | `tests/e2e/features/home/home-matchups.spec.ts` | `Home — 本週對戰預覽` | ✅ in-place 改寫 |
| E-7 | `tests/e2e/features/schedule/schedule-data.spec.ts` | `Schedule — 真實 weeks` | ✅ 已建立 |
| E-8a | `tests/e2e/features/boxscore/leaders.spec.ts` | `Leaders Tab — 個人 11 類` | ✅ in-place 改寫 |
| E-8b | `tests/e2e/features/boxscore/leaders-team.spec.ts` | `Leaders Tab — 隊伍三表` | ✅ in-place 改寫 |

note：每個 spec 的 describe_block name 已與 qaplan 對齊（部分原 describe_block 含 ` @tag` 後綴，cleanup 時保留 tag 的同時，主名稱保持不變或更精簡）。qa-e2e Phase 6 dispatch 時可用 spec_path 作為唯一索引；describe_block 為輔助定位。

---

## 驗證紀錄

### Mock pattern grep（task Step 4 驗收）

```bash
$ grep -rlE 'page\.route\(|mock[A-Z][a-zA-Z]*API|route\.fulfill|page\.context\(\)\.route' tests/e2e/
$ echo $?
1   # exit 1 = 無匹配
```

✅ 期望輸出：空（無檔案）— 已達成

### folder-audit

```bash
$ bash scripts/folder-audit.sh
✅ folder-audit 通過
```

### Vitest（task Step 4 驗收）

```
Test Files  28 passed (28)
Tests  250 passed (250)
```

從 Task 1-7 + 9 完成後的 234 → Task 8 後 250（+16 = home-states 8 + boxscore-leaders-states 12 - 重複扣 -4）。

### Playwright

不在 Task 8 跑（依 plan 指示，Phase 6 qa-e2e 才執行）；本 task 僅改寫 spec 內容，spec 是否能對 prod 通過由 Phase 6 驗收。

---

## 範圍說明（給後續 cleanup task 參考）

Task 8 嚴格按 plan 第 1264-1282 列出的 19 個 spec 改寫。實際還有 12 個 e2e spec 仍 import `tests/helpers/mock-api/`：

```
tests/e2e/features/boxscore/boxscore-tab/chip-timeline.spec.ts
tests/e2e/features/boxscore/boxscore-tab/game-cards.spec.ts
tests/e2e/features/boxscore/deep-link.spec.ts
tests/e2e/features/boxscore/hero.spec.ts
tests/e2e/features/boxscore/leaders-tab.spec.ts
tests/e2e/features/boxscore/rwd.spec.ts
tests/e2e/features/boxscore/tab-switch.spec.ts
tests/e2e/features/roster/deep-link.spec.ts
tests/e2e/features/roster/roster-attendance.spec.ts
tests/e2e/features/roster/roster-team-filter.spec.ts
tests/e2e/features/roster/rwd.spec.ts
tests/e2e/features/roster/states.spec.ts
```

這些 spec 用的 helper（`mockRosterAndDragon`, `mockBoxscoreAndLeaders`, `mockBoxscoreSheetsAPI` …）有部分名稱不符 `mockXxxAPI` regex，因此**不被 folder-audit Rule 5 阻擋**，也不被 task Step 4 驗收 grep 抓到。但仍違反 e2e-guide.md HARD 規則「禁止 imported from helpers/mock-api」。

建議由後續 issue（例如 Issue #18 e2e cleanup follow-up）處理，並考慮**強化 folder-audit grep**：

```bash
# 建議擴充條件：偵測 import from helpers/mock-api/
grep -rE "from\s+['\"][^'\"]*helpers/mock-api" tests/e2e/
```
