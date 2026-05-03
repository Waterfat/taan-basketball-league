# Issue #13 Task 1: api-cache 模組

## 目標
建立 `src/lib/api-cache.ts` — 5 分鐘 in-memory cache 模組（TTL 常數 + getCached/setCache/clearCache）。

## 要修改/新增的檔案
- Create: `src/lib/api-cache.ts`
- Test: `tests/unit/api-cache-ttl.test.ts`

## Plan 引用
`docs/specs/plans/2026-05-03-issue-13-data-source-migration.md` 的 **Task 1：api-cache 模組** 段落。

## Coverage
- U-1：cache TTL = 5 分鐘
- I-6（部分）：cache TTL 為 5 分鐘

## Style Rules
無命中

## 執行記錄

### Attempt 1
- **狀態**：✓ 完成
- **Commit**：`eab7d3a` — feat(api): add 5-min in-memory cache module (#13)
- **TDD 紀錄**：
  - Step 1：寫 `tests/unit/api-cache-ttl.test.ts`（6 cases）
  - Step 2：跑測試 → FAIL（"Cannot find module '../../src/lib/api-cache'"）
  - Step 3：建 `src/lib/api-cache.ts`（export `CACHE_TTL_MS`、`getCached`、`setCache`、`clearCache`）
  - Step 4：跑測試 → PASS（6/6 tests）
  - Step 5：commit OK（folder-audit 通過）
- **測試結果**：6 passed (6) — Duration 547ms
- **驗收項目**：
  - [x] 6 個 unit test 全綠
  - [x] `src/lib/api-cache.ts` 正確 export `CACHE_TTL_MS`、`getCached`、`setCache`、`clearCache`
  - [x] 純粹 in-memory `Map`（無持久化）
