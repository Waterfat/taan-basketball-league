# Testing Guide — taan-basketball-league

## 初次設定

首次 clone 或切換新環境時，按順序執行：

1. 確認 `tests/environments.yml` 對應環境的 URLs 可連線
2. 注入環境變數至 `.env.local`（gitignored）：
   - `PUBLIC_SHEET_ID`、`PUBLIC_SHEETS_API_KEY`（值見帳密資訊檔 `taan-basketball-league` 區段）
3. 開瀏覽器確認 prod URL 與 Google Sheets 可正常連線

之後不需要重跑，測試資料持續沿用 prod Google Sheets live data。

## 測試環境變數

執行 unit / integration / E2E 前需在 `.env.local` 設定：

```bash
PUBLIC_SHEET_ID=<spreadsheet ID>
PUBLIC_SHEETS_API_KEY=<v4 API key with referrer + Sheets API restrictions>
```

vitest / playwright 自動載入。CI 由 GitHub Actions secrets 注入同名 vars。

## 何時需要重置資料

本專案資料源為 prod Google Sheets（live），**不做 seed/reset**。需要特定情境驗證時：
- 想驗賽季初空資料 → 直接看 `public/data/*.json` 範例 fallback
- 想驗特定週次 → 由賽務同仁更新 Sheets 內容

## 站台架構

| 頁面 | URL | 主要資料源（Sheets ranges）|
|------|-----|----------|
| 首頁 | `/` | home.json |
| 賽程 | `/schedule` | schedule.json |
| 戰績 | `/standings` | standings.json（`datas!P2:T7`）|
| 數據 | `/boxscore` | boxscore.json + leaders.json |
| 球員 | `/roster` | roster.json + dragon.json（`datas!D13:L76`）|

純展示型網站，無使用者帳號 / 登入流程。導覽列定義 `src/config/nav.ts`；多頁 Astro，島狀互動以 React `client:visible`。

## 特殊測試流程

### 三層 fallback 驗證
站台 `src/lib/api.ts` 三層 fallback：Sheets API → static JSON → error state。**E2E 必須驗端到端真實鏈路**：

- 🚫 禁止 `page.route` / `mockXxxAPI` helper / `route.fulfill`
- Sheets / JSON 任一掛 → component 三狀態接住，**不是讓測試 fallback 後標 PASS**
- 想要 deterministic 假資料 → 寫成 unit / integration test，不寫進 `tests/e2e/`

## 已知測試限制

| 限制 | 說明 |
|------|------|
| Sheets API key referrer 限制 | Playwright headless 可能被擋；prod E2E 需正確 origin |
| 5 分鐘瀏覽器 cache | 連續跑 spec 可能拿到 stale 資料 |
| Astro island hydration | 用 `expect(...).toBeVisible()`，勿用 `page.content()` 抓字串 |
| code-review-graph test_gaps | 三類函式 gap 直接 override（T1：已有 unit test 但 import call edge 追不到；T2：`tests/` 底下 helper / fixture / mock；T3：`src/components/` 內無 export 的內部子元件）|
| 時區 | 所有時間斷言使用 Asia/Taipei (UTC+8) |
| 視覺比對 | 色彩正確性需截圖人工比對，無自動化像素比對 |

## 命名 / 粒度規則

### 命名

| 類型 | 命名 | 範例 |
|------|------|------|
| Unit | `*.test.ts` | `tests/unit/api.test.ts` |
| Integration | `*.integration.test.ts` | `tests/integration/api-cache.integration.test.ts` |
| E2E regression（無認證、必跑）| `*.regression.spec.ts` | `tests/e2e/regression/home.regression.spec.ts` |
| E2E features（互動）| `*.spec.ts` | `tests/e2e/features/standings/standings-matrix.spec.ts` |

### 粒度

- **單一 spec 最大行數：200 行**（超過時按功能群組拆成子檔，放同一子目錄）
- **子目錄規則**：共用同一頁面的多個 spec 放 `features/<page>/`（如 `features/boxscore/`）；深一層互動群組再往下一層（如 `features/boxscore/boxscore-tab/`）
- **docstring 必填**：每個 `.spec.ts` 與 `tests/helpers/mock-api/` 子模組最上方必須有 `/** docstring */`，標明 Coverage（AC 編號）與測試資料策略
- **import path 深度**：子目錄深度決定層數 — `features/<page>/` 一層用 `../../../fixtures/`；`features/<page>/<group>/` 兩層用 `../../../../fixtures/`；helper 模組統一從 `tests/helpers/mock-api` import（index.ts re-export，不需改 import path）
- **並行安全**：同一目錄的 spec 不得共用 `let` 狀態（用 fixture 隔離），確保 `--workers` 並行下無競態
