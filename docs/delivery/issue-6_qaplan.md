# Issue #6 QA Plan — 首頁即時概覽 Dashboard

**平台偵測**：Web（Astro + Playwright）  
**TG Bot 平台**：無

---

## Fixture Inventory

| Entity | 動作 | 說明 |
|--------|------|------|
| HomeData | 補（新建 `tests/fixtures/home.ts`）| 全新 entity，結構與 home.json 一致 |
| HomeStandingTeam (mini) | 補（包含於 home.ts）| home.json standings 與 standings.ts 結構不同（record 為字串非分開欄位）|
| MiniStatCategory | 補（包含於 home.ts）| miniStats.pts/reb/ast 結構不同於 leaders.ts LeaderData |
| DragonEntry (top 5) | 補（包含於 home.ts）| dragonTop10 結構獨立，不與 dragon 頁混用 |

**Refactor Backlog（自動掃描，不在本 Issue 處理）**：
- T2: Game / Leaders / Standings / Week 各有 3–5 個相似 factory，建議未來合併參數化

**新建 mock-api helper**：`tests/helpers/mock-api/home.ts`（已補寫）  
**更新**：`tests/helpers/mock-api/index.ts` 加 re-export  
**環境變數**：`PUBLIC_GAS_WEBAPP_URL` 補寫至 `tests/environments.yml env_vars`（已補寫）

---

