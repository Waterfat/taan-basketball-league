# Issue #4 Task 3: boxscore-deep-link（URL query helpers + Unit Tests）

## 目標
實作 `src/lib/boxscore-deep-link.ts`，提供：
- `parseBoxscoreQuery(search): BoxscoreUrlState`
- `resolveDefaultTab(state): BoxscoreTab`
- `buildBoxscoreUrl(baseUrl, state): string`

## 要修改/新增的檔案
- Create: `src/lib/boxscore-deep-link.ts`
- Test: `tests/unit/boxscore-deep-link.test.ts`

## 驗收標準
- [ ] U-3a~f: parseBoxscoreQuery 解析（空 / tab=leaders / 全帶 / 缺 tab / 不合法 / 不合法數字）
- [ ] U-4a~f: buildBoxscoreUrl（leaders 不帶 query / boxscore 各組合 / 切回 leaders 清 query / 尾斜線）
- [ ] U-5a~e: resolveDefaultTab（無 query / 各 tab / 隱含切 boxscore / 只有 week）

## Style Rules
無命中（純 URL 解析邏輯）

## 執行記錄

### Attempt 1
（subagent 執行後填入）
