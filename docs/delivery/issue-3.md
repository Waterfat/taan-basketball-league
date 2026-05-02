# Issue #3: [L] feature: /standings 戰績榜頁面實作

**分級**：L
**Issue**: https://github.com/Waterfat/taan-basketball-league/issues/3
**START_SECONDS**: 1777736533
**Worktree**: feat/3-standings-page

## Phase 0 — 開工

- [x] 0.1 讀 Issue + 分級（[L]，spec_done ✅）
- [x] 0.2 git-ops-v2 create-worktree（`../taan-basketball-league-issue-3` on `feat/3-standings-page`）
- [x] 0.3 TaskCreate Phase Tasks（1-7）

## Phase 1 — 規劃

- [x] 1.1 plan_done 偵測（首次 Issue，計畫不存在）
- [x] 1.2 qa-v2 plan #3 → `issue-3_qaplan.md`（17 E2E + 2 Integration（補）+ 5 Unit ⬜）
- [x] 1.3 sp-writing-plans-v2 → `2026-05-02-issue-3-standings-page.md`（4 個 task，並行群組 A = {1,2}、B = {3}、C = {4}）

**個人風格規則命中**：2 條 — style-rwd-list（Task 3）、style-skeleton-loading（Task 2 + Task 4）

## Phase 2 — 執行

| Task | 描述 | Commit | 狀態 |
|------|------|--------|------|
| Task 1 | 型別 + utils + 16 unit test | `32597cb` | ✅ |
| Task 2 | Skeleton / Error / Empty / Hero | `8859525` | ✅ |
| Task 3 | StandingsRow（mobile card + desktop table row）| `a8f8fde` | ✅ |
| Task 4 | StandingsApp + standings.astro 接線 | `54507ce` | ✅ |

群組執行：Group A（Task 1 ∥ Task 2，並行）→ Group B（Task 3）→ Group C（Task 4）
完成驗證：vitest **41 passed (5 files)**、`npm run build` **5 pages OK**

## Phase 3 — 整合測試

**結果**：❌（test_gaps，工具疑似誤判）— 待主人決策

### Retry r1（首次執行）

- ✅ Vitest unit + integration: **41/41 passed**（5 test files）
- ❌ code-review-graph `detect_changes_tool`: **test_gaps = 18**
  - Untested 名單包含 5 個 React 元件 + 5 個 helper（HistoryDots/StreakLabel/rowAriaLabel/StandingsCard/StandingsTableRow）+ 5 個 utility（formatPct/getStreakClasses/...）+ 3 個 mock-api helper
- 風險評分：0.45（中）

### Retry r2（補 component smoke test）

- 新增 `tests/unit/standings-components.test.ts`（11 cases，使用 `react-dom/server.renderToString`，不引入 RTL 依賴）
- 修正 `vitest.config.ts`：新增 `esbuild.jsx: 'automatic'` + `.tsx` 副檔名納入 include
- ✅ Vitest unit + integration: **52/52 passed**（6 test files），commit `ff1a492`
- ❌ code-review-graph `detect_changes_tool`：**test_gaps 仍為 18**

### 工具誤判分析（HARD-GATE 衝突點）

`detect_changes_tool` 將以下函式列為 untested，但實際上**已有 16+11 個直接 unit test 覆蓋**：

| 函式 | 實際覆蓋來源 | 工具判斷 |
|------|------------|---------|
| `formatPct` | `standings-utils.test.ts` U-1（4 cases 直接調用） | ❌ 誤判 untested |
| `getStreakClasses` | 同上 U-2（3 cases 直接調用） | ❌ 誤判 untested |
| `getHistoryDotColor` | 同上 U-3（3 cases 直接調用） | ❌ 誤判 untested |
| `sortStandings` | 同上 U-4（2 cases 直接調用） | ❌ 誤判 untested |
| `buildRosterLink` | 同上 U-5（3 cases 直接調用） | ❌ 誤判 untested |
| 5 個 React 元件 | r2 新增 11 個 `renderToString` smoke test | ❌ 誤判 untested |
| `mockKindAPI` 等 helper | 不是業務函式，是測試工具本身 | ❌ 不應列入 |

**結論**：tree-sitter 對 TypeScript 的 import + call-edge 解析有缺陷，無法將 `import { formatPct } ... expect(formatPct(0,0))` 視為 Test → Function 邊。在此專案規模下無法靠補測解除（已證實補測 11 個元件後 test_gaps 數字未變）。

### 與 Issue #1 對照

Issue #1 同樣 17 個函式 / 元件混合 unit + E2E 覆蓋，當時 code-graph 未建置直接跳過。現在建置後，工具的 false positive 把 HARD-GATE 變成永久阻塞。

### 待決策事項

1. **Option A**：暫時降級 HARD-GATE — 在工具修復前以人工確認覆蓋（Phase 6 E2E 在 UAT 真實執行可補上行為層信心）
2. **Option B**：放棄 code-graph，回到 Issue #1 模式（人工確認）
3. **Option C**：等 code-graph 升級後重跑

實質覆蓋（不依賴工具）：
- 16 個 utility unit test（直接調用）
- 11 個 component smoke test（SSR 渲染 + key testid 斷言）
- 6 個 integration test（兩層 fallback × 兩個 kind）
- 17 個 E2E spec（已寫，待 Phase 6 UAT 跑）

**請主人決策後再進入 Phase 4。**

## Phase 4 — 程式碼交付

- [ ] 4.1 commit + push
- [ ] 4.2 PR 建立
- [ ] 4.3 merge to main

## Phase 5 — 部署記錄

（待執行）

## Phase 6 — E2E 驗收

（待執行）
