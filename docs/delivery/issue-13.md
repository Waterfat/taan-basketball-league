# Issue #13 — [M] fix: 新網站資料管線錯誤、戰績近況與逐場 Box 渲染遺漏

**分級**：M
**START_SECONDS**：1777790357
**開始時間**：2026-05-03 TST
**上一個結案 Issue**：#9（無 ⬆️ 建議升級 regression 標記）

## Phase Tasks

- [ ] Phase 0：開工
- [ ] Phase 1：規劃
- [ ] Phase 2：執行
- [ ] Phase 3：整合測試
- [ ] Phase 4：程式碼交付
- [ ] Phase 5：部署
- [ ] Phase 6：驗收

## Phase 0 開工

- [x] 0.1 讀 Issue + 分級 [M]，上一個結案 #9（無升級 regression 標記）
- [x] 0.2 建 worktree feat/13-fix-data-pipeline → ../taan-basketball-league-issue-13
- [x] 0.3 TaskCreate Phase Tasks（已建 Task #9–15）

> ⚠️ 主 repo `main` 領先 `origin/main` 2 commits（docs：08b253d、ff415c7），Phase 4.1 push feature branch 時一併處理。

## Phase 1 規劃

- [x] 1.1 qa-v2 plan #13 → `docs/delivery/issue-13_qaplan.md`（9 I-* + 7 E-* + 2 U-*）
- [x] 1.2 補寫缺漏 testcase：
  - `tests/integration/api-sheets.integration.test.ts`（I-1~I-3 + 2 邊界）
  - `tests/integration/api-cache.integration.test.ts`（I-4~I-6 + 1 邊界）
  - `tests/integration/api-cleanup.integration.test.ts`（I-9 + 8 cleanup verifications）
  - `tests/e2e/features/data-fallback.spec.ts`（E-4, E-7 共 4 cases）
- [x] 1.3 sp-writing-plans-v2 → `docs/specs/plans/2026-05-03-issue-13-data-source-migration.md`（7 tasks）+ planned label
- [x] 1.4 計畫已讀取，payload 暫存

**計畫摘要**：
- T1：建 `src/lib/api-cache.ts`（5-min cache）+ U-1 unit test
- T2：建 `src/lib/api-transforms.ts`（per-DataKind transformer）+ unit tests
- T3：重寫 `src/lib/api.ts`（依賴 T1+T2）→ Sheets API direct + cache + transforms
- T4：重寫 `tests/helpers/mock-api/*` GAS_PATTERN→SHEETS_PATTERN + clean conflict marker + U-2 unit test
- T5：重寫 `tests/integration/api-fallback.integration.test.ts`（依賴 T3，12 cases 改 Sheets mock）
- T6：清理 config/docs（.env.example, env.d.ts, environments.yml, README, integrations.md）
- T7：補 A2/A3 E2E asserts（依賴 T4，standings + boxscore）

**相依分析**：
- Batch 1（並行）：T1、T2、T4、T6
- Batch 2（並行）：T3（需 T1+T2）、T7（需 T4）
- Batch 3：T5（需 T3）

## Phase 2 執行

### Batch 1（已完成）

- [x] T1：api-cache 模組 → commit `eab7d3a`（6 unit tests pass）
- [x] T2：api-transforms 模組 → commit `2b0d7a5`（7 unit tests pass）+ `293df5e` 型別對齊 fix
- [x] T4：mock-api SHEETS_PATTERN 切換 → commit `5f8e78a`（4 unit tests pass）
- [x] T6：cleanup config/docs → 與 T2 commit 合併入 `2b0d7a5`（parallel race）+ `e7c3508` env.d.ts BASE_URL 重複宣告 fix

> ⚠️ Parallel race：T2 與 T6 commit 因 staging area 競爭合進同一個 commit `2b0d7a5`（commit message 是 T2 但 stat 含 T6 檔案）。功能正確，git history 略亂，不阻塞流程。

### Batch 2（已完成）

- [x] T3：rewrite src/lib/api.ts → commit `aceccaa`（integration 18+ tests pass）
- [x] T7：補 A2/A3 E2E asserts → commit `b9aff45`
  - E-5：standings 「最近 6 場」○✕ assert PASS（A2 自動修好）
  - E-6：boxscore 「逐場 Box」分頁 assert FAIL（**A3 元件渲染問題待另開 issue**）

### Batch 3（已完成）

- [x] T5：rewrite api-fallback.integration.test.ts → commit `1415496`（37/37 integration tests pass）

### Phase 2 群組驗收

- **Code review #1**：catch critical issue — stub transformer for home/schedule/roster/leaders 會在 Sheets 成功時回空資料，繞過 static JSON
- **修補 commit `5274e69`**：限縮 SHEETS_RANGES 只包含 standings + dragon（完整 transformer），其他 kind 走 static fallback；移除測試中過時的 PUBLIC_GAS_WEBAPP_URL stubs
- **Code review #2**：critical issue ✅ closed，proceed to Phase 3
- **Test status**：134 unit + 37 integration tests 全綠

### 待開 follow-up issues

1. **A3 元件渲染**：boxscore「逐場 Box」分頁（`src/lib/boxscore-api.ts` E2E mock 路徑問題）
2. **home/schedule/roster/leaders Sheets composite transformer**：本 Issue 暫走 static，後續 issue 補完整實作（含 home 多 range merge + history/miniStats 計算）

## Phase 3 整合測試

**結果**：✅

**執行時間**：2026-05-03 TST
**embed_graph**：未執行（`sentence-transformers` 未安裝，跳過記錄）

| 階段 | 結果 |
|------|------|
| Integration 測試 | ✅ 5 files / 37 tests pass（646ms） |
| code-graph build | ✅ 158 nodes / 1730 edges 增量更新 |
| code-graph detect_changes | raw test_gap_count = 19，套用 T1/T2/T3 exclusion 後 = 0 |

### Test gap 排除明細（依 tests/TESTING.md 規則）

- **T1（9）**：unit test 存在但 tree-sitter 無法追蹤 TS named import → `getCached`, `setCache`, `clearCache`, `transformHome`, `transformStandings`, `transformDragon`, `transformSchedule`, `transformRoster`, `transformLeaders`
- **T1（5）**：integration test 間接覆蓋的 api.ts 內部 helper → `isSheetsConfigured`, `buildBatchUrl`, `fetchFromSheets`, `fetchFromStatic`, `fetchData`
- **T2（5）**：tests/ 底下 test infrastructure → `mockLeadersAPI`, `mockKindAPI`, `mockSheets`, `readFile`, `mockSheetsBatch`

