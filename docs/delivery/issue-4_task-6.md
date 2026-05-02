# Issue #4 Task 6: BoxscoreApp 整合（sub-tab + URL sync + popstate）

## 目標
產出 BoxscoreApp（核心控制器，含 sub-tab 切換、URL sync via history.replaceState、popstate listener）+ BoxscoreHero（依 active tab 切副標）+ SubTabs（按鈕列）。

## 要修改/新增的檔案
- Create: `src/components/boxscore/BoxscoreApp.tsx`
- Create: `src/components/boxscore/BoxscoreHero.tsx`
- Create: `src/components/boxscore/SubTabs.tsx`

## 驗收標準
- [ ] BoxscoreHero testid：`data-hero`、`hero-title`、`hero-subtitle`
- [ ] SubTabs testid：`sub-tab[data-tab=leaders|boxscore][data-active=true|false]`
- [ ] 兩 panel 都掛載（用 `display:none` 隱藏 inactive）→ 切換 tab 立即顯示對應 panel skeleton
- [ ] URL sync 用 `history.replaceState`（非 push）
- [ ] popstate listener：上下頁時重新解析 URL
- [ ] leaders tab → URL 不帶 query；boxscore tab → 永遠帶 `?tab=boxscore`
- [ ] BoxscorePanel 換週時 → 同步 URL（保留 tab=boxscore）
- [ ] baseUrl 處理：`/` 或 `/taan-basketball-league/` 都能正確串成 boxscore URL

## Style Rules（從計畫檔複製，subagent 必讀）

### style-skeleton-loading（命中：BoxscoreApp 同頁同時 fetch boxscore + leaders 兩支 API）
- 切換 sub-tab → 對應 panel 立即顯示自己的 skeleton（panel 內已實作）
- BoxscoreApp 本身不阻塞 — 兩 panel 都已掛載（用 `display:none` 隱藏非 active），切換 tab 立即可見對應狀態
- Hero + SubTabs 由 React 立即 render（state 為 client-side），不留白

## 執行記錄

### Attempt 1

**狀態**：DONE
**Commit**：aee4d22
**Tests**：66/66

**建立檔案**：
- `src/components/boxscore/BoxscoreHero.tsx` — 依 activeTab 切副標（領先榜 / 逐場 Box），testid data-hero / hero-title / hero-subtitle 全數到位
- `src/components/boxscore/SubTabs.tsx` — 按鈕列，data-testid="sub-tab" + data-tab + data-active 正確
- `src/components/boxscore/BoxscoreApp.tsx` — 核心控制器，URL sync via history.replaceState，popstate listener，兩 panel 都掛載用 display:none 隱藏 inactive，deriveBase 正確處理 baseUrl

**驗收項目**：
- [x] BoxscoreHero testid：`data-hero`、`hero-title`、`hero-subtitle`
- [x] SubTabs testid：`sub-tab[data-tab=leaders|boxscore][data-active=true|false]`
- [x] 兩 panel 都掛載（用 `display:none` 隱藏 inactive）→ 切換 tab 立即顯示對應 panel skeleton
- [x] URL sync 用 `history.replaceState`（非 push）
- [x] popstate listener：上下頁時重新解析 URL
- [x] leaders tab → URL 不帶 query；boxscore tab → 永遠帶 `?tab=boxscore`
- [x] BoxscorePanel 換週時 → 同步 URL（保留 tab=boxscore）
- [x] baseUrl 處理：`/` 或 `/taan-basketball-league/` 都能正確串成 boxscore URL
- [x] npx tsc --noEmit PASS
- [x] npm test 66/66 PASS
