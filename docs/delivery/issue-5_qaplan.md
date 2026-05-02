# Issue #5 QA Plan — /roster 球員頁實作（含積分龍虎榜 sub-tab）

**Platform:** Web（Astro + Playwright）
**E2E tool:** Playwright
**平台偵測：** Web（environments.yml e2e.framework = Playwright）

---

## Fixture Inventory

### 新補 Fixture

| Entity | Action | 檔案 | 工廠函式 |
|--------|--------|------|---------|
| Roster | 補（新建） | `tests/fixtures/roster.ts` | `mockFullRoster()`, `mockEmptyRoster()`, `mockRosterAllQuestions()`, `mockRosterPlayer()`, `mockRosterTeam()` |
| Dragon | 補（新建） | `tests/fixtures/dragon.ts` | `mockFullDragonboard()`, `mockDragonboardWithThreshold()`, `mockEmptyDragonboard()`, `mockDragonPlayer()` |

### 直接使用（既有）

| Entity | 用途 | 檔案 |
|--------|------|------|
| TeamStanding | deep link 測試隊伍 ID 驗證 | `tests/fixtures/standings.ts` |

### Mock-API Helper 新補

| 檔案 | 說明 |
|------|------|
| `tests/helpers/mock-api/roster.ts` | `mockRosterAPI`, `mockDragonAPI`, `mockRosterAndDragon` |
| `tests/helpers/mock-api/index.ts` | re-export roster helpers |

### Refactor Backlog（不在本 Issue）

| 觸發 | 對象 | 建議動作 |
|------|------|----------|
| T2 | 同尾 "Game" 有 3 個相似 factory | 合併為參數化版本 |
| T2 | 同尾 "Leaders" 有 5 個相似 factory | 合併為參數化版本 |
| T2 | 同尾 "Standings" 有 4 個相似 factory | 合併為參數化版本 |
| T2 | 同尾 "Week" 有 5 個相似 factory | 合併為參數化版本 |

---

