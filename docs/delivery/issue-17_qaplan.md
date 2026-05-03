# Issue #17 QA Plan — [L] fix: 新網站資料同步

**Issue**：https://github.com/waterfat/taan-basketball-league/issues/17
**分級**：L
**平台偵測**：Web（Astro 6 + Tailwind 4，純展示型，無使用者帳號）

---

## 根因摘要（影響行為抽取）

從 `src/lib/api-transforms.ts` + `src/lib/api.ts` 確認的根因（**修復目標**）：

1. `transformStandings` 缺 `season` / `phase` / `currentWeek` / `matrix` 欄位 → AC-1（戰績榜空白）+ AC-4（hero 缺賽季）
2. `transformDragon` 寫死 `civilianThreshold: 36` → AC-3（前 N 名與實際分組不一致）
3. `transformHome` / `transformSchedule` / `transformRoster` / `transformLeaders` 全為 stub → AC-4/5/6/7（顯示 W3 範例）
4. `api.ts` 的 `SHEETS_RANGES` 只啟用 `standings` + `dragon`，其餘走 static fallback → 範例資料假裝成功
5. `api.ts` Sheets 失效時 fallback 到 static JSON → AC-E1（應顯示 error state，不假裝成功）
6. 既有 16 個 e2e spec 含 `page.route` mock 攔截 → 掩蓋真實 prod 同步問題（AC-X1 cleanup）
7. `public/data/dragon.json` 重複 `rulesLink` 鍵（example.com + Notion）→ AC-X2 cleanup

---

## Step 1.5：Fixture Inventory

| Entity | Fixture 檔案 | 動作 | 備註 |
|--------|------------|------|------|
| home | tests/fixtures/home.ts | 直接用 | composite shape 已涵蓋 hero / standings / dragonTop10 / miniStats |
| standings | tests/fixtures/standings.ts | 直接用 | 含 mockMatrix6x6 + mockStandingsWithMatrix |
| dragon | tests/fixtures/dragon.ts | 直接用 | players + civilianThreshold |
| schedule | tests/fixtures/schedule.ts | 直接用 | weeks[] 結構 |
| roster | tests/fixtures/roster.ts | 直接用 | 6 隊 + 出席資料 |
| leaders | tests/fixtures/leaders.ts | 直接用 | leaders + teamOffense/Defense/Net |
| boxscore | tests/fixtures/boxscore.ts | 直接用 | 不在 Issue #17 範圍 |

### Refactor Backlog（自動掃描，不在當前 Issue 處理）

| 觸發 | 對象 | 建議動作 |
|------|------|----------|
| T2 | 同尾 "Game" 有 3 個相似 factory | 考慮合併為參數化版本 |
| T2 | 同尾 "Leaders" 有 6 個相似 factory | 考慮合併為參數化版本 |
| T2 | 同尾 "Player" 有 4 個相似 factory | 考慮合併為參數化版本 |
| T2 | 同尾 "Standings" 有 4 個相似 factory | 考慮合併為參數化版本 |
| T2 | 同尾 "Week" 有 5 個相似 factory | 考慮合併為參數化版本 |

### Deprecated Scan
未發現 `@deprecated` 標記。

---

## Step 2：AC 行為抽取

### 核心情境

**AC-1：戰績榜（/standings）顯示 6 隊排名表 + 6×6 對戰勝敗矩陣**
- B-1：standings 頁面成功渲染（不空白、不 console error）→ e2e
- B-2：表格顯示 6 隊（真實隊名與勝/敗/勝率/連勝紀錄）→ e2e
- B-3：6×6 對戰勝敗矩陣顯示，對角線為 null → e2e + integration（驗 transformStandings 含 matrix）
- B-4：StandingsHero 顯示真實 season / phase / currentWeek（非 SEASON=25 hardcode）→ e2e + integration

**AC-2：龍虎榜（/roster?tab=dragon）頂部顯示「龍虎榜 · 第 25 季」**
- B-5：dragon hero 賽季數字非空白（不顯示「第 季」）→ e2e
- B-6：transformDragon 從 Sheets 回傳真實 season（非 SEASON=25 hardcode）→ integration

**AC-3：龍虎榜「前 N 名」標題與實際平民區人數一致**
- B-7：civilianThreshold 從 Sheets 取得（非寫死 36）→ integration
- B-8：平民區渲染前 N 個球員（依排名序）→ e2e
- B-9：第 N+1 名起放奴隸區 → e2e
- B-10：標題「前 N 名」中的 N 等於實際渲染的平民區列表長度 → e2e

