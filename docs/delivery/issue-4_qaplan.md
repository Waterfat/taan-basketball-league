# Issue #4 — QA Plan（/boxscore 數據頁）

**分級**：L
**對應 Issue**：[#4 — [L] feature: /boxscore 數據頁實作](https://github.com/Waterfat/taan-basketball-league/issues/4)
**平台偵測**：Web（Astro 6 + React 19 islands + Tailwind 4）
**測試工具**：Vitest（unit/integration）+ Playwright（regression / features，含 desktop / mobile project）

---

## Step 1：環境讀取結果

| 項目 | 值 |
|------|-----|
| `tests/environments.yml` | 已存在；env：dev=`http://localhost:4321`、prod=`https://waterfat.github.io/taan-basketball-league/` |
| `tests/TESTING.md` | 已存在；E2E 三層覆蓋 + naming（`*.regression.spec.ts` / `*.spec.ts`）+ Playwright project 規範 |
| 認證需求 | 無（純展示頁） |

---

## Step 1.5：Fixture Inventory

### Boxscore entity

| 對象 | 4-action | 動作 |
|------|----------|------|
| `BoxscoreData / BoxscoreWeek / BoxscoreGame / BoxscoreTeam / BoxscorePlayer` types | 缺 | ✅ 已**補**到 `tests/fixtures/boxscore.ts` |
| `mockBoxscorePlayer / mockDnpPlayer / mockBoxscoreTeam / mockBoxscoreGame / mockBoxscoreWeek` | 缺 | ✅ 已補 |
| `mockFullBoxscore / mockEmptyBoxscore / mockBoxscoreWithMissingWeek` | 缺 | ✅ 已補 |
| `mockRawBoxscoreRows / mockRawBoxscoreSheetsResponse`（22 行/場 raw 格式）| 缺 | ✅ 已補（給 integration test 驗 transformBoxscore） |

### Leaders entity

| 對象 | 4-action | 動作 |
|------|----------|------|
| `LeaderData / LeaderSeason / LeaderEntry / LeaderCategory` types | 缺 | ✅ 已補到 `tests/fixtures/leaders.ts` |
| `mockLeaderEntry / mockScoringLeaders / mockReboundLeaders`（含進階指標）| 缺 | ✅ 已補 |
| `mockFullLeaders / mockEmptyLeaders / mockPartialLeaders` | 缺 | ✅ 已補 |

### Helper

| 對象 | 4-action | 動作 |
|------|----------|------|
| `mockBoxscoreSheetsAPI`（攔截 sheets.googleapis.com） | 缺 | ✅ 已補到 `tests/helpers/mock-api.ts` |
| `mockLeadersAPI`（攔截 GAS stats endpoint + JSON fallback） | 缺 | ✅ 已補 |
| `mockBoxscoreAndLeaders`（合併 helper） | 缺 | ✅ 已補 |
| 既有 `mockScheduleAPI` | 直接用 | 不動 |

### Refactor Backlog（自動掃描）

| 觸發 | 對象 | 建議動作 |
|------|------|----------|
| T2 | 同尾 "Week" 有 3 個相似 factory（`mockGameWeek` / `mockMixedWeek` / `mockBoxscoreWeek`） | 跨 entity 不可合併，保留為各 fixture 獨立 factory；不列 backlog 動作 |

### Deprecated Scan

未發現 `@deprecated` 標記。

---

## Step 2：AC 行為抽取（共 38 個行為）

來源：Issue #4 `## 🧪 測試方向`（AC-1 ~ AC-23）。每條 AC 拆出隱含行為，加上 qa-v2 補充。

### Hero（AC-1）
- B-1：訪客打開 `/boxscore` → Hero header 顯示「DATA · 第 25 季」
- B-2：副標依 active tab 動態變化（leaders → 「領先榜」/ boxscore → 「逐場 Box」）

### Box Score tab（AC-2 ~ AC-8）
- B-3：chip timeline 顯示，預設當前週 active
- B-4：點 chip 切週 → 顯示該週 6 場
- B-5：每場顯示標題（紅 22 vs 34 白）
- B-6：紅隊球員表格 + 白隊球員表格（雙隊）
- B-7：工作人員 collapsible（預設摺疊）
- B-8：點 toggle → 工作人員展開/收起
- B-9：球員表格 11 欄
- B-10：表格末尾「合計」row
- B-11：DNP 球員顯示灰色 + 「(未出賽)」標籤
- B-12：[qa-v2 補充] DNP 球員不計入合計
- B-13：球員不可點（純展示）

### Leaders tab（AC-9 ~ AC-10）
- B-14：6 類別獨立卡片（scoring/rebound/assist/steal/block/eff）
- B-15：每類顯示 top 10
- B-16：每位球員顯示 rank/名字/隊色點/數值
- B-17：scoring 顯示 2P%/3P%/FT%
- B-18：rebound 顯示進攻/防守籃板

### Sub-tab + Deep Link（AC-11 ~ AC-14）
- B-19：切換 tab → URL 變更（`?tab=boxscore` / `?tab=leaders`）
- B-20：reload 仍停留同一 tab
- B-21：`/boxscore?week=N&game=M` 進入 → boxscore tab + chip W{N} + scroll 到第 M 場 + highlight
- B-22：[qa-v2 補充] 從 deep link 進入後切回 leaders → URL 移除 week/game query
- B-23：`/boxscore?tab=leaders` 進入 → leaders tab
- B-24：`/boxscore?tab=boxscore` 進入 → boxscore tab
- B-25：無 query 進入 → 預設 leaders tab

### RWD（AC-15 ~ AC-16）
- B-26：桌機 ≥768 → boxscore 11 欄完整表格
- B-27：桌機 ≥768 → leaders 6 卡片兩欄並排
- B-28：手機 <768 → boxscore 表格橫向捲動（保留 11 欄）
- B-29：手機 <768 → leaders 6 卡片垂直堆疊單欄

### 三狀態（AC-17 ~ AC-21）
- B-30：載入中 → skeleton（reuse #1 pattern）
- B-31：Sheets API 失敗（boxscore） → 「無法載入逐場數據」+ 重試（限縮 boxscore 區塊）
- B-32：[qa-v2 補充] boxscore 失敗時切到 leaders tab → leaders 仍正常顯示
- B-33：stats endpoint 失敗（leaders） → 「無法載入領先榜」+ 重試（限縮 leaders 區塊）
- B-34：點 leaders 重試按鈕 → 重新 fetch（call count 增加）
- B-35：該週 boxscore 為空 → 「該週尚無 Box Score」訊息
- B-36：leaders 全空（賽季初） → 「賽季初尚無球員數據」訊息
- B-37：[qa-v2 補充] leaders 部分類別空 → 個別卡片顯示 empty，其他正常

### 安全/環境（AC-22 ~ AC-23）
- B-38：API key 限制 + Sheet 公開檢視 → ops 設定，**不在 E2E 涵蓋**（人工驗收於 ops 文件）

### 解析邏輯（unit/integration 補強）
- B-39：[qa-v2 補充] transformBoxscore 從 22 行/場 raw rows 解析出結構化資料（integration）
- B-40：[qa-v2 補充] DNP 解析時應標記 `dnp=true`（integration）

---

## Step 3：Tag 搜尋現有 testcase

`grep -r "@boxscore\|boxscore" tests/` → 全 ❌ 缺漏（首次建立）。
所有 38 個 testcase 行為均為 ❌ → 進入 Step 4 補寫。

---

## Step 4：補寫 testcase 結果

由 qa-v2 在當前 context 補寫（boxscore 全部在同一功能模組，依 Step 4 分組規則「全在同一模組 → 直接寫」）。

| 檔案 | 用途 | 案例數 |
|------|------|--------|
| `tests/fixtures/boxscore.ts` | Boxscore types + factory | — |
| `tests/fixtures/leaders.ts` | Leaders types + factory | — |
| `tests/helpers/mock-api.ts`（擴充）| `mockBoxscoreSheetsAPI` + `mockLeadersAPI` + `mockBoxscoreAndLeaders` | — |
| `tests/e2e/features/boxscore.spec.ts` | 主要 E2E（30 cases） | 30 |
| `tests/e2e/regression/boxscore.regression.spec.ts` | P0 回歸 smoke（沿用 Issue #1 升級建議）| 5 |
| `tests/integration/boxscore-parse.integration.test.ts` | transformBoxscore + fetchBoxscore + leaders fallback | 10 |

E2E 三層覆蓋自我驗證：`tests/e2e/features/boxscore.spec.ts` 每個 describe 均含 UI 結構（locator visible / count）+ 互動流程（click / goto query）+ 資料驗證（mock API 透過 fulfill 注入並驗證渲染）。

---

## Coverage Matrix

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|------------|------|------|-----|------|------|
| E-1 | B-1 | Hero「DATA · 第 25 季」 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-1 |
| E-2 | B-2 | 副標依 tab 動態 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-1b |
| E-3 | B-25 | 無 query → leaders | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-14 |
| E-4 | B-23 | ?tab=leaders → leaders | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-13 |
| E-5 | B-24 | ?tab=boxscore → boxscore | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-13b |
| E-6 | B-19, B-20 | 切換 tab → URL + reload | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-11 |
| E-7 | B-21 | deep link week+game → highlight | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-12 |
| E-8 | B-22 | 切回 leaders → 移除 query | e2e | ❌→補寫 | features/boxscore.spec.ts › [qa-v2 補充] AC-12b |
| E-9 | B-3 | chip 顯示 + 預設當前週 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-2 |
| E-10 | B-4 | 點 chip → 6 場 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-3 |
| E-11 | B-5, B-6, B-7 | 標題 + 雙隊表格 + staff 摺疊 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-4 |
| E-12 | B-8 | staff toggle 展開/收起 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-4b |
| E-13 | B-9 | 球員表格 11 欄 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-5 |
| E-14 | B-10 | 合計 row 顯示 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-6 |
| E-15 | B-11 | DNP 視覺處理 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-7 |
| E-16 | B-13 | 球員不可點 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-8 |
| E-17 | B-12 | DNP 不計入合計 | e2e | ❌→補寫 | features/boxscore.spec.ts › [qa-v2 補充] AC-6b |
| E-18 | B-14 | 6 類別卡片 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-9 |
| E-19 | B-15 | 每類 top 10 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-9b |
| E-20 | B-16 | rank/名/隊色點/值 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-10 |
| E-21 | B-17 | scoring 進階指標 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-10b |
| E-22 | B-18 | rebound 進階指標 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-10c |
| E-23 | B-30 | skeleton 載入 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-17 |
| E-24 | B-31 | boxscore Sheets 失敗限縮 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-18 |
| E-25 | B-32 | 失敗時 leaders 仍正常 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-18b |
| E-26 | B-33 | leaders 失敗限縮 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-19 |
| E-27 | B-34 | leaders 重試 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-19b |
| E-28 | B-35 | 該週 boxscore 空 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-20 |
| E-29 | B-36 | leaders 全空 | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-21 |
| E-30 | B-37 | leaders 部分空 | e2e | ❌→補寫 | features/boxscore.spec.ts › [qa-v2 補充] AC-21b |
| E-31 | B-26, B-27 | 桌機 RWD | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-15 |
| E-32 | B-28, B-29 | 手機 RWD | e2e | ❌→補寫 | features/boxscore.spec.ts › AC-16 |
| R-1 | B-1, B-25 | 頁面載入 + 預設 leaders | regression | ❌→補寫 | regression/boxscore.regression.spec.ts › R-1 |
| R-2 | B-19 | 切換 tab + 切回 + 無錯誤 | regression | ❌→補寫 | regression/boxscore.regression.spec.ts › R-2 |
| R-3 | B-21 | deep link from schedule | regression | ❌→補寫 | regression/boxscore.regression.spec.ts › R-3 |
| R-4 | B-32 | 限縮 error | regression | ❌→補寫 | regression/boxscore.regression.spec.ts › R-4 |
| R-5 | B-36 | leaders 全空 → empty | regression | ❌→補寫 | regression/boxscore.regression.spec.ts › R-5 |
| I-1 | B-39 | transformBoxscore 解析單場 | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-1 |
| I-2 | B-39 | 多場合併解析 | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-2 |
| I-3 | B-40, B-12 | DNP 標記 + 不計入合計 | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-3 |
| I-4 | B-39 | 空 rows → 空 weeks | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-4 |
| I-5 | B-31 | fetchBoxscore 成功 | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-5 |
| I-6 | B-31 | Sheets API 500 → error | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-6 |
| I-7 | B-31 | 網路錯誤 → error | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-7 |
| I-8 | B-33 | fetchData('stats') 成功 | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-8 |
| I-9 | B-33 | fetchData('stats') 全失敗 | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-9 |
| I-10 | B-36 | leaders 空資料仍非 error | integration | ❌→補寫 | integration/boxscore-parse.integration.test.ts › I-10 |
| U-1 | B-39 | transformBoxscore 22 行偏移 | unit | ⬜ Phase 2 | tests/unit/boxscore-utils.test.ts |
| U-2 | B-12 | totals 計算（排除 DNP） | unit | ⬜ Phase 2 | tests/unit/boxscore-utils.test.ts |
| U-3 | B-21 | URL query parse helper | unit | ⬜ Phase 2 | tests/unit/boxscore-deep-link.test.ts |
| U-4 | B-19, B-22 | URL update helper | unit | ⬜ Phase 2 | tests/unit/boxscore-deep-link.test.ts |
| U-5 | B-25, B-23, B-24 | 預設 tab 解析（query → leaders/boxscore） | unit | ⬜ Phase 2 | tests/unit/boxscore-deep-link.test.ts |
| U-6 | B-17, B-18 | leaders 進階指標格式化 | unit | ⬜ Phase 2 | tests/unit/leaders-format.test.ts |

說明：sp-writing-plans-v2 從此表讀取所有 U-/I-/E-/R-* ID 嵌入 task TDD step。Phase 3 讀 I-* + U-* 行；Phase 6 讀 E-* + R-* 行；Task 設計讀 U-* 行（⬜ 由 Phase 2 task 建立）。

---

## Phase 2 Task 必須產出（讓 integration / unit test 由紅燈轉綠）

| 模組 | 用途 | 對應 Coverage |
|------|------|--------------|
| `src/types/boxscore.ts` | BoxscoreData / BoxscoreWeek / BoxscoreGame / BoxscoreTeam / BoxscorePlayer 型別 | I-1~I-7、U-1~U-2 |
| `src/lib/boxscore-utils.ts` | `transformBoxscore(rows: string[][]): BoxscoreWeek[]`（沿用舊專案 page-boxscore.js 邏輯）+ `computeTeamTotals(players)` | U-1, U-2, I-1~I-4 |
| `src/lib/boxscore-api.ts` | `fetchBoxscore(): Promise<{ data, source: 'sheets' \| 'error', error? }>`（直打 Google Sheets API + 解析） | I-5~I-7 |
| `src/lib/boxscore-deep-link.ts` | `parseBoxscoreQuery(url) / buildBoxscoreUrl(state)`（tab + week + game query 處理） | U-3~U-5, E-6~E-8 |
| `src/lib/leaders-format.ts`（或 utils 整合） | `formatAdvancedScoring / formatAdvancedRebound` | U-6 |
| `src/components/boxscore/*.tsx` | `BoxscoreApp`（含 sub-tab 切換、deep link）+ `BoxscorePanel` + `LeadersPanel` + 各小元件 | E-1~E-32, R-1~R-5 |
| `src/pages/boxscore.astro` | 改寫為 React island wrapper（mount BoxscoreApp，傳 baseUrl） | E-1, R-1 |

整合點：
- 維持 `src/lib/api.ts` 的 `'stats'` kind 用於 leaders（GAS handleStats）
- 新增 `src/lib/boxscore-api.ts` 直打 Sheets API（不走 GAS），讀環境變數 `PUBLIC_SHEETS_API_KEY` 與 `PUBLIC_SHEET_ID`

---

## Phase 3 執行清單（Integration + Unit）

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
npm test
```

涵蓋：
- 既有：`tests/unit/{schedule-utils,staff-display,sample}.test.ts`、`tests/integration/api-fallback.integration.test.ts`
- 新補：`tests/integration/boxscore-parse.integration.test.ts`（10 cases）
- Phase 2 Task 須建立：`tests/unit/boxscore-utils.test.ts`、`tests/unit/boxscore-deep-link.test.ts`、`tests/unit/leaders-format.test.ts`

---

## Phase 6 執行清單（E2E）

```bash
cd /Users/waterfat/Documents/taan-basketball-league-issue-4
# UAT（=prod，本專案無獨立 UAT）：依 Issue 部署到 GitHub Pages 後
npx playwright test tests/e2e/regression/   # P0 回歸（schedule + boxscore）
npx playwright test tests/e2e/features/boxscore.spec.ts
```

涵蓋：
- 既有 regression：`schedule.regression.spec.ts`（4 cases × 2 projects = 8）
- 新補 regression：`boxscore.regression.spec.ts`（5 cases × 2 projects = 10）
- 新補 feature：`boxscore.spec.ts`（30 cases，desktop project + 部分 mobile）
- 既有 feature：`schedule.spec.ts`（保持綠燈）
