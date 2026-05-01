# taan-basketball-league 專案規則

## 專案介紹

大安ㄍㄤㄍㄤ好籃球聯盟靜態前端網站。展示賽程、戰績、球員名單、龍虎榜、數據統計等內容。
資料來源以 Google Sheets API（`gas/Code.gs` webapp）為主、靜態 JSON 為 fallback。

## 技術棧

- **框架**：Astro 6（multi-page、Zero JS by default）
- **樣式**：Tailwind CSS 4
- **語言**：TypeScript（strict 模式）
- **套件管理**：npm
- **測試**：Vitest（unit）+ Playwright（E2E）
- **部署**：GitHub Pages（GitHub Actions 自動 build → push gh-pages）
- **PWA**：manifest.json + Service Worker

## 強制開發流程

- 每次 commit 前必須執行 `npm test`，測試未通過不得 commit
- 新增/修改頁面元件 → 必須同步新增/更新對應 Vitest 單元測試
- 新增/修改頁面 → 必須同步更新對應 Playwright E2E 測試
- `/review` 重構完 → 補齊測試覆蓋
- **部署後必須跑 `./scripts/e2e-test.sh https://waterfat.github.io/taan-basketball-league/` 驗收**
- 改動 `gas/Code.gs` → 需手動重新部署 Apps Script webapp（Code.gs 不在 Astro build 範圍）

## 資料夾規範

詳見 `docs/project-structure.md`。pre-commit hook 會跑 `scripts/folder-audit.sh` 擋違規目錄。

## 設計原則

### Astro Island 使用時機

- **預設純 HTML（zero JS）**：賽程表、戰績、球員名單、靜態頁面
- **才用 client island**：互動元件（tab 切換、即時 fetch、動畫過場、表單）
- **永遠用 `client:visible` 或 `client:idle`**，避免 `client:load` 拖慢首屏
- 互動 island 統一放 `src/components/islands/`

### Design Tokens 集中管理

- 顏色 / 圓角 / 字型 / 間距 → 一律在 `tailwind.config.mjs` 或 `src/styles/global.css` 的 `@theme`
- **禁止** hardcode 色碼（`#ff0000`）
- **禁止** inline style 寫死數值（隊伍配色由 `TEAM_CONFIG` 動態 class 注入例外）
- 隊伍配色 → `src/config/teams.ts` 的 `TEAM_CONFIG`

### RWD 規範

- **Mobile-first**：預設樣式手機版，桌機用 Tailwind 的 `md:` / `lg:` 覆寫
- 不寫死寬度，用 `max-w-*` + `w-full`
- 圖片必須 `max-w-full`

### TypeScript

- strict 模式不關
- API 回應有完整型別定義（`src/types/`）
- 任何 `any` 必須附 `// reason: ...` 註解

## 資料層

- 統一透過 `src/lib/api.ts` 抽象層，頁面元件不直接 `fetch()`
- 三層 fallback：Google Sheets API → 靜態 JSON → mock data
- 非同步必須處理三狀態：**Loading / Error / Empty**

## 測試指令

- 執行測試：`npm test`（Vitest）
- 監聽模式：`npm test -- --watch`
- E2E 測試：`npx playwright test`
- 測試檔案：`tests/unit/`（Vitest）、`tests/e2e/`（Playwright）

### E2E 三層覆蓋

1. **UI 結構**：頁面載入、元素可見、導航正確
2. **互動流程**：tab 切換、篩選、捲動、動畫過場
3. **資料驗證**：實際 fetch Google Sheets API，驗證不出 500、schema 不對齊不上 prod

## 前端注意事項

- Astro `<script>` 在 hydration 前不執行 → 不要把關鍵渲染邏輯放 `<script>`
- View Transitions（`<ClientRouter />`）跨頁元件記得加 `transition:persist` 才不會重新渲染
- Tailwind 4 的 `@theme` 用 CSS 變數，舊版 `theme.extend` 寫法不適用

## 部署

- **prod**：push `main` → GitHub Actions build → 推 `gh-pages` branch → GitHub Pages serve
- **dev**：本地 `npm run dev`（Vite HMR）
- 無 UAT / demo 環境

## PM 設定

使用 `pm-v2` SOP。Issue → Phase 1 規劃 → Phase 2 實作 → Phase 3 整合測試 → Phase 5 部署 → Phase 6 E2E。

## 專案特定規則

- `gas/` 目錄是 Google Apps Script 原始碼，**不會被 Astro build**，純粹版控用
- `data/*.json` 是備援資料，build 時會被打包成 `dist/data/*.json`
- 改隊伍配色只能改 `src/config/teams.ts`，不能在元件 inline 寫
- 所有圖片放 `public/images/`（不 hash）或 `src/assets/`（會 hash + optimize）
