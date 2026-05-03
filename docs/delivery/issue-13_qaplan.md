# Issue #13 QA Plan — fix: 新網站資料管線錯誤

**分級**：M
**範圍**：本 Issue 只修資料訊號來源，不動版面
**平台偵測**：Web（Astro + Vitest + Playwright）
**embed 未執行**：N/A（Phase 1 規劃，無 build_or_update）

---

## Fixture Inventory（Step 1.5）

### 既有 fixtures（直接用，無需新增）

| Fixture | 路徑 | 涉及 entity | 4-action |
|---------|------|------------|----------|
| boxscore | `tests/fixtures/boxscore.ts` | 逐場比分 | 直接用 |
| dragon | `tests/fixtures/dragon.ts` | 龍虎榜 | 直接用 |
| home | `tests/fixtures/home.ts` | 首頁 dashboard | 直接用 |
| leaders | `tests/fixtures/leaders.ts` | 領先榜 | 直接用 |
| roster | `tests/fixtures/roster.ts` | 球員名單 | 直接用 |
| schedule | `tests/fixtures/schedule.ts` | 賽程 | 直接用 |
| standings | `tests/fixtures/standings.ts` | 戰績 | 直接用 |

→ Issue #13 的「移資料源」不引入新 entity，現有 7 支 fixture 完全覆蓋。

### Refactor Backlog（不在本 Issue 處理）

- (none) — 本 Issue 結束時 mock-api/ helpers 已隨 source 切換更新

### Deprecated Scan

| 項目 | 狀態 | 備註 |
|------|------|------|
| `tests/helpers/mock-api/index.ts` 第 5 行殘留 `<<<<<<< HEAD` 衝突標記 | 🔧 本 Issue 順手清理 | 在 docstring 註解內，不影響 runtime 但顯示混亂 |
| `tests/integration/api-fallback.integration.test.ts` 全 12 個 case mock `script.google.com` | 🔧 本 Issue 必修 | source 從 `'gas'` 改為 `'sheets'`，URL pattern 改為 `sheets.googleapis.com` |
| `tests/helpers/mock-api/schedule.ts` 的 `GAS_PATTERN = /script\.google\.com/` | 🔧 本 Issue 必修 | 改為 SHEETS_PATTERN，所有依賴此 pattern 的 mock helper（home/standings/leaders/roster/dragon）一併更新 |
| `tests/integration/boxscore-parse.integration.test.ts` 第 148 行註解提到 `GAS_URL 未設定時` | 🔧 本 Issue 順手 | 註解過時 |

---

## AC 行為抽取（Step 2）

### 核心情境

**AC-1**：球員打開新網站首頁 → 看到的「目前是第幾屆/週、比賽日期、地點」跟舊網站一致

- **B-1**：`fetchData('home')` 走 Sheets API（不再走 GAS Webapp）
- **B-2**：首頁 island 顯示的 phase + week + 比賽日期 + 地點與舊網站一致

**AC-2**：球員打開戰績榜頁 → 6 隊勝敗、勝率、連勝紀錄跟舊網站一致

- **B-3**：`fetchData('standings')` 走 Sheets API
- **B-4**：standings 頁顯示 6 隊資料

**AC-3**：球員打開龍虎榜頁 → 球員積分排行跟舊網站一致

- **B-5**：`fetchData('dragon')` 走 Sheets API
- **B-6**：roster?tab=dragon 龍虎榜資料顯示

**AC-4**：教練改 Sheets → 5 分鐘內球員看到新值

- **B-7**：在 cache TTL 內第二次同 kind 呼叫 → 不重打 Sheets API（cache hit）
- **B-8**：cache TTL 過後 → 重打 Sheets API（refetch）
- **B-9**：cache TTL 設為 5 \* 60 \* 1000 ms

**AC-5**：戰績榜「最近 6 場」欄位有 ○✕（A2 順帶）

- **B-10**：standings 頁的「最近 6 場」欄位有資料 [若仍空白 → 拆 issue]

**AC-6**：boxscore「逐場 Box」分頁顯示比分（A3 順帶）

- **B-11**：boxscore 「逐場 Box」分頁有資料 [若仍空白 → 拆 issue]

### 邊界 / 異常

**AC-7**：Sheets API 完全打不到 → 不白屏，靜默 fallback 靜態 JSON

- **B-12**：Sheets fetch fail → fallback static JSON，回傳 `source: 'static'`
- **B-13**：UI 不顯示「資料過期」之類提示 [qa-v2 補充]

**AC-8**：5 分鐘內第二次打開同頁 → 不重新打 Sheets API

- **B-14**：（同 B-7）

