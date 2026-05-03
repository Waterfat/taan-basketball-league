# Issue #17 Task 4: transformHome 完整 composite shape + home-utils miniStandings 排序

## 目標
將 `transformHome` 從單一 meta range stub 擴充為 4 ranges composite，補完 standings / dragonTop10 / miniStats 三段欄位（與 gas/Code.gs `handleHome()` 對齊），並新增 `pickMiniStandings` 工具函式（依 rank 升冪排序取 top n）。同步啟用 `SHEETS_RANGES['home']` 多 range，讓 `fetchData('home')` 直接從 Sheets 取得完整 composite。

## 要修改/新增的檔案
- Modify: `src/lib/api-transforms.ts`（transformHome 從 1 range stub → 4 ranges composite + 新增 deriveHomeStreakType / extractMiniPlayers helpers）
- Modify: `src/lib/api.ts`（SHEETS_RANGES['home'] 啟用 multi-range；TRANSFORMERS['home'] 註冊 transformHome）
- Modify: `src/lib/home-utils.ts`（新增 pickMiniStandings 函式）
- Modify: `tests/unit/api-transforms.test.ts`（新增 `transformHome (Issue #17)` describe，3 cases：composite shape / dragonTop10 上限 10 / streakType 衍生）
- Modify: `tests/unit/home-utils.test.ts`（新增 `pickMiniStandings` describe，4 cases：top n 排序 / n 超過長度 / 空陣列 / 不 mutate）
- Modify: `tests/integration/api-sheets.integration.test.ts`（新增 `fetchData(home)` composite shape assertion）

## Plan 引用
`docs/specs/plans/issue-17-data-sync-fix.md` 第 528-745 行「## Task 4：transformHome 完整 composite shape + home-utils miniStandings 排序」。

## Coverage
- I-4（B-19）：transformHome 完整 composite shape（standings + dragonTop10 + miniStats）
- U-2（B-19）：home-utils 從 composite shape 提取 miniStandings 排序
- 連帶 E-5 / E-6abc 在 Phase 6 e2e 對 prod 跑時可驗

## Style Rules
- **style-skeleton-loading**：本 task instructions 標記為「命中」（理由：修改 SHEETS_RANGES 影響 fetch 鏈路）。

  經查證 `~/.claude/skills/skill-maker/personal-styles/` 目錄不存在；唯一找到的版本為 `~/.claude/skills/sp-writing-plans-v2/references/style-skeleton-loading.md`。該規則描述的是「Next.js App Router `loading.tsx` 路由層 skeleton」與「元件內 `status === 'loading'` skeleton state」，本專案為 Astro 6 多頁靜態站，無 Next.js loading.tsx 模型；本 task 僅改 SHEETS_RANGES 設定（純資料層 ranges 配置，無視覺 fetch loading 狀態的 UI 處理），且資料層 fetchData 三狀態（loading/error/empty）由各 island 元件自行處理（見 src/components/islands/），非本 task 範圍。

  結論：規則檔以 plan 期望路徑（`personal-styles/`）查無；以替代路徑找到的版本不適用本 task 的程式碼修改範圍（純 ranges 配置，無 UI fetch loading 處理）。Plan 第 540 行原本也標「無命中」，與本 task instructions 描述衝突；以實際程式碼變動性質判斷，採「不適用」處理。

## 執行記錄

### Attempt 1
- **狀態**：✓ 完成
- **TDD 紀錄**：
  - Step 1：寫失敗測試
    - `tests/unit/api-transforms.test.ts` 新增 `transformHome (Issue #17)` describe（3 cases）
    - `tests/unit/home-utils.test.ts` 新增 `pickMiniStandings (Issue #17, Covers: U-2)` describe（4 cases）
    - `tests/integration/api-sheets.integration.test.ts` 新增 `fetchData(home) composite shape` 1 case
  - Step 2：跑測試 → 10 RED（transformHome 仍回空 standings/dragonTop10/miniStats；pickMiniStandings 未匯出；fetchData('home') 走 static fallback 因 SHEETS_RANGES['home'] = []）
  - Step 3：實作
    - `src/lib/api-transforms.ts` transformHome 改寫：4 ranges composite（meta + standings + dragon + leaders mini）+ deriveHomeStreakType 衍生 win/lose/null + extractMiniPlayers 從 leaders 第 0 欄 label 過濾類別
    - `src/lib/api.ts` SHEETS_RANGES['home'] = `['datas!D2:M7', 'datas!P2:T7', 'datas!D13:L76', 'datas!D212:N224']`；TRANSFORMERS['home'] = transformHome；import 補入 transformHome
    - `src/lib/home-utils.ts` 新增 `pickMiniStandings(full, n)`：`[...full].sort((a, b) => a.rank - b.rank).slice(0, n)`（不 mutate 原陣列）
  - Step 4：跑測試 → 36/36 PASS（含本 task 8 cases + 既有 28 cases）
- **測試結果**：3 test files, 36 passed, 0 failed, Duration 400ms
- **驗收項目**：
  - [x] transformHome 回傳 standings 含 6 隊（rank / name / team / record / pct / streak / streakType）
  - [x] transformHome 回傳 dragonTop10 上限 10（即使 dragon rows > 10 也切片）
  - [x] transformHome 回傳 miniStats.{pts,reb,ast}.players 從 leaders mini range 第 0 欄 label 過濾
  - [x] transformHome 帶出 streakType（連勝→'win'、連敗→'lose'、空字串→null，與 HomeStreakType 對齊）
  - [x] pickMiniStandings 依 rank 升冪 + slice(n)
  - [x] pickMiniStandings 不 mutate 原陣列（`[...full].sort()`）
  - [x] SHEETS_RANGES['home'] 啟用 4 ranges、TRANSFORMERS['home'] 註冊 transformHome
  - [x] fetchData('home') integration 驗 source='sheets' + standings.length=6 + dragonTop10.length>0
  - [x] 不影響其他 task 的測試（schedule / leaders / dragon / standings 既有測試全綠）

## 已知影響範圍外失敗（非本 task 處理）
- `tests/integration/api-no-fallback.integration.test.ts` 3 cases RED：屬於 I-7（Task 7 範圍，AC-E1 不 fallback 邏輯）
- `tests/integration/boxscore-parse.integration.test.ts > I-9` 1 case RED：stats Sheets path 啟用後（Task 6）原本期望 `source='error'` 變 `source='sheets'`；屬 Task 6/7 範圍

兩者於本 task stash 前後皆 RED，已確認非本 task 引入。