## Coverage Matrix

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|-------------|------|------|-----|------|------|
| E-1 | B-1 | Hero「TAAN BASKETBALL · 第 25 季」+ 副標「例行賽 · 第 3 週」| e2e | ❌→已補寫 | tests/e2e/features/home/home-hero-schedule.spec.ts |
| E-2 | B-2 | 本週賽程區塊顯示日期 + 場地 | e2e | ❌→已補寫 | tests/e2e/features/home/home-hero-schedule.spec.ts |
| E-3 | B-3 | 本週賽程 CTA 連 /schedule | e2e | ❌→已補寫 | tests/e2e/features/home/home-hero-schedule.spec.ts |
| E-4 | B-4 | 戰績榜 6 隊迷你版（rank/隊色點+名/勝敗/勝率/連勝）| e2e | ❌→已補寫 | tests/e2e/features/home/home-standings.spec.ts |
| E-5 | B-5 | 戰績榜 CTA 連 /standings | e2e | ❌→已補寫 | tests/e2e/features/home/home-standings.spec.ts |
| E-6 | B-6 | 連勝 streakType=win → 橙字 + ↑ icon | e2e | ❌→已補寫 | tests/e2e/features/home/home-standings.spec.ts |
| E-7 | B-7 | 連敗 streakType=lose → 紅字 + ↓ icon | e2e | ❌→已補寫 | tests/e2e/features/home/home-standings.spec.ts |
| E-8 | B-8 | 領先榜 pts/reb/ast 各 top 3 並排顯示 | e2e | ❌→已補寫 | tests/e2e/features/home/home-leaders-dragon.spec.ts |
| E-9 | B-9 | 領先榜 CTA 連 /boxscore?tab=leaders | e2e | ❌→已補寫 | tests/e2e/features/home/home-leaders-dragon.spec.ts |
| E-10 | B-10 | 龍虎榜 top 5（rank/名/隊/總分）| e2e | ❌→已補寫 | tests/e2e/features/home/home-leaders-dragon.spec.ts |
| E-11 | B-11 | 龍虎榜 CTA 連 /roster?tab=dragon | e2e | ❌→已補寫 | tests/e2e/features/home/home-leaders-dragon.spec.ts |
| E-12 | B-13 | 點戰績榜隊伍列跳 /roster?team=<id> | e2e | ❌→已補寫 | tests/e2e/features/home/home-standings.spec.ts |
| E-13 | B-14 | 手機（< 768px）各區塊垂直堆疊 | e2e | ❌→已補寫 | tests/e2e/features/home/home-rwd.spec.ts |
| E-14 | B-15 | 桌機（≥ 768px）戰績榜+龍虎榜並排 | e2e | ❌→已補寫 | tests/e2e/features/home/home-rwd.spec.ts |
| E-15 | B-16 | 桌機領先榜三指標橫排 | e2e | ❌→已補寫 | tests/e2e/features/home/home-rwd.spec.ts |
| E-16 | B-17 | 資料載入中顯示 skeleton | e2e | ❌→已補寫 | tests/e2e/features/home/home-states.spec.ts |
| E-17 | B-18 | GAS + JSON 全失敗 → 錯誤訊息 + 重試按鈕 | e2e | ❌→已補寫 | tests/e2e/features/home/home-states.spec.ts |
| E-18 | B-19 | 點重試按鈕重新 fetch [qa-v2 補充] | e2e | ❌→已補寫 | tests/e2e/features/home/home-states.spec.ts |
| E-19 | B-20 | home.json 空資料 → 「賽季尚未開始 ⛹️」| e2e | ❌→已補寫 | tests/e2e/features/home/home-states.spec.ts |
| E-20 | B-21 | streakType null → 不顯示 icon，只顯示文字 | e2e | ❌→已補寫 | tests/e2e/features/home/home-states.spec.ts |
| E-21 | B-22 | players < 3 → 顯示現有，不報錯 | e2e | ❌→已補寫 | tests/e2e/features/home/home-states.spec.ts |
| E-22 | B-23 | dragonTop10 < 5 → 顯示現有，不報錯 | e2e | ❌→已補寫 | tests/e2e/features/home/home-states.spec.ts |
| U-1 | B-6/7 | getStreakClass(type) → win/lose 對應正確 class | unit | ⬜ Phase 2 | tests/unit/home-utils.test.ts |
| U-2 | B-21 | streakType null/undefined → 不回傳 icon class | unit | ⬜ Phase 2 | tests/unit/home-utils.test.ts |
| U-3 | B-22 | limitTop(players, 3) → length < 3 不報錯、回傳現有 | unit | ⬜ Phase 2 | tests/unit/home-utils.test.ts |
| U-4 | B-23 | limitTop(dragon, 5) → length < 5 不報錯、回傳現有 | unit | ⬜ Phase 2 | tests/unit/home-utils.test.ts |
| I-1 | B-2/4/8/10 | fetchData('home') GAS→fallback→error（通用路徑）| integration | ✅ 既有 | tests/integration/api-fallback.integration.test.ts |

說明：I-1 標記「既有」是因為 api-fallback.integration.test.ts 已涵蓋所有 kind 的三層 fallback 邏輯（含 'home'），無需另建 home-specific integration test。

---

## Phase 3 執行清單（Integration）

- ✅ 既有（涵蓋 home kind）：`tests/integration/api-fallback.integration.test.ts`
- 新增 Unit：`tests/unit/home-utils.test.ts`（由 Phase 2 Task 建立）

---

## Phase 6 執行清單（E2E）

- `tests/e2e/features/home/home-hero-schedule.spec.ts`（E-1, E-2, E-3）
- `tests/e2e/features/home/home-standings.spec.ts`（E-4, E-5, E-6, E-7, E-12）
- `tests/e2e/features/home/home-leaders-dragon.spec.ts`（E-8, E-9, E-10, E-11）
- `tests/e2e/features/home/home-states.spec.ts`（E-16, E-17, E-18, E-19, E-20, E-21, E-22）
- `tests/e2e/features/home/home-rwd.spec.ts`（E-13, E-14, E-15）
- `tests/e2e/regression/` — P0 regression 套件（每次必跑）

---

## Regression Promotion 評估（Phase 6 結束後）

`home.regression.spec.ts`（現有 smoke test）已在 regression 套件，確保首頁可載入的基本行為已列為 P0。
