# Issue #14 — qa-v2 plan

**分級**：L
**啟動時間**：2026-05-03 TST
**平台偵測**：Web（Astro + React island） — TG / LINE 無

---

## Step 1：環境讀取

| 項目 | 來源 | 狀態 |
|------|------|------|
| dev URL | `tests/environments.yml` → `http://localhost:4321` | ✅ |
| prod URL | `tests/environments.yml` → `https://waterfat.github.io/taan-basketball-league/` | ✅ |
| 環境變數 | PUBLIC_SHEET_ID / PUBLIC_SHEETS_API_KEY | ✅ 已在 environments.yml 完整登錄 |
| E2E 工具 | Playwright | ✅ |
| Mock helper | `tests/helpers/mock-api/` | ✅ |

本 Issue **無新環境變數**（所有資料源沿用既有 PUBLIC_SHEET_ID / PUBLIC_SHEETS_API_KEY；龍虎榜選秀規則連結為靜態文字 / 來自 dragon.json，無新 secret）。

---

## Step 1.5：Fixture Inventory

### 4-action 判斷

| Entity | 目前 fixture | 行動 | 說明 |
|--------|------------|------|------|
| HomeData (matchups) | `mockHomeData()` 未含 weekMatchups | **補（向後相容）** | 新增 `mockHomeWithWeekMatchups(opts)` 工廠：可選 `gamesPublished`（true → games[] 有資料；false → games[] 空陣列）。原 `mockHomeData()` 不變。 |
| StandingsData (matrix) | `mockFullStandings()` 無 matrix | **補（向後相容）** | 新增 `mockMatrix6x6()` + `mockStandingsWithMatrix()`。原工廠不變。 |
| LeaderData (新 5 類 + 隊伍三表) | `mockFullLeaders()` 只有 6 類個人、無 offense/defense/net | **補（向後相容）+ 修改型別** | 擴充 `LeaderCategory` 加入 `turnover/foul/p2pct/p3pct/ftpct`，新增 `mockExtendedLeaders()`、`mockTeamOffense()/mockTeamDefense()/mockTeamNet()`。原 `mockFullLeaders()` 保留（可能被既有 spec 引用）。 |
| RosterData (出席率彙整) | 已有 `att[]` 陣列，無彙整 helper | **補** | 新增 `computeAttendanceSummary(att[])` helper 回傳 `{attended, total, rate}`，fixture 不變。 |
| DragonData | 已含 `civilianThreshold` + `rulesLink?` | **直接用** | 既有結構足夠。新增 `mockDragonWithRulesLink()` 確保 `rulesLink` 必有，方便 C3 測試。 |

### Fixture 改動清單

寫入 `tests/fixtures/` 各檔（補新工廠，原函式皆保留以維持向後相容）：

```
tests/fixtures/standings.ts
  + mockMatrix6x6(): MatrixData
  + mockStandingsWithMatrix(matrixOverride?): StandingsData
  + 新增型別 MatrixCell, MatrixData

tests/fixtures/leaders.ts
  + 擴充 type LeaderCategory: 加 turnover, foul, p2pct, p3pct, ftpct
  + 擴充 LeaderSeason: 新 5 類
  + 新增 type TeamLeaderRow, TeamLeaderTable
  + mockExtendedLeaders(): LeaderData （含 11 類個人）
  + mockTeamOffense(): TeamLeaderTable
  + mockTeamDefense(): TeamLeaderTable
  + mockTeamNet(): TeamLeaderTable

tests/fixtures/home.ts
  + 擴充 HomeData: 加 weekMatchups?: WeekMatchups
  + 新增 type WeekMatchups: { week, date, venue, combos[], games[] }
  + mockHomeWithWeekMatchups({ gamesPublished: boolean }): HomeData

tests/fixtures/dragon.ts
  + mockDragonWithRulesLink(): DragonData （ rulesLink 必有 + threshold = 10）
  + mockDragonGroupingShowcase(): DragonData （threshold 設在中段 → 平民 + 奴隸區皆有球員）
```

### Refactor Backlog（自動掃描，不在本 Issue 處理）

