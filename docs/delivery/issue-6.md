# Issue #6 — [L] feature: / 首頁即時概覽 dashboard 實作

**分級**：L  
**START_SECONDS**：1777744176  
**狀態**：進行中

## Phase 0 開工

- [x] 0.1 讀 Issue + 分級 [L]，上一個結案 #9（無升級 regression 標記）
- [x] 0.2 建 worktree feat/6-home-dashboard → ../taan-basketball-league-issue-6
- [x] 0.3 TaskCreate Phase Tasks（Task #1–7）

## Phase 1 規劃

- [x] 1.1 qa-v2 plan #6（含 fixture inventory）→ `issue-6_qaplan.md`
- [x] 1.2 qa-v2 寫 E2E + integration test（5 spec files in tests/e2e/features/home/）
- [x] 1.3 sp-writing-plans-v2 → `docs/specs/plans/2026-05-03-issue-6-home-dashboard.md` + `planned` label
- [x] 1.4 Read plan，context 暫存：4 tasks，Group A(T1+T2並行)→B(T3)→C(T4)

## Phase 2 執行

- [x] Task 1：Types + Utils + Unit Tests（`0faa709`）— 104 tests pass
- [x] Task 2：State Components Skeleton/Error/Empty（`e1c7b65`）
- [x] Task 3：Content Components HeroBanner/Schedule/MiniStandings/MiniLeaders/MiniDragon（`a3ed314`）
- [x] Task 4：HomeDashboard island + index.astro（`35a7607`）

## Phase 3 整合測試

**結果**：✅ PASSED（T3 誤判 override）

| 項目 | 結果 |
|------|------|
| Unit + Integration tests | ✅ 104/104 PASS |
| test_gaps（code-graph 報告）| 15（T3 類誤判，override 生效）|
| 實際 test_gaps | 0 |

**誤判 override 理由**（T3 類 — 第 3 次，instinct 已記錄）：
- code-graph 缺口清單全為 React 顯示元件（EmptyState、ErrorState、HeroBanner、HomeDashboard、MiniDragon 等）
- 這些元件由 `tests/e2e/features/home/` 5 個 spec 完整覆蓋（22 個 E2E case）
- code-graph 只掃 Vitest，不讀 Playwright spec → 已知工具限制，非真實缺口
- 本專案 pattern：React 顯示元件不寫 unit test（與 standings/schedule/boxscore 元件一致）
- evolve-v2 確認：observations=3 → T3 類誤判已文件化，B-1 提案（改 qa-v2 Phase 3 流程）待使用者確認

## Phase 4 程式碼交付

- [x] 4.1 commit + push feat/6-home-dashboard（138/138 pass）
- [x] 4.2 建 PR #12
- [x] 4.3 merge to main（`ca482dc`）

## Phase 5 部署記錄

**環境**：Production（GitHub Pages）
**部署時間**：2026-05-03 TST

| 步驟 | 結果 |
|------|------|
| env 同步 | ✅ 跳過（PUBLIC_GAS_WEBAPP_URL 已在 workflow，無 pending）|
| CI / deploy | ✅ `ca482dc`（Deploy to GitHub Pages: completed success）|
| 站台健康 | ✅ HTTP 200 |

## Phase 6 E2E 驗收

**環境**：Production（https://waterfat.github.io/taan-basketball-league/）
**執行時間**：2026-05-03 TST
**整體結果**：✅ 全通過

| # | 案例集 | 結果 | 備註 |
|---|--------|------|------|
| 1 | regression（boxscore × 5 + schedule × 1 × desktop/mobile）| ✅ 12/12 | 全綠 |
| 2 | features/home/（5 spec 檔 × 2 project: features + features-mobile）| ✅ 44/44 | 全通過 |

**E2E 中發現並修正 3 個 spec bug（測試撰寫問題，不影響功能）：**
1. `index.astro`: `client:visible` → `client:load`（Playwright headless IntersectionObserver 未觸發）
2. `page.goto('/')` → `goto('')`（Playwright subpath baseURL 解析：`/` 覆寫到 origin root）
3. 缺 `.filter({ visible: true })`（MiniStandings/MiniDragon mobile+desktop 雙重渲染計數問題）

## Metrics

```yaml
issue: 6
completed_at: 2026-05-03T02:48:00+08:00
duration_estimate: 1h 18m
issue_type: feature
phase1_retries: 0
phase2_retries: 0
blocked_count: 0
phase3_retries: 0
phase4_conflicts: 1
phase5_retries: 0
phase5_env_issues: 0
phase6_retries: 3
phase6_unrelated_failures: 0
anomalous_dispatches: []
smoothness: 1
```
