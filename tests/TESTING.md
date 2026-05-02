# 測試規範

## 測試框架

| 用途 | 框架 | 目錄 |
|------|------|------|
| Unit | Vitest（jsdom） | `tests/unit/` |
| E2E | Playwright | `tests/e2e/` |

## 執行指令

```bash
# Unit
npm test                  # 跑一次
npm test -- --watch       # 監聽模式
npm run test:unit:ui      # Vitest UI

# E2E
npx playwright test                       # 全部
npx playwright test --project=regression  # 只跑回歸
npx playwright test --ui                  # Playwright UI
./scripts/e2e-test.sh                     # 完整流程（含 dev server）
./scripts/e2e-test.sh https://prod.url    # 跑 prod
```

## 命名規則

| 類型 | 命名 | 範例 |
|------|------|------|
| Unit | `*.test.ts` | `tests/unit/api.test.ts` |
| E2E regression（無認證） | `*.regression.spec.ts` | `tests/e2e/home.regression.spec.ts` |
| E2E features（互動） | `*.spec.ts` | `tests/e2e/standings-tab.spec.ts` |

## E2E 三層覆蓋（必要）

每個 scenario 必須包含：

1. **UI 結構**：頁面載入、關鍵元素可見、導航正確
2. **互動流程**：tab 切換、捲動、動畫過場、行動裝置 menu
3. **資料驗證**：實際 fetch Google Sheets API（或 mock JSON），驗證不出 500、loading/error/empty 狀態正常切換

## E2E 檔案粒度原則

- **單一 spec 最大行數：200 行**（超過時按功能群組拆成子檔，放同一子目錄）
- **子目錄規則**：共用同一頁面的多個 spec 放 `features/<page>/` 子目錄（如 `features/boxscore/`）；深一層互動群組再往下一層（如 `features/boxscore/boxscore-tab/`）
- **docstring 必填**：每個 `.spec.ts` 與 `tests/helpers/mock-api/` 子模組最上方必須有 `/** docstring */`，標明 Coverage（AC 編號）與測試資料策略
- **import path**：子目錄深度決定層數 — `features/<page>/` 一層用 `../../../fixtures/`；`features/<page>/<group>/` 兩層用 `../../../../fixtures/`；helper 模組統一從 `tests/helpers/mock-api` import（index.ts re-export，不需改 import path）
- **並行安全**：同一目錄的 spec 不得共用 `let` 狀態（用 fixture 隔離），確保 `--workers` 並行下無競態

## 目錄結構

```
tests/
├── unit/                   # Vitest unit tests
│   ├── api.test.ts
│   └── teams-config.test.ts
├── e2e/
│   ├── regression/         # 純展示頁 smoke
│   ├── features/           # 互動元件
│   ├── helpers/            # 共用工具（fixtures, mocks）
│   └── .auth/              # storageState（不進 git，保留給未來）
└── environments.yml        # 環境清單
```

## Mock 策略

- **Unit**：Google Sheets API 一律 mock（用 MSW / vitest-fetch-mock）
- **E2E regression**：mock 失敗時 fallback 到 `public/data/*.json`，確保站台仍可渲染
- **E2E features**：可用 `page.route('**/exec*', ...)` 攔截 GAS 回應

## code-review-graph test_gaps 排除規則

qa-v2 Phase 3 跑 `detect_changes_tool` 時，以下三類函式的 gap **直接 override，不觸發 Phase 2 retry**：

| 類型 | 判斷條件 | 原因 |
|------|---------|------|
| T1：已有 unit test | gap 函式名 grep `tests/unit/` 找得到 | tree-sitter 無法追蹤 TS named import call edge |
| T2：測試基礎設施 | gap 函式所在檔案路徑在 `tests/` 底下 | test helper / fixture / mock，本不需測試 |
| T3：React 內部子元件 | gap 函式在 `src/components/` 且在該檔案內**無 export** | JSX `<Component />` 不被識別為 function call，但已由父元件測試或 E2E 覆蓋 |

命中任一類型 → Phase 3 section 記「override（T1/T2/T3）+ 證據」，結果寫 ✅。
三類均未命中 → 視為真實缺口，退回 Phase 2 補測試。

## 部署後驗收

1. push main → GitHub Actions 自動跑 lint + unit + e2e（regression project）
2. Build pass → 部署 gh-pages
3. 部署完成 → 手動或排程跑 `./scripts/e2e-test.sh https://waterfat.github.io/taan-basketball-league/`