**AC-4：球員名單（/roster）頂部顯示「ROSTER · 第 25 季」+ hero 真實 phase**
- B-11：roster hero 賽季數字非空白 → e2e
- B-12：roster hero subtitle 顯示真實 phase（非 undefined）→ e2e
- B-13：transformRoster 完整切分 6 隊球員資料 → integration

**AC-5：首頁（/）顯示真實當前週、戰績、賽程**
- B-14：home hero 顯示真實 currentWeek + phase（非 W3 例行賽範例）→ e2e
- B-15：home miniStandings 顯示真實 6 隊戰績 → e2e
- B-16：home miniDragon 顯示真實龍虎榜 top 10 → e2e
- B-17：home miniLeaders 顯示真實 PTS/REB/AST 領先者 → e2e
- B-18：home matchups 顯示真實當週對戰 → e2e
- B-19：transformHome 回傳完整 composite shape（含 standings / dragonTop10 / miniStats）→ integration

**AC-6：賽程頁（/schedule）顯示真實當前週賽程**
- B-20：schedule weeks[] 顯示真實對戰資料（非範例）→ e2e
- B-21：預設展開當前週 → e2e
- B-22：transformSchedule 完整 zip dates + allSchedule + allMatchups → weeks[] → integration

**AC-7：領先榜（/boxscore?tab=leaders）顯示真實個人類別 + 隊伍三表**
- B-23：個人類別表（PTS/REB/AST/STL/BLK 等）顯示真實 → e2e
- B-24：teamOffense 表顯示真實隊伍進攻數據 → e2e
- B-25：teamDefense 表顯示真實隊伍防守數據 → e2e
- B-26：teamNet 表顯示真實隊伍淨值 → e2e
- B-27：transformLeaders 完整解析 4 個 range → integration

### 邊界 / 異常

**AC-E1：Sheets API 失效時顯示「資料載入失敗」狀態 + 重試按鈕**
- B-28：當 Sheets API 失敗時，**不** fallback 到 static JSON 假裝成功 → integration（fetchData 行為改變）
- B-29：頁面顯示 ErrorState 元件（含重試按鈕）→ e2e

**AC-E2：賽季初尚無資料時顯示合理空狀態**
- B-30：頁面顯示 EmptyState（不出現「第 季」/ undefined / NaN）→ e2e

### 附帶清理（code-only，無 testcase）

**AC-X1：清理 16 個含 mock pattern 的 e2e spec**
- B-X1：移除 `page.route` / `mockXxxAPI` / `route.fulfill` 攔截器，改對 prod URL 跑真實鏈路 → Phase 2 task
- B-X2：`tests/helpers/mock-api/` 7 個檔案保留作為 unit/integration 用，**禁止** import 進 e2e spec → Phase 2 task

**AC-X2：清理 `public/data/dragon.json` 重複 rulesLink 鍵**
- B-X3：刪除 line 6 `"rulesLink": "https://example.com/rules"`，保留 line 46 真實 Notion URL → Phase 2 task

---

## Step 3：Tag 搜尋既有 Testcase

關鍵字：`api-transforms`, `api-sheets`, `api-fallback`, `standings`, `dragon`, `roster`, `home`, `schedule`, `leaders`, `matrix`

### Integration（既有）

| 檔案 | 涵蓋 | 狀態（Issue #17 視角）|
|------|------|-------|
| tests/integration/api-sheets.integration.test.ts | fetchData('home/standings/dragon') 命中 sheets URL | 🔧 修改：home 部分需更新（transformer 補完後改驗真實 shape）|
| tests/integration/api-fallback.integration.test.ts | static JSON fallback path | 🔧 修改：AC-E1 改後行為變（不 fallback）|
| tests/integration/api-cache.integration.test.ts | 5 分鐘 cache | ✅ 既有 |
| tests/integration/api-cleanup.integration.test.ts | cache 清理 | ✅ 既有 |
| tests/integration/api-leaders-extended.integration.test.ts | leaders 4-block | 🔧 修改：transformLeaders 補完後驗 |
| tests/integration/api-standings-matrix.integration.test.ts | static JSON 保留 matrix | 🔧 修改：擴充 Sheets path 也回 matrix |

### Unit（既有）

| 檔案 | 涵蓋 |
|------|------|
| tests/unit/api-transforms.test.ts | 6 個 transformer 「正常 / 空輸入」型別安全（**期望需更新：補完後驗真實欄位**）|
| tests/unit/standings-matrix-utils.test.ts | matrix 工具 |
| tests/unit/dragon-components.test.ts | dragon 元件 |
| tests/unit/roster-components.test.ts | roster 元件 |
| tests/unit/standings-components.test.ts | standings 元件 |
| tests/unit/mock-api-pattern.test.ts | mock 模式測試 |