**AC-9**：Sheets + 靜態 JSON 都失敗 → 該區塊顯示空狀態，整站不崩潰

- **B-15**：兩層都 fail → `source: 'error'`，`data: null`
- **B-16**：頁面顯示 empty state（不 throw / 白屏）[qa-v2 補充]

### 順手清理（Issue body 範圍內）

- **B-17**：`src/lib/api.ts` 不再 import `import.meta.env.PUBLIC_GAS_WEBAPP_URL`
- **B-18**：`src/env.d.ts` 移除 `PUBLIC_GAS_WEBAPP_URL` 型別宣告
- **B-19**：`.env.example` 移除 `PUBLIC_GAS_WEBAPP_URL` 區塊
- **B-20**：`tests/environments.yml` 移除 `env_vars.PUBLIC_GAS_WEBAPP_URL`，改為 `PUBLIC_SHEET_ID` + `PUBLIC_SHEETS_API_KEY`
- **B-21**：`README.md` 移除對 GAS Webapp 的描述
- **B-22**：`docs/specs/integrations.md` 移除 GAS Webapp 區塊
- **B-23**：`tests/helpers/mock-api/*.ts` GAS_PATTERN 改為 SHEETS_PATTERN
- **B-24**：`gas/Code.gs` 保留不刪（歷史參考）

---

## Coverage Matrix（Step 5）

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|-------------|------|------|-----|------|------|
| I-1 | B-1 | `fetchData('home')` 命中 sheets.googleapis.com URL，回傳 `source: 'sheets'` + transformed home data | integration | ❌→已補寫 | `tests/integration/api-sheets.integration.test.ts` |
| I-2 | B-3 | `fetchData('standings')` 命中 sheets URL，回傳 6 隊 standings | integration | ❌→已補寫 | 同上 |
| I-3 | B-5 | `fetchData('dragon')` 命中 sheets URL，回傳 dragonboard | integration | ❌→已補寫 | 同上 |
| I-4 | B-7, B-14 | cache hit：5 分鐘內第二次同 kind 呼叫不重打 fetch | integration | ❌→已補寫 | `tests/integration/api-cache.integration.test.ts` |
| I-5 | B-8 | cache miss after TTL：5 分鐘後重新打 fetch | integration | ❌→已補寫 | 同上 |
| I-6 | B-9 | cache TTL 常數設為 5 分鐘（5\*60\*1000 ms）| integration | ❌→已補寫 | 同上 |
| I-7 | B-12 | Sheets API HTTP 500 → fallback `source: 'static'` | integration | 🔧 修現有 | `tests/integration/api-fallback.integration.test.ts`（Phase 2 修） |
| I-8 | B-15 | Sheets + JSON 都失敗 → `source: 'error'`，`data: null` | integration | 🔧 修現有 | 同上 |
| I-9 | B-17 | `src/lib/api.ts` 不再 reference PUBLIC_GAS_WEBAPP_URL | integration | ❌→已補寫 | `tests/integration/api-cleanup.integration.test.ts` |
| E-1 | B-2 | 首頁 phase + week + 日期 + 地點顯示（mock Sheets 回特定值，驗 UI 有渲染）| e2e | ✅ 既有（mock-api 切 Sheets pattern 後 Phase 2 自動覆蓋）| `tests/e2e/features/home/` |
| E-2 | B-4 | standings 頁 6 隊資料 + 勝率 + 連勝顯示 | e2e | ✅ 既有 | `tests/e2e/features/standings.spec.ts` |
| E-3 | B-6 | roster?tab=dragon 龍虎榜 TOP 5 顯示 | e2e | ✅ 既有 | `tests/e2e/features/roster/` |
| E-4 | B-13 | Sheets fail 時 UI 不顯示「資料過期」提示，靜默 fallback | e2e | ❌→已補寫 | `tests/e2e/features/data-fallback.spec.ts` |
| E-5 | B-10 | A2：standings 「最近 6 場」欄位有 ○✕（若仍空白 → 拆 issue）| e2e | 🔧 修現有 | `tests/e2e/features/standings.spec.ts`（Phase 2 補 assert）|
| E-6 | B-11 | A3：boxscore 「逐場 Box」分頁有比分（若仍空白 → 拆 issue）| e2e | 🔧 修現有 | `tests/e2e/features/boxscore/` |
| E-7 | B-16 | 兩層全失敗時頁面顯示 empty state 不白屏 | e2e | ❌→已補寫 | `tests/e2e/features/data-fallback.spec.ts` |
| U-1 | B-9 | cache TTL 常數值 = 5 \* 60 \* 1000（unit） | unit | ⬜ Phase 2 | `tests/unit/api-cache-ttl.test.ts` |
| U-2 | B-23 | mock-api/ helpers SHEETS_PATTERN 正則匹配實際 Sheets URL | unit | ⬜ Phase 2 | `tests/unit/mock-api-pattern.test.ts` |