## Coverage Matrix

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|------------|------|------|-----|------|------|
| U-1 | B-9 | att=1 → 隊伍主色 CSS class 計算 | unit | ⬜ Phase 2 | tests/unit/roster-utils.test.ts |
| U-2 | B-10 | att=0 → 紅色 class | unit | ⬜ Phase 2 | tests/unit/roster-utils.test.ts |
| U-3 | B-11 | att="x" → 黃色 class | unit | ⬜ Phase 2 | tests/unit/roster-utils.test.ts |
| U-4 | B-12 | att="?" → 灰色虛框 class | unit | ⬜ Phase 2 | tests/unit/roster-utils.test.ts |
| U-5 | B-17 | total <= civilianThreshold → 無金色背景 [qa-v2 補充] | unit | ⬜ Phase 2 | tests/unit/roster-utils.test.ts |
| U-6 | B-21 | playoff=null → 顯示「—」| unit | ⬜ Phase 2 | tests/unit/roster-utils.test.ts |
| U-7 | B-9~B-12 | getAttClass(att) 純函式完整 4 種值 | unit | ⬜ Phase 2 | tests/unit/roster-utils.test.ts |
| I-1 | B-32 | fetchData('roster') GAS 成功 → source:gas | integration | ❌→已補寫 | tests/integration/api-fallback.integration.test.ts |
| I-2 | B-32 | fetchData('roster') GAS 失敗 → source:static | integration | ❌→已補寫 | tests/integration/api-fallback.integration.test.ts |
| I-3 | B-32 | fetchData('roster') 全失敗 → source:error | integration | ❌→已補寫 | tests/integration/api-fallback.integration.test.ts |
| I-4 | B-33 | fetchData('dragon') GAS 失敗 → source:static | integration | ❌→已補寫 | tests/integration/api-fallback.integration.test.ts |
| I-5 | B-33 | fetchData('dragon') 全失敗 → source:error | integration | ❌→已補寫 | tests/integration/api-fallback.integration.test.ts |
| E-1 | B-1,B-2,B-3,B-4 | /roster 載入 + Hero header + 預設球員名單 tab | e2e | ❌→已補寫 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-2 | B-5,B-6 | 6 隊 section + 球員列表可見 | e2e | ❌→已補寫 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-3 | B-7,B-8 | 球員名字 + 10 色塊 | e2e | ❌→已補寫 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-4a | B-9 | att=1 → data-att="1" | e2e | ❌→已補寫 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-4b | B-10 | att=0 → data-att="0" | e2e | ❌→已補寫 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-4c | B-11 | att="x" → data-att="x" | e2e | ❌→已補寫 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-4d | B-12 | att="?" → data-att="?" | e2e | ❌→已補寫 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-5 | B-35 | att 全"?" → 10 個 data-att="?" 色塊 | e2e | ❌→已補寫 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-6 | B-13 | 點龍虎榜 tab → URL ?tab=dragon | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-7 | B-14 | /roster?tab=dragon 重整 → 龍虎榜仍顯示 | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-8 | B-15 | 龍虎榜 9 欄表格 | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-9 | B-16 | total > threshold → data-above-threshold="true" | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-10 | B-18 | 平民線分隔線顯示 | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-11 | B-19 | tag="裁" → judge-icon 可見 | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-12 | B-20 | tag=null → judge-icon 不顯示 | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-13 | B-21,B-22 | playoff=null → 「—」| e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-14 | B-36 | dragon empty → 龍虎榜資料尚未產生 | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-15 | B-37 | 球員名字非連結 [qa-v2 補充] | e2e | ❌→已補寫 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-16 | B-23 | /roster?team=red → 球員名單 tab 選中 | e2e | ❌→已補寫 | tests/e2e/features/roster/deep-link.spec.ts |
| E-17 | B-24,B-25 | /roster?team=red → redSection highlight | e2e | ❌→已補寫 | tests/e2e/features/roster/deep-link.spec.ts |
| E-18 | B-26 | /roster?team=invalid → 無 highlight | e2e | ❌→已補寫 | tests/e2e/features/roster/deep-link.spec.ts |
| E-19 | B-27 | mobile → 球員名單卡片 + 龍虎榜卡片 | e2e | ❌→已補寫 | tests/e2e/features/roster/rwd.spec.ts |
| E-20 | B-28,B-29 | desktop → 球員名單表格 + 龍虎榜表格 | e2e | ❌→已補寫 | tests/e2e/features/roster/rwd.spec.ts |
| E-21 | B-30 | 載入中 → skeleton 可見 | e2e | ❌→已補寫 | tests/e2e/features/roster/states.spec.ts |
| E-22 | B-31 | GAS+JSON 全失敗 → 錯誤 + 重試 | e2e | ❌→已補寫 | tests/e2e/features/roster/states.spec.ts |
| E-23 | B-34 | teams 空 → 賽季尚未開始 | e2e | ❌→已補寫 | tests/e2e/features/roster/states.spec.ts |

說明：sp-writing-plans-v2 從此表讀取所有 U-/I-/E-* ID。Phase 3 讀 I-* 行；Phase 6 讀 E-* 行；Task 設計讀 U-* 行（✅ 跳過、⬜ 建立）。

---

## Phase 3 執行清單（Integration）

- ✅ 既有（已驗 schedule + standings）：tests/integration/api-fallback.integration.test.ts
- 新補（本 Issue）：同檔案新增 roster × 3 + dragon × 2 = 5 個 integration cases

---

## Phase 6 執行清單（E2E）

新補 spec：
- `tests/e2e/features/roster/hero-roster-tab.spec.ts`（describe: Roster Page — Hero + 球員名單 tab）
- `tests/e2e/features/roster/dragon-tab.spec.ts`（describe: Roster Page — 龍虎榜 tab）
- `tests/e2e/features/roster/deep-link.spec.ts`（describe: Roster Page — Deep Link）
- `tests/e2e/features/roster/rwd.spec.ts`（describe: Roster Page RWD）
- `tests/e2e/features/roster/states.spec.ts`（describe: Roster Three-State）

既有 regression（全部必跑）：
- `tests/e2e/regression/`（含 boxscore.regression.spec.ts + schedule.regression.spec.ts）
