# QA Plan — Issue #9
# [M] refactor: 拆分大型 e2e spec 檔 + helpers/mock-api

**平台偵測**：Web（Playwright E2E）  
**產出日期**：2026-05-03

---

## Fixture Inventory

| 動作 | Entity | 說明 |
|------|--------|------|
| 直接用 | mockBoxscoreWeek / mockBoxscoreGame | 拆分後 spec 沿用，不改 fixture 內容 |
| 直接用 | mockFullLeaders / mockEmptyLeaders / mockPartialLeaders | 同上 |
| 直接用 | mockBoxscoreSheetsAPI / mockLeadersAPI / mockBoxscoreAndLeaders | helpers/mock-api 拆分，re-export 後 API 不變 |
| Refactor Backlog | Game factory (3 相似) | T2：考慮合併，本 Issue 不處理 |
| Refactor Backlog | Leaders factory (5 相似) | T2：考慮合併，本 Issue 不處理 |
| Refactor Backlog | Standings factory (4 相似) | T2：考慮合併，本 Issue 不處理 |
| Refactor Backlog | Week factory (5 相似) | T2：考慮合併，本 Issue 不處理 |

---

## AC 行為抽取

| AC | 行為 B-ID | 描述 | 隱含情境 |
|----|-----------|------|---------|
| AC-1 | B-1 | 拆分後 hero.spec.ts 測試仍通過（AC-1, 1b） | 2 tests |
| AC-1 | B-2 | 拆分後 tab-switch.spec.ts + deep-link.spec.ts 測試仍通過（AC-11, 13, 13b, 14, 12, 12b）| 6 tests |
| AC-1 | B-3 | 拆分後 boxscore-tab/*.spec.ts 測試仍通過（AC-2~8 系列）| 8 tests |
| AC-1 | B-4 | 拆分後 leaders-tab.spec.ts 測試仍通過（AC-9, 9b, 10 系列）| 5 tests |
| AC-1 | B-5 | 拆分後 states.spec.ts 測試仍通過（AC-17~21b）| 7 tests |
| AC-1 | B-6 | 拆分後 rwd.spec.ts 測試仍通過（AC-15, 16）| 2 tests |
| AC-2 | B-7 | mock-api 拆分後所有 spec 仍可 import 並執行，無 path error | compile + run 等價驗證 |
| AC-3 | B-8 | tests/e2e/features/boxscore/ 下所有 9 個 spec 檔頂部有 /** docstring | [qa-v2 補充] |
| AC-4 | B-9 | tests/helpers/mock-api/ 下所有 4 個頁面子檔頂部有 /** docstring | [qa-v2 補充] |
| AC-5 | B-10 | scripts/folder-audit.sh 執行 exit 0，無目錄結構違規 | integration |
| AC-6 | B-11 | CLAUDE.md 「強制開發流程」含 docstring 歸屬規則 | [qa-v2 補充] 文件驗 |
| AC-7 | B-12 | tests/TESTING.md 含「E2E 檔案粒度原則」這節 | [qa-v2 補充] 文件驗 |

---

## Coverage Matrix

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|------------|------|------|----|------|------|
| E-1 | B-1~6 | 拆分後原 30 個 boxscore e2e 全數通過 | e2e | ✅ 既有（重跑驗行為等價） | tests/e2e/features/boxscore/* |
| E-2 | B-7 | mock-api split 後所有 spec import 正常 + 可執行 | e2e | ✅ 既有（重跑驗等價） | 全部 e2e spec |
| I-1 | B-10 | scripts/folder-audit.sh exit 0 | integration | ❌→ 補 bash check | scripts/folder-audit.sh |
| I-2 | B-8 | e2e boxscore/ 下 9 個 spec 頂部都有 docstring | integration | [qa-v2 補充]❌→ 補 bash check | tests/e2e/features/boxscore/ |
| I-3 | B-9 | mock-api/ 下 4 個子檔頂部都有 docstring | integration | [qa-v2 補充]❌→ 補 bash check | tests/helpers/mock-api/ |
| I-4 | B-11 | CLAUDE.md 含 docstring 歸屬規則 | integration | [qa-v2 補充]❌→ 補 bash check | CLAUDE.md |
| I-5 | B-12 | TESTING.md 含 E2E 粒度原則節 | integration | [qa-v2 補充]❌→ 補 bash check | tests/TESTING.md |

---

## Phase 3 執行清單（Integration）

### 既有（重跑驗等價）
- `npm test`（Vitest unit，確保 refactor 未影響 unit）

### 新補 bash checks（寫入 scripts/verify-issue-9.sh）
- I-1：`bash scripts/folder-audit.sh` → exit 0
- I-2：`grep -rL '/\*\*' tests/e2e/features/boxscore/*.spec.ts tests/e2e/features/boxscore/**/*.spec.ts` → 無輸出（所有檔有 docstring）
- I-3：`grep -rL '/\*\*' tests/helpers/mock-api/{schedule,boxscore,standings,leaders}.ts` → 無輸出
- I-4：`grep -q "docstring" CLAUDE.md && echo OK` → OK
- I-5：`grep -q "E2E 檔案粒度原則" tests/TESTING.md && echo OK` → OK

---

## Phase 6 執行清單（E2E）

**執行環境**：Production（https://waterfat.github.io/taan-basketball-league/）

| # | 案例集 | 說明 |
|---|--------|------|
| 1 | `npx playwright test tests/e2e/regression/` | P0 回歸（boxscore + schedule） |
| 2 | `npx playwright test tests/e2e/features/boxscore/` | 拆分後全套 boxscore feature tests（E-1 驗收主體）|

**驗收條件**：所有原 30 tests 通過，行為等價，無測試遺漏。
