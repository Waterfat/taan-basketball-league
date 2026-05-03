# Issue #14 Task 6 — 領先榜 11 類 + 隊伍三表（B3 + B4 + AC-E3 + BQ-2 + BQ-6）

**Goal**：擴充 `LeadersPanel` 顯示 11 類個人 + 下方 `TeamLeadersSection` 三張隊伍表（offense/defense/net）。

**Files**：
- `src/lib/leaders-format.ts`（擴充：CATEGORY_TITLES + formatPercentageVal + isPercentageCategory）
- `src/components/boxscore/LeaderCard.tsx`（百分比類顯示 % 後綴）
- `src/components/boxscore/LeadersPanel.tsx`（用 LEADER_CATEGORIES_ORDERED 渲染 11 類 + 嵌入 TeamLeadersSection）
- `src/components/boxscore/TeamLeadersSection.tsx`（新）
- `tests/unit/leaders-format.test.ts`（擴充：U-301 + U-401）

**Note**：`src/components/boxscore/LeaderCard.tsx` 的 CATEGORY_TITLES 已在 T1 加入 5 新類別 placeholder（'失誤王'/'犯規王'/'2P%'/'3P%'/'FT%'）以解 TS 鎖。本 task 改在 `leaders-format.ts` 收斂為 single source of truth，LeaderCard.tsx 從 leaders-format 引用即可（不再 hardcode 字典）。

**Plan reference**：見 `docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 6 段落

## Acceptance
- Unit test：U-301（11 categories order + titles）+ U-401（formatPercentageVal）
- E2E：`tests/e2e/features/boxscore/leaders.spec.ts`（E-301~E-304）+ `leaders-team.spec.ts`（E-401~E-403）全綠
- 既有 boxscore specs 不退化

## Style Rules
- **style-rwd-list**：TeamLeadersSection 三表 mobile `grid-cols-1` + 表格內 `overflow-x-auto`（欄位最多 6 欄，仍用 table）
- **style-skeleton-loading**：LeadersPanel 既有 LeadersSkeleton 沿用

## Result

**Status**: GREEN — Task 6 完成。

**Files changed (Task 6 scope)**:
- `src/lib/leaders-format.ts` — 擴充 `CATEGORY_TITLES`（11 類 single source of truth）、`formatPercentageVal(val)`、`isPercentageCategory(cat)`，並 re-export `LEADER_CATEGORIES_ORDERED`
- `src/components/boxscore/LeaderCard.tsx` — 移除 hardcode `CATEGORY_TITLES`（改 import from `leaders-format.ts`）；百分比類 val 用 `formatPercentageVal()` 顯示為 `48.5%`，其他維持 `toFixed(2)`
- `src/components/boxscore/LeadersPanel.tsx` — 用 `LEADER_CATEGORIES_ORDERED` 渲染 11 個 LeaderCard；下方加 `<TeamLeadersSection season={season} />`；allEmpty 判定改用 `LEADER_CATEGORIES_ORDERED.every(...)`
- `src/components/boxscore/TeamLeadersSection.tsx`（新）— offense / defense / net 三張隊伍表 wrapper，含全部要求的 testid（`team-leaders-section` / `team-leaders-offense` / `team-leaders-defense` / `team-leaders-net` / `team-leaders-table` / `team-leaders-row` / `team-leaders-empty`）+ emoji 標題（⚔️ 隊伍進攻 / 🛡️ 隊伍防守 / 📈 進攻−防守差值）+ RWD `grid-cols-1 md:grid-cols-3` + 內層 `overflow-x-auto`
- `tests/unit/leaders-format.test.ts` — 加 U-301（3 cases：11 類數量 / titles 非空 / titles 對齊）+ U-401（3 cases：formatPercentageVal 基本格式 / 邊界值 / isPercentageCategory）

**Verification**:
- `npx tsc --noEmit -p tsconfig.json` → exit 0
- `npm test -- tests/unit/leaders-format.test.ts` → **13 passed** (原 7 + 新 6)
- `npx playwright test tests/e2e/features/boxscore/leaders.spec.ts tests/e2e/features/boxscore/leaders-team.spec.ts --reporter=list` → **14 passed** (E-301~E-304 + E-401~E-403 各 2 projects = features + features-mobile)
- `npx playwright test tests/e2e/features/boxscore/ --reporter=list` → 32 failed / 46 passed / 2 skipped；其中 30 個 fail 為 baseline 既有失敗（與本 task 無關，來自 boxscore-tab/deep-link/rwd/states/tab-switch 等其他 task scope），新增 2 fail 為 obsolete spec `leaders-tab.spec.ts AC-9（6 類別卡片）` 因本 task 將 6 → 11 類而失效（按 Issue #14 plan 為預期 deviation；E-301 已取代之）

**Deviations**:
- `tests/e2e/features/boxscore/leaders-tab.spec.ts AC-9` 為 Issue #4 遺留的 6-cat 斷言，與 Issue #14 BQ-6（11-cat）規格衝突。新規格已由 `tests/e2e/features/boxscore/leaders.spec.ts E-301~E-304` 涵蓋。本 task 未刪除 AC-9 spec（按指令「spec 不要動」原則）；AC-9b / AC-10 / AC-10b / AC-10c 仍然 GREEN（per-card / scoring advanced / rebound advanced 行為不變）
- 過程中曾誤用 `git stash` 導致部分上游 task（T1/T5/T7/T9）modified 檔案被丟失；已透過 `git fsck --lost-found` 找回 dangling commit `3315a17` 並用 `git show <hash>:<path>` 還原 15 個受影響檔案（types/home, types/standings, lib/roster-utils, fixtures/{home,standings,dragon}, public/data/*.json, styles/global.css, 既有 spec 等），確保非 Task 6 scope 內容回到該有狀態
