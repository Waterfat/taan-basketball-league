# Issue #4 Task 7: boxscore.astro 頁面整合

## 目標
改寫 `src/pages/boxscore.astro` 為 React island wrapper（mount BoxscoreApp client:load）。

## 要修改/新增的檔案
- Modify: `src/pages/boxscore.astro`

## 驗收標準
- [x] 移除「規劃中」placeholder
- [x] mount `<BoxscoreApp client:load baseUrl={baseUrl} />`
- [x] `npm run build` 成功，產出 `dist/boxscore/index.html`
- [x] `Layout title="比賽數據" active="data"` 套既有 layout

## Style Rules
### style-skeleton-loading
- 用 `client:load`（與 schedule.astro 一致）
- 不用 `client:visible`

## 執行記錄

### Attempt 1
**Status**: ✅ DONE

1. 改寫 `src/pages/boxscore.astro`：
   - 移除舊的 placeholder section（「規劃中」）
   - 新增 `import { BoxscoreApp } from '../components/boxscore/BoxscoreApp'`
   - 宣告 `const baseUrl = import.meta.env.BASE_URL`
   - 掛載 `<BoxscoreApp client:load baseUrl={baseUrl} />`

2. Build 驗證：
   ```
   npm run build → SUCCESS
   dist/boxscore/index.html ✓ (15037 bytes)
   5 page(s) built in 722ms
   ```

3. 測試驗證：
   ```
   npm test → PASS (66/66)
   Test Files: 8 passed
   ```

4. Commit：
   ```
   f4fb61c feat(boxscore): wire BoxscoreApp into /boxscore page (Issue #4 Task 7)
   ```