### E2E（既有，多含 mock pattern，需 AC-X1 cleanup）

| 檔案 | 大致涵蓋 | 狀態 |
|------|---------|------|
| tests/e2e/features/standings.spec.ts | 戰績榜（含 mock） | 🔧 修改：移除 mock + 拆 200 行限制 |
| tests/e2e/features/standings/standings-matrix.spec.ts | 矩陣顯示（含 mock） | 🔧 修改：移除 mock |
| tests/e2e/features/data-fallback.spec.ts | fallback 行為（含 mock） | 🔧 修改：對 AC-E1 改後行為重寫 |
| tests/e2e/features/roster/dragon-tab.spec.ts | dragon 列表 | 🔧 修改：移除 mock + 補 threshold/分組驗證（B-7~10）|
| tests/e2e/features/roster/dragon-tab-grouping.spec.ts | dragon 分組 | 🔧 修改：移除 mock + 強化 |
| tests/e2e/features/roster/hero-roster-tab.spec.ts | roster hero | 🔧 修改：補真實 season + phase 驗證（B-11/12）|
| tests/e2e/features/home/*.spec.ts (6 specs，含 mock) | 首頁各區塊 | 🔧 修改：移除 mock + 對 prod 跑真實鏈路 |
| tests/e2e/features/schedule.spec.ts | 賽程 | 🔧 修改：移除 mock + 拆 200 行 |
| tests/e2e/features/schedule/schedule-toggle.spec.ts | 賽程切換 | 🔧 修改：移除 mock |
| tests/e2e/features/boxscore/leaders.spec.ts | 領先榜 | 🔧 修改：移除 mock |
| tests/e2e/features/boxscore/leaders-team.spec.ts | 隊伍三表 | 🔧 修改：移除 mock |
| tests/e2e/features/boxscore/states.spec.ts | 狀態切換 | 🔧 修改：移除 mock |
| tests/e2e/features/boxscore/boxscore-tab/player-table.spec.ts | 球員表 | 🔧 修改：移除 mock |
| tests/e2e/regression/boxscore.regression.spec.ts | regression | 🔧 修改：移除 mock |

### 缺漏（qa-plan 補寫）

| 缺漏行為 | 層 | 補寫位置 |
|---------|----|---------|
| B-28：AC-E1 Sheets 失效不 fallback（fetchData 行為） | integration | tests/integration/api-no-fallback.integration.test.ts |
| B-29 + B-30：AC-E1/E2 ErrorState + EmptyState 跨模組渲染（home/schedule/roster + standings 已涵蓋） | unit | tests/unit/error-empty-states.test.ts |

說明：AC-E1 / AC-E2 在 prod URL 上無法主動觸發（Sheets API 不會主動失敗、賽季中無空資料）。依 e2e-guide.md「When you need deterministic data → Reclassify as integration/unit」原則，這兩條改用 integration / unit 驗證行為，e2e 不單獨補。

---

## Coverage Matrix

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|------------|------|------|-----|------|------|
| I-1 | B-3, B-4 | transformStandings 含 matrix + season/phase/currentWeek | integration | 🔧 修改 | tests/integration/api-standings-matrix.integration.test.ts + tests/unit/api-transforms.test.ts |
| I-2 | B-6, B-7 | transformDragon 含 season + civilianThreshold 從 Sheets 取得 | integration | 🔧 修改 | tests/unit/api-transforms.test.ts |
| I-3 | B-13 | transformRoster 完整 6 隊切分 | integration | 🔧 修改 | tests/unit/api-transforms.test.ts |
| I-4 | B-19 | transformHome 完整 composite shape | integration | 🔧 修改 | tests/unit/api-transforms.test.ts + tests/integration/api-sheets.integration.test.ts |
| I-5 | B-22 | transformSchedule 完整 zip → weeks[] | integration | 🔧 修改 | tests/unit/api-transforms.test.ts |
| I-6 | B-27 | transformLeaders 完整 4-block 解析 | integration | 🔧 修改 | tests/unit/api-transforms.test.ts + tests/integration/api-leaders-extended.integration.test.ts |
| I-7 | B-28 | AC-E1：Sheets 失效時 fetchData 回 source: 'error'（不 fallback static）[qa-plan 補充] | integration | ❌→已補寫 | tests/integration/api-no-fallback.integration.test.ts |
| E-1 | B-1, B-2, B-3, B-4 | standings 頁面顯示 6 隊 + 矩陣 + hero 真實 season | e2e | 🔧 修改 | tests/e2e/features/standings/standings-data.spec.ts (改寫 standings.spec.ts) |
| E-2 | B-5 | dragon hero 賽季數字 | e2e | 🔧 修改 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-3 | B-8, B-9, B-10 | 龍虎榜分組與 threshold 一致 | e2e | 🔧 修改 | tests/e2e/features/roster/dragon-tab-grouping.spec.ts |
| E-4 | B-11, B-12 | roster hero 賽季 + phase | e2e | 🔧 修改 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-5 | B-14 | home hero 真實 currentWeek + phase | e2e | 🔧 修改 | tests/e2e/features/home/home-hero-schedule.spec.ts |
| E-6 | B-15, B-16, B-17, B-18 | home miniStandings + miniDragon + miniLeaders + matchups | e2e | 🔧 修改 | tests/e2e/features/home/home-{standings,leaders-dragon,matchups}.spec.ts |
| E-7 | B-20, B-21 | schedule weeks 真實對戰 | e2e | 🔧 修改 | tests/e2e/features/schedule/schedule-data.spec.ts (改寫 schedule.spec.ts) |
| E-8 | B-23, B-24, B-25, B-26 | leaders 個人 + 隊伍三表 | e2e | 🔧 修改 | tests/e2e/features/boxscore/leaders.spec.ts + leaders-team.spec.ts |
| U-1 | B-7 | DragonTabPanel 分組演算法（依排名 < threshold 切平民/奴隸）| unit | ⬜ Phase 2 | tests/unit/dragon-components.test.ts（擴充）|
| U-2 | B-19 | home-utils 從 composite shape 提取 miniStandings 排序 | unit | ⬜ Phase 2 | tests/unit/home-utils.test.ts |
| U-3 | B-29, B-30 | ErrorState + EmptyState 跨模組渲染（home/schedule/roster；standings 既有）[qa-plan 補充] | unit | ❌→已補寫 | tests/unit/error-empty-states.test.ts |

說明：
- `🔧 修改` = 既有 testcase 但需配合 transformer 補完後更新期望值（含移除 mock）；由 Phase 2 task 負責（TDD 改寫 + 補強）
- `❌→已補寫` = qa-plan 階段新建 spec 檔
- `⬜ Phase 2` = unit test 由實作 task 在 TDD 階段建立

sp-writing-plans-v2 從此表讀取所有 U-/I-/E-* ID。pm-v2 Phase 1.4 抽 dispatch payload 時，從此表轉換為 `integration_tests[]` / `e2e_cases[]`（含 spec_path + describe_block mapping）給 qa-integration / qa-e2e。

---

## Phase 3 執行清單（Integration）

| I-ID | 描述 | spec |
|------|------|------|
| I-1 | transformStandings 含 matrix | tests/integration/api-standings-matrix.integration.test.ts |
| I-2 | transformDragon civilianThreshold from Sheets | tests/unit/api-transforms.test.ts（描述 transformDragon）|
| I-3 | transformRoster 6 隊切分 | tests/unit/api-transforms.test.ts（描述 transformRoster）|
| I-4 | transformHome composite | tests/integration/api-sheets.integration.test.ts |
| I-5 | transformSchedule zip | tests/unit/api-transforms.test.ts（描述 transformSchedule）|
| I-6 | transformLeaders 4-block | tests/integration/api-leaders-extended.integration.test.ts |
| I-7 | AC-E1 不 fallback | tests/integration/api-no-fallback.integration.test.ts（新增）|

執行指令：`npx vitest run tests/integration/ tests/unit/api-transforms.test.ts`

---

## Phase 6 執行清單（E2E）

| E-ID | spec_path | describe_block |
|------|-----------|----------------|
| E-1 | tests/e2e/features/standings/standings-data.spec.ts | Standings — 真實資料同步 |
| E-2 | tests/e2e/features/roster/dragon-tab.spec.ts | Dragon Hero — 真實 season |
| E-3 | tests/e2e/features/roster/dragon-tab-grouping.spec.ts | Dragon Grouping — threshold 與分組一致 |
| E-4 | tests/e2e/features/roster/hero-roster-tab.spec.ts | Roster Hero — 真實 season + phase |
| E-5 | tests/e2e/features/home/home-hero-schedule.spec.ts | Home Hero — 真實 currentWeek + phase |
| E-6a | tests/e2e/features/home/home-standings.spec.ts | Home miniStandings — 真實戰績 |
| E-6b | tests/e2e/features/home/home-leaders-dragon.spec.ts | Home miniLeaders + miniDragon — 真實資料 |
| E-6c | tests/e2e/features/home/home-matchups.spec.ts | Home Matchups — 真實當週 |
| E-7 | tests/e2e/features/schedule/schedule-data.spec.ts | Schedule — 真實 weeks |
| E-8a | tests/e2e/features/boxscore/leaders.spec.ts | Leaders 個人類別 — 真實資料 |
| E-8b | tests/e2e/features/boxscore/leaders-team.spec.ts | Leaders 隊伍三表 — 真實資料 |

執行指令：對 prod URL（https://waterfat.github.io/taan-basketball-league/）跑 Playwright；regression/ 全跑 + features/ 上述 spec_path 跑。

**UAT URL 解析**：本專案無 uat 環境（environments.yml notes 已寫「prod 為唯一部署目標」），qa-e2e 對 prod URL 執行為合法例外。

---

## Step 4-1：Shared Resources 清單

```
{
  auth: [],                # 純展示型，無使用者帳號
  fixtures: [
    "mockHome (tests/fixtures/home.ts)",
    "mockStandings, mockMatrix6x6, mockStandingsWithMatrix (tests/fixtures/standings.ts)",
    "mockDragon (tests/fixtures/dragon.ts)",
    "mockSchedule (tests/fixtures/schedule.ts)",
    "mockRoster (tests/fixtures/roster.ts)",
    "mockLeaders (tests/fixtures/leaders.ts)"
  ],
  visual: [],               # 本 Issue 不涉及視覺截圖比對（依 TESTING.md：色彩需人工比對）
  env_vars: [
    "PUBLIC_SHEET_ID",
    "PUBLIC_SHEETS_API_KEY",
    "PUBLIC_SITE_URL"        # 本 Issue 補入 environments.yml
  ]
}
```

---

## Phase 5 部署相依（給 ops-v2）

- `PUBLIC_SHEET_ID` / `PUBLIC_SHEETS_API_KEY` 已注入 GitHub Actions（Issue #13/#14 確立）
- `PUBLIC_SITE_URL` 有 default fallback，build 時可不額外注入
- 部署後驗證：`./scripts/e2e-test.sh https://waterfat.github.io/taan-basketball-league/`（CLAUDE.md 規定）

---

## 補寫進度

- [x] tests/integration/api-no-fallback.integration.test.ts（B-28 / I-7）— 已寫，3/8 RED（驗 AC-E1 行為改變，Phase 2 改 api.ts 後 GREEN）
- [x] tests/unit/error-empty-states.test.ts（B-29, B-30 / U-3）— 已寫，6/6 GREEN（驗元件渲染契約）

## 既有測試狀態（給 Phase 2 task 修復時參考）

- `tests/integration/api-fallback.integration.test.ts`：驗舊行為（Sheets 失敗 → fallback static）。AC-E1 改後此檔需更新或標 @deprecated（Phase 2 task scope decision）。
- `tests/unit/api-transforms.test.ts`：6 個 transformer 「正常 / 空輸入」期望需配合 transformer 補完更新（Phase 2 TDD step）。
- `tests/integration/api-sheets.integration.test.ts`：home transformer 補完後需擴充驗 composite shape。
- `tests/integration/api-leaders-extended.integration.test.ts`：transformLeaders 補完後需擴充驗 4-block 解析。
- `tests/integration/api-standings-matrix.integration.test.ts`：擴充驗 Sheets path 也回 matrix。

## 為 sp-writing-plans-v2 提供的 task 切點建議

依資料源分組（無相依，可並行）：
1. **Standings transformer + matrix**（B-3, B-4 / I-1, E-1）
2. **Dragon transformer + threshold**（B-6, B-7, B-10 / I-2, E-2, E-3）+ DragonTabPanel 分組演算法（U-1）
3. **Roster transformer 6-team 切分**（B-13 / I-3, E-4）
4. **Home transformer composite**（B-19 / I-4, E-5, E-6abc）+ home-utils（U-2）
5. **Schedule transformer zip**（B-22 / I-5, E-7）
6. **Leaders transformer 4-block**（B-27 / I-6, E-8ab）
7. **api.ts AC-E1 不 fallback 邏輯**（B-28 / I-7）— **此 task 跑完才能讓 1-6 的 e2e 改寫順利驗 prod 真實鏈路**
8. **AC-X1 e2e specs cleanup**（移除 16 個 spec 的 mock pattern）— 相依 task 1-7 完成後跑（避免一邊改 spec 一邊改實作衝突）
9. **AC-X2 dragon.json 重複 rulesLink**（B-X3）— 獨立小修