| 觸發 | 對象 | 建議動作 |
|------|------|----------|
| T2 | 同尾 "Game" 有 3 個相似 factory | 考慮合併為參數化版本 |
| T2 | 同尾 "Leaders" 有 5 個相似 factory（本 Issue 將再增加，加劇此問題）| 下個重構 Issue 合併 |
| T2 | 同尾 "Player" 有 4 個相似 factory | 考慮合併為參數化版本 |
| T2 | 同尾 "Standings" 有 4 個相似 factory | 考慮合併為參數化版本 |
| T2 | 同尾 "Week" 有 5 個相似 factory | 考慮合併為參數化版本 |

### Deprecated Scan
未發現 @deprecated 標記。

---

## Step 2：AC 行為抽取

從 Issue `## 🧪 測試方向` section 抽取 12 條 AC + 3 條 edge case。

| AC | 隱含行為 |
|----|---------|
| AC-1 首頁 6 組對戰預覽 + toggle | B-1.1 顯示 6 組對戰；B-1.2 toggle 顯示「對戰組合 / 賽程順序」 |
| AC-2 預設邏輯（智慧切換）| B-2.1 home/away 為空 → 預設「對戰組合」；B-2.2 home/away 有值 → 預設「賽程順序」 |
| AC-3 戰績矩陣 | B-3.1 顯示 6×6 矩陣；B-3.2 self vs self 顯示「—」；B-3.3 淨勝分顏色（正綠負紅）|
| AC-4 領先榜 11 類 | B-4.1 顯示 11 卡片；B-4.2 含新 5 類（失誤 / 犯規 / 2P% / 3P% / FT%） |
| AC-5 隊伍進攻防守差值 | B-5.1 顯示三張表；B-5.2 表格 emoji 標題（⚔️🛡️📈）|
| AC-6 出席率欄 | B-6.1 表格頂端日期欄頭；B-6.2 每位球員出席率 + 場次比 |
| AC-7 出席符號 legend | B-7.1 上方 legend「1 出席、0 請假、✕ 曠賽、? 尚未舉行」 |
| AC-8 隊伍 chips | B-8.1 7 個 chips（全部+紅黑藍綠黃白）；B-8.2 點「紅」→ 只顯紅隊；B-8.3 點「全部」→ 顯六隊 |
| AC-9 賽程頁切換 | B-9.1 賽程頁有 toggle；B-9.2 邏輯與首頁一致（智慧預設）|
| AC-10 龍虎榜分組 | B-10.1「🧑 平民區」標題（前 N 名）；B-10.2「⛓️ 奴隸區」標題（第 N+1 名起含完整文案） |
| AC-11 hero subtitle | B-11.1 「活躍度積分累計 · 決定下賽季選秀順位」；B-11.2 三 chip（平民區 / 奴隸區 / ⚠ 季後賽加分於賽季結束後計入）|
| AC-12 選秀規則連結 | B-12.1 表格下方「📋 查看完整選秀規則公告 →」連結 |
| AC-E1 手機矩陣 | B-E1 戰績矩陣可橫向捲動（< 768px）|
| AC-E2 順序未公告 | B-E2 提示「本週場次順序尚未公告」+ 預設「對戰組合」|
| AC-E3 領先榜某類別空 | B-E3 該卡片仍顯示 + 內容空狀態，不影響其他類別 |

qa-v2 補充行為（標 `[qa-v2 補充]`）：

| 補充 ID | 來源 | 行為 |
|---------|------|------|
| BQ-1 | AC-3 推導 | 戰績矩陣 loading / error / empty 三狀態（與 standings 共用 source） |
| BQ-2 | AC-5 推導 | 隊伍三表 emoji 標題、各 6 列、缺資料時顯空狀態（單獨缺一張不影響其他）|
| BQ-3 | AC-8 推導 | 隊伍 chips「red」active 樣式（aria-pressed=true）|
| BQ-4 | AC-1 推導 | toggle 切換時 URL query string 同步（?view=combo / ?view=order）便於分享 |
| BQ-5 | AC-12 推導 | 選秀規則連結 target="_blank" + rel="noopener noreferrer"（外部連結安全）|
| BQ-6 | AC-4 推導 | 11 類 categories 順序固定（既有 6 類在前，新 5 類在後）|

