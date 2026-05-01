# 資料夾規範（Canon）

本檔為 single source of truth，`scripts/folder-audit.sh` 依此檢查違規。

## 允許的根目錄

| 目錄 | 用途 |
|------|------|
| `src/` | Astro 原始碼（pages / components / layouts / lib / config / types / assets / styles） |
| `public/` | 靜態資源（圖片、icon、PWA manifest、SW）會被 build 直接複製 |
| `docs/` | 所有文件（規劃、規格、運維、研究、mockup） |
| `tests/` | 測試（unit / e2e） |
| `scripts/` | 自動化腳本（folder-audit / setup-hooks / e2e-test 等） |
| `gas/` | Google Apps Script 原始碼（**不被 build**，純版控） |
| `data/` | 靜態 JSON 備援資料（會被 Astro 打包） |
| `.github/` | GitHub Actions workflows |
| `.claude-output/` | Claude 產生的截圖 / 匯出（**不進 git**） |
| `.vscode/` | VSCode 設定（建議共享） |
| `node_modules/` | 套件（不進 git） |
| `dist/` | Build 產物（不進 git） |

## docs 子目錄用途

- `docs/delivery/` — 已交付文件（PRD / 客戶版說明 / Release Notes）
- `docs/specs/` — 技術規格
  - `docs/specs/plans/` — Issue 對應的實作計畫（pm-v2 產出）
- `docs/ops/` — 運維（deploy-config.yml / health-check.md）
- `docs/research/` — 研究筆記、設計探索
- `docs/mockups/` — 設計稿、Figma 連結

## src 子目錄

- `src/pages/` — Astro 頁面（file-based routing）
- `src/layouts/` — 共用 Layout 元件
- `src/components/` — 純靜態 Astro 元件
- `src/components/islands/` — 互動元件（React/Vue/Svelte island，client-side hydration）
- `src/lib/` — 共用邏輯（api.ts、utils）
- `src/config/` — 設定常數（teams.ts、site.ts）
- `src/types/` — TypeScript 型別定義
- `src/assets/` — 會被處理的資源（圖片 → 自動 optimize）
- `src/styles/` — 全域 CSS / Tailwind config 補強

## tests 子目錄

- `tests/unit/` — Vitest 單元測試
- `tests/e2e/` — Playwright E2E 測試
  - `tests/e2e/regression/` — 無認證的回歸測試（純展示頁面）
  - `tests/e2e/features/` — 帶 storageState 的功能測試（保留給未來會員功能）
  - `tests/e2e/.auth/` — storageState 檔案（**不進 git**）

## 違規範例

- ❌ 根目錄出現 `*.png`（截圖應在 `.claude-output/screenshots/` 或 `public/images/`）
- ❌ 根目錄出現 `PLAN-*.md`（應在 `docs/specs/plans/`）
- ❌ 根目錄出現 `*.html`（pure Astro 專案不應該有）
- ❌ `src/` 之外的非標準目錄

## 加入新允許目錄

需修改 `scripts/folder-audit.sh` 的 `ALLOWED_ROOT_DIRS` 並更新本文件。