說明：
- ❌→已補寫 = qa-v2 在本階段建立的新測試檔案
- 🔧 修現有 = 現有測試檔需在 Phase 2 task 修改（Phase 2 task 包此修改）
- ⬜ Phase 2 = unit test 由 Phase 2 task 撰寫
- ✅ 既有 = 已有 testcase，mock pattern 改完即生效（Phase 2 自動覆蓋）

---

## Phase 3 執行清單（Integration）

✅ 既有：
- `tests/integration/boxscore-parse.integration.test.ts`（boxscore 直打 Sheets，Issue #4 留下，無需改動）

❌→已補寫：
- `tests/integration/api-sheets.integration.test.ts`（I-1 ~ I-3）
- `tests/integration/api-cache.integration.test.ts`（I-4 ~ I-6）
- `tests/integration/api-cleanup.integration.test.ts`（I-9）

🔧 Phase 2 task 修改：
- `tests/integration/api-fallback.integration.test.ts`（I-7, I-8 — 全部 12 個 case 從 GAS mock 改 Sheets mock）

---

## Phase 6 執行清單（E2E）

✅ 既有（修完 mock-api SHEETS_PATTERN 後自動覆蓋）：
- `tests/e2e/regression/boxscore.regression.spec.ts`
- `tests/e2e/regression/schedule.regression.spec.ts`
- `tests/e2e/features/home/`
- `tests/e2e/features/standings.spec.ts`
- `tests/e2e/features/roster/`
- `tests/e2e/features/boxscore/`
- `tests/e2e/features/schedule.spec.ts`

❌→已補寫：
- `tests/e2e/features/data-fallback.spec.ts`（E-4, E-7：Sheets fail 時靜默 fallback + 兩層全失敗時 empty state）

🔧 Phase 2 task 補 assertion：
- `tests/e2e/features/standings.spec.ts`（E-5 「最近 6 場」欄位 ○✕ assert）
- `tests/e2e/features/boxscore/`（E-6 「逐場 Box」分頁有比分 assert）

---

## 環境變數需求（Step 4-0 d）

本 Issue 涉及 env 變動：

**新增至 environments.yml**（其實 Issue #4 已有，需確認）：

```yaml
PUBLIC_SHEET_ID:
  purpose: Google Sheets spreadsheet ID（直接打 Sheets API v4 用）
  used_by: [src/lib/api.ts, src/lib/boxscore-api.ts]
  sources:
    acc_pw_section: taan-basketball-league
    ci: gh variable (vars)
  inject_at:
    dev: .env.local
    test: vi.stubEnv('PUBLIC_SHEET_ID', '<test_id>') 於 integration test beforeEach
    build: .github/workflows/*.yml build job env
  required_for: [dev, test, build, deploy]

PUBLIC_SHEETS_API_KEY:
  purpose: Google Sheets API key（v4 values.get / values:batchGet 認證）
  used_by: [src/lib/api.ts, src/lib/boxscore-api.ts]
  sources:
    acc_pw_section: taan-basketball-league
    ci: gh secret
  inject_at:
    dev: .env.local
    test: vi.stubEnv('PUBLIC_SHEETS_API_KEY', '<test_key>') 於 integration test beforeEach
    build: .github/workflows/*.yml build job env
  required_for: [dev, test, build, deploy]
```

**移除自 environments.yml**：
- `env_vars.PUBLIC_GAS_WEBAPP_URL`（B-20）

**GCP 設定（Phase 5 部署前必須完成）**：
- API key referrer 限制：`https://waterfat.github.io/*` + `http://localhost:4321/*`
- API 限制：只開 Google Sheets API v4

---

## 待辦提醒（Phase 2 task 設計時務必涵蓋）

1. 移除 GAS 相關 7 處：`src/lib/api.ts`, `src/env.d.ts`, `.env.example`, `tests/environments.yml`, `tests/helpers/mock-api/schedule.ts`（GAS_PATTERN）, README.md, `docs/specs/integrations.md`
2. 新增 Sheets ranges 設定（從 `gas/Code.gs` 或舊 `js/api.js` line 15-30 的 `sheetsRanges` 移植）
3. 新增 transformer 函式（per kind：home/schedule/standings/roster/dragon/leaders）— 從 GAS Code.gs 對應 handler 移植到前端
4. 新增 5 分鐘 cache 層（從 js/api.js line 75-85 移植）
5. 清掉 `tests/helpers/mock-api/index.ts` 第 5 行殘留衝突標記