---

## Step 3：Tag 搜尋現有 Testcase

| AC / B-ID | 既有 testcase | 動作 |
|-----------|-------------|------|
| B-1.1, B-1.2, B-2.* | 無（home-rwd / home-hero-schedule 不涵蓋）| ❌ 新增 `features/home/home-matchups.spec.ts` |
| B-3.* | features/standings.spec.ts 存在但 274 行（已超 200）→ 新增子目錄 | ❌ 新增 `features/standings/standings-matrix.spec.ts` |
| B-4.* | features/boxscore/* 子目錄已多檔（hero/states/rwd/deep-link/boxscore-tab）| ❌ 新增 `features/boxscore/leaders.spec.ts`（含 11 類 + AC-E3）|
| B-5.* | 同上 | ❌ 新增 `features/boxscore/leaders-team.spec.ts` |
| B-6.*, B-7.* | features/roster/{rwd,states,deep-link,hero-roster-tab,dragon-tab}.spec.ts 不涵蓋 | ❌ 新增 `features/roster/roster-attendance.spec.ts` |
| B-8.* | 同上 | ❌ 新增 `features/roster/roster-team-filter.spec.ts` |
| B-9.* | features/schedule.spec.ts 存在但 286 行（已超 200）→ 新增子目錄 | ❌ 新增 `features/schedule/schedule-toggle.spec.ts` |
| B-10.*, B-12.* | features/roster/dragon-tab.spec.ts 134 行（餘裕未滿 200）| 🔧 修改：擴充 dragon-tab.spec.ts（grouping + rules link）|
| B-11.* | features/roster/hero-roster-tab.spec.ts 122 行（餘裕）| 🔧 修改：擴充 hero-roster-tab.spec.ts（subtitle + chips） |
| BQ-1（matrix 三狀態）| standings 三狀態既有 | 🔧 修改：擴充 standings-matrix.spec.ts |
| AC-E1 手機矩陣 | 同 B-3.* | ❌ 並列在 standings-matrix.spec.ts |
| AC-E2 順序未公告 | 同 B-1.* | ❌ 並列在 home-matchups.spec.ts + schedule-toggle.spec.ts |
| AC-E3 類別空 | 同 B-4.* | ❌ 並列在 boxscore/leaders.spec.ts |

整合測試（Phase 3 用）：
| Coverage | 對象 | 狀態 |
|----------|------|------|
| I-1 standings 含 matrix | api fetch 'standings' → matrix 欄位完整 | ❌ 新增 `tests/integration/api-standings-matrix.integration.test.ts` |
| I-2 leaders 11 類 + 三隊伍表 | api fetch 'stats' → 解析 11 類 + offense/defense/net | ❌ 新增 `tests/integration/api-leaders-extended.integration.test.ts` |

---

## Coverage Matrix

| Coverage ID | B-ID | 行為 | 層 | 狀態 | 位置 |
|------------|------|------|-----|------|------|
| **首頁 6 組對戰 + 切換（B1, B2, AC-E2）** ||||||
| E-101 | B-1.1 | 首頁顯示 6 組對戰預覽 | e2e | ❌→已補寫 | tests/e2e/features/home/home-matchups.spec.ts |
| E-102 | B-1.2 | 首頁切換 toggle 顯示「對戰組合 / 賽程順序」 | e2e | ❌→已補寫 | 同上 |
| E-103 | B-2.1 | 智慧切換：home/away 為空 → 預設「對戰組合」 | e2e | ❌→已補寫 | 同上 |
| E-104 | B-2.2 | 智慧切換：home/away 有值 → 預設「賽程順序」 | e2e | ❌→已補寫 | 同上 |
| E-105 | B-E2 | 順序未公告 → 顯提示「本週場次順序尚未公告」 | e2e | ❌→已補寫 | 同上 |
| E-106 | BQ-4 [qa-v2 補充] | toggle URL query 同步（?view=combo \| order） | e2e | ❌→已補寫 | 同上 |
| U-101 | B-1.3 | home matchups 解析（HomeData → WeekMatchups view model） | unit | ⬜ Phase 2 | tests/unit/home-matchups-utils.test.ts |
| U-102 | B-2.* | 智慧切換 utility（games[] 無 home/away → combo 模式） | unit | ⬜ Phase 2 | tests/unit/schedule-toggle-utils.test.ts |
| **戰績矩陣（B2, AC-E1）** ||||||
| E-201 | B-3.1 | 戰績矩陣 6×6 表 | e2e | ❌→已補寫 | tests/e2e/features/standings/standings-matrix.spec.ts |
| E-202 | B-3.2 | self vs self cell 顯示「—」 | e2e | ❌→已補寫 | 同上 |
| E-203 | B-3.3 | 正分綠色 + 負分紅色（class-based 驗證） | e2e | ❌→已補寫 | 同上 |
| E-204 | AC-E1 | 手機（< 768px）矩陣可橫向捲動 | e2e | ❌→已補寫 | 同上 |
| E-205 | BQ-1 [qa-v2 補充] | matrix loading / error 三狀態（複用 standings flow） | e2e | ❌→已補寫 | 同上 |
| U-201 | B-3.4 | matrix parser（json → row[][]）| unit | ⬜ Phase 2 | tests/unit/standings-matrix-utils.test.ts |
| U-202 | B-3.5 | matrix cell sign → CSS class（pos / neg / zero） | unit | ⬜ Phase 2 | 同上 |
| I-1 | B-3.* | standings API fetch 含 matrix 欄位 | integration | ❌→已補寫 | tests/integration/api-standings-matrix.integration.test.ts |
| **領先榜 11 類（B4, AC-E3）** ||||||
| E-301 | B-4.1 | 領先榜顯示 11 類個人卡片 | e2e | ❌→已補寫 | tests/e2e/features/boxscore/leaders.spec.ts |
| E-302 | B-4.2 | 含新 5 類（失誤 / 犯規 / 2P% / 3P% / FT%） | e2e | ❌→已補寫 | 同上 |
| E-303 | BQ-6 [qa-v2 補充] | 11 類順序固定（既有 6 類在前，新 5 類在後） | e2e | ❌→已補寫 | 同上 |
| E-304 | AC-E3 | 部分類別空時，該卡片仍顯示空狀態，不影響其他類別 | e2e | ❌→已補寫 | 同上 |
| U-301 | B-4.3 | LeaderCategory 型別擴充 + CATEGORY_TITLES 對齊 | unit | ⬜ Phase 2 | tests/unit/leaders-format.test.ts (extend) |
| **隊伍進攻防守差值（B3）** ||||||
| E-401 | B-5.1 | 顯示三張隊伍表（⚔️ 進攻 / 🛡️ 防守 / 📈 差值） | e2e | ❌→已補寫 | tests/e2e/features/boxscore/leaders-team.spec.ts |
| E-402 | B-5.1 | 每張表 6 列（每隊一列），含 PPG / 排名 | e2e | ❌→已補寫 | 同上 |
| E-403 | BQ-2 [qa-v2 補充] | 缺一張表（offense empty）→ 該表顯空狀態，不影響其他表 | e2e | ❌→已補寫 | 同上 |
| U-401 | B-5.2 | offense / defense / net 解析（API → TeamLeaderTable） | unit | ⬜ Phase 2 | tests/unit/leaders-format.test.ts (extend) |
| I-2 | B-4, B-5 | leaders API fetch → 11 類 + 三隊伍表結構 | integration | ❌→已補寫 | tests/integration/api-leaders-extended.integration.test.ts |
| **出席率 + 符號 legend（B5）** ||||||
| E-501 | B-6.1 | 表格頂端日期欄頭（如 1/10、1/17） | e2e | ❌→已補寫 | tests/e2e/features/roster/roster-attendance.spec.ts |
| E-502 | B-6.2 | 每位球員最右欄顯示「出席率% + 場次比」 | e2e | ❌→已補寫 | 同上 |
| E-503 | B-7.1 | 上方 legend「1 出席、0 請假、✕ 曠賽、? 尚未舉行」 | e2e | ❌→已補寫 | 同上 |
| U-501 | B-6.3 | 出席率計算（only count 1/0/x，排除 ?） | unit | ⬜ Phase 2 | tests/unit/roster-utils.test.ts (extend) |
| **隊伍切換 chips（B6）** ||||||
| E-601 | B-8.1 | 顯示 7 個 chips（全部 + 紅黑藍綠黃白） | e2e | ❌→已補寫 | tests/e2e/features/roster/roster-team-filter.spec.ts |
| E-602 | B-8.2 | 點「紅」chip → 只顯示紅隊 section | e2e | ❌→已補寫 | 同上 |
| E-603 | B-8.3 | 點「全部」→ 顯示六隊 | e2e | ❌→已補寫 | 同上 |
| E-604 | BQ-3 [qa-v2 補充] | 選中的 chip 有 aria-pressed=true 與 active 樣式 | e2e | ❌→已補寫 | 同上 |
| **賽程頁切換（B7）** ||||||
| E-701 | B-9.1 | 賽程頁有「對戰組合 / 賽程順序」toggle | e2e | ❌→已補寫 | tests/e2e/features/schedule/schedule-toggle.spec.ts |
| E-702 | B-9.2 | 切換邏輯與首頁一致（智慧預設） | e2e | ❌→已補寫 | 同上 |
| **龍虎榜分組 + 連結（C1, C3）** ||||||
| E-801 | B-10.1 | 「🧑 平民區（前 N 名 · 可優先自由選擇加入隊伍）」標題 | e2e | 🔧→已擴充 | tests/e2e/features/roster/dragon-tab.spec.ts |
| E-802 | B-10.2 | 「⛓️ 奴隸區（第 N+1 名起 · 為聯盟貢獻過低淪為奴隸…）」標題 | e2e | 🔧→已擴充 | 同上 |
| E-803 | B-12.1 | 表格下方「📋 查看完整選秀規則公告 →」連結 | e2e | 🔧→已擴充 | 同上 |
| E-804 | BQ-5 [qa-v2 補充] | 連結 target="_blank" + rel="noopener noreferrer" | e2e | 🔧→已擴充 | 同上 |
| **龍虎榜 hero（C2, C4）** ||||||
| E-901 | B-11.1 | hero subtitle「活躍度積分累計 · 決定下賽季選秀順位」 | e2e | 🔧→已擴充 | tests/e2e/features/roster/hero-roster-tab.spec.ts |
| E-902 | B-11.2 | 三 chip（平民區 / 奴隸區 / ⚠ 季後賽加分於賽季結束後計入） | e2e | 🔧→已擴充 | 同上 |

---

## Phase 3 執行清單（Integration）

- ❌→新補：tests/integration/api-standings-matrix.integration.test.ts （I-1）
- ❌→新補：tests/integration/api-leaders-extended.integration.test.ts （I-2）
- ✅ 既有沿用：tests/integration/api-cache.integration.test.ts、api-cleanup、api-fallback、api-sheets、boxscore-parse

---

## Phase 6 執行清單（E2E）

**新增 spec 檔（7 個）**：
- tests/e2e/features/home/home-matchups.spec.ts
- tests/e2e/features/standings/standings-matrix.spec.ts
- tests/e2e/features/boxscore/leaders.spec.ts
- tests/e2e/features/boxscore/leaders-team.spec.ts
- tests/e2e/features/roster/roster-attendance.spec.ts
- tests/e2e/features/roster/roster-team-filter.spec.ts
- tests/e2e/features/schedule/schedule-toggle.spec.ts

**擴充既有 spec（2 個）**：
- tests/e2e/features/roster/dragon-tab.spec.ts （+ 平民/奴隸區 grouping、選秀規則連結）
- tests/e2e/features/roster/hero-roster-tab.spec.ts （+ subtitle、chips）

**P0 regression**：tests/e2e/regression/{boxscore,schedule}.regression.spec.ts （沿用既有，不變更）

---

## Notes

- 所有 E2E 沿用 `tests/helpers/mock-api/` 攔截 GAS API + fallback JSON，不打 production
- 新 spec 統一加 `@issue-14` Playwright tag，便於整批執行 `npx playwright test --grep @issue-14`
- 規則連結 `rulesLink` 預設使用 `https://example.com/rules`（fixture 預設值）；正式上線時 dragon.json 應填實際公告 URL（pm-v2 部署前提醒主人手動更新）
