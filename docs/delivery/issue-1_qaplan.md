# Issue #1 QA Plan — /schedule 賽程頁

**平台偵測**：Web 靜態站（Astro 6 + Tailwind 4 + TypeScript strict）
**測試框架**：Vitest（unit + integration） + Playwright（E2E）
**測試環境**：dev = http://localhost:4321/taan-basketball-league/、prod = https://waterfat.github.io/taan-basketball-league/

---

## 平台偵測結果

- 框架：Astro 6（multi-page，純靜態）
- E2E 工具：Playwright（projects: regression / regression-mobile / features）
- Auth：無（公開讀取）
- 資料源：Google Apps Script Webapp + 靜態 JSON fallback
- Test fixtures: `tests/fixtures/schedule.ts`（已建立工廠函式）
- Mock helper: `tests/helpers/mock-api.ts`（攔截 GAS / JSON 請求）

## Tag 搜尋結果（既有 testcase）

新專案首個 Issue，無既有 testcase 可復用。所有 testcase 為新建。

---

## Coverage Matrix

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|---|---|---|---|---|---|
| E-1 | B-1.1 | 預設顯示當前週的 Hero header | e2e | ❌→已補寫 | `tests/e2e/features/schedule.spec.ts:AC-1` |
| E-2 | B-1.2 | Hero 顯示週次 + 階段 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-1` |
| E-3 | B-1.3 | Hero 顯示日期 + 場地 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-1` |
| E-4 | B-1.4 | chip timeline 渲染所有週 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-1` |
| E-5 | B-1.5 | 當前週 chip 高亮 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-1` |
| E-6 | B-1.6 | 渲染 6 張對戰卡 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-1` |
| E-7 | B-2.1~3 | 點 chip 切週同步更新 Hero + cards | e2e | ❌→已補寫 | `schedule.spec.ts:AC-2` |
| E-8 | B-3.1 | 完賽比分大字顯示 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-3` |
| E-9 | B-3.2 | 贏家視覺強調 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-3` |
| U-1 | B-3.3 | 平手場次處理 [qa-v2 補充] | unit | ⬜ Phase 2 | `tests/unit/winner-logic.test.ts` |
| E-10 | B-4.1 | upcoming 比分顯示「— vs —」 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-4` |
| E-11 | B-4.2 | upcoming 徽章「即將進行」 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-4` |
| E-12 | B-5.1~2 | finished 卡片可點 → /boxscore | e2e | ❌→已補寫 | `schedule.spec.ts:AC-5` |
| E-13 | B-5.3 | upcoming 卡片不可點 [qa-v2 補充] | e2e | ❌→已補寫 | `schedule.spec.ts:AC-5b [qa-v2]` |
| E-14 | B-6.1~3 | 展開工作人員 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-6` |
| E-15 | B-6.4 | 再次點擊收起 [qa-v2 補充] | e2e | ❌→已補寫 | `schedule.spec.ts:AC-6b [qa-v2]` |
| U-2 | B-6.5 | 無 staff 資料時 toggle 顯示處理 [qa-v2 補充] | unit | ⬜ Phase 2 | `tests/unit/staff-display.test.ts` |
| E-16 | B-7.1~2 | 「休」chip 點開顯示原因 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-7` |
| E-17 | B-7.3 | 點「休」不切走 Hero header [qa-v2 補充] | e2e | ❌→已補寫 | `schedule.spec.ts:AC-7b [qa-v2]` |
| E-18 | B-8.1 | mobile chip 顯示緊湊版「W5」 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-8 (regression-mobile)` |
| E-19 | B-8.2 | mobile 卡片直排 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-8` |
| E-20 | B-9.1 | desktop chip 顯示「W5 · 2/7」 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-9 (regression)` |
| E-21 | B-9.2 | desktop 卡片並排兩欄 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-9` |
| E-22 | B-10.1~2 | 載入中顯示 skeleton | e2e | ❌→已補寫 | `schedule.spec.ts:AC-10` |
| E-23 | B-10.3 | 資料返回後 skeleton 消失 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-10` |
| I-1 | B-11.1 | GAS 失敗 fallback JSON | integration | ❌→已補寫 | `tests/integration/api-fallback.integration.test.ts` |
| I-2 | B-11.2 | GAS + JSON 全失敗 | integration | ❌→已補寫 | `api-fallback.integration.test.ts` |
| E-24 | B-11.2~3 | 全失敗顯示「無法載入」+ 重試按鈕 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-11` |
| E-25 | B-11.4 | 點重試重新載入 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-11b` |
| E-26 | B-12.1~3 | 空狀態顯示 emoji + 訊息 + 看上一週按鈕 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-12` |
| U-3 | B-12.4 | 找上一個有資料週的邏輯 | unit | ⬜ Phase 2 | `tests/unit/find-previous-week.test.ts` |
| E-27 | B-13.1 | 第 1 週「看上一週」禁用/隱藏 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-13` |
| E-28 | B-14.1 | 連續 3 週暫停 → 3 個獨立 chip | e2e | ❌→已補寫 | `schedule.spec.ts:AC-14` |
| E-29 | B-14.2 | 每個「休」chip 都可獨立顯示原因 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-14` |
| E-30 | B-15.1 | 同週 finished + upcoming 各自正確渲染 | e2e | ❌→已補寫 | `schedule.spec.ts:AC-15` |
| U-4 | B-1.1 | getCurrentWeek 邏輯（從 currentWeek 找對應 week 物件） | unit | ⬜ Phase 2 | `tests/unit/schedule-utils.test.ts` |
| U-5 | B-3.1 | isWinner / 比分判斷邏輯 | unit | ⬜ Phase 2 | `tests/unit/schedule-utils.test.ts` |
| U-6 | B-7.1 | suspended week 偵測邏輯 | unit | ⬜ Phase 2 | `tests/unit/schedule-utils.test.ts` |

說明：
- E-* 已寫入 `tests/e2e/features/schedule.spec.ts`，total ~21 個 describe block，覆蓋 AC-1~15 + qa-v2 補充
- I-* 已寫入 `tests/integration/api-fallback.integration.test.ts`，4 個 case 已驗證通過
- U-* ⬜ 由 Phase 2 task 建立

---

## Phase 3 執行清單（Integration）

- 新補：`tests/integration/api-fallback.integration.test.ts`
  - GAS 成功 → source: gas
  - GAS 失敗 → fallback JSON（source: static）
  - 全失敗 → source: error
  - GAS_URL 是 placeholder → 直接走 JSON

→ 已驗證：`npm test` 4/4 通過

## Phase 6 執行清單（E2E）

**P0 regression 維持空**（首個 Issue，無 cross-issue 行為需要回歸）

**Features：** `tests/e2e/features/schedule.spec.ts`
- describe: `Schedule Page @schedule` — 17 個 case（AC-1~15 + qa-v2 補充）
- describe: `Schedule Page RWD @schedule` — 2 個 case（mobile / desktop viewport）

執行命令：
```bash
npx playwright test tests/e2e/features/schedule.spec.ts
# 或：npm run test:e2e -- --project=features --project=regression-mobile
```

---

## 測試資料策略（Issue 確認）

- **正常情境（AC-1~9, AC-14~15）**：用 `tests/fixtures/schedule.ts` 工廠函式建立 `mockFullSchedule()` 等資料
  - 包含已完賽週（W1, W5）+ 暫停週 × 3（過年連假）+ 即將進行週（W7）+ 混合週（W6）
  - 結構符合 `public/data/schedule.json` 真實 schema
- **空狀態 / 錯誤 / 延遲（AC-10~12, AC-13）**：手寫小量 mock + `mockScheduleAPI()` helper 模擬
- **絕不打 production GAS**：所有 fetch 在 Playwright 測試啟動時被 `page.route()` 攔截

---

## 前置資源

| 類型 | 狀態 | 路徑 |
|---|---|---|
| Auth helper | ❌ 不需要（無登入功能） | — |
| Fixtures | ✅ 已建立 | `tests/fixtures/schedule.ts` |
| Mock API helper | ✅ 已建立 | `tests/helpers/mock-api.ts` |
| Visual helper | ⏸ 不在本 Issue 範圍 | — |

---

## 已知限制

- E2E 中比分大字判斷靠 `data-testid` 與 `data-winner` attribute（待 Phase 2 實作）
- chip 切換的 URL 同步行為（deep link 支援）目前未在 AC 內，未列入測試（如果有需要可加 query param 機制）
- Visual screenshot regression（截圖比對）未啟用，UI 視覺對比靠人工 / Playwright 內建 snapshot
