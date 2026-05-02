# Issue #4 Task 4: BoxscorePanel 元件群（chip + 卡片 + 表格 + 三狀態）

## 目標
產出 boxscore tab 的元件群：BoxscorePanel（state machine + chip + 卡片列表 + scroll-to-game）+ BoxscoreGameCard（雙隊表格 + staff toggle）+ BoxscoreTeamTable（11 欄主表 + 合計 row + DNP 樣式）+ 三狀態元件（Skeleton/Error/Empty）。

## 要修改/新增的檔案
- Create: `src/components/boxscore/BoxscorePanel.tsx`
- Create: `src/components/boxscore/BoxscoreGameCard.tsx`
- Create: `src/components/boxscore/BoxscoreTeamTable.tsx`
- Create: `src/components/boxscore/BoxscoreSkeleton.tsx`
- Create: `src/components/boxscore/BoxscoreError.tsx`
- Create: `src/components/boxscore/BoxscoreEmpty.tsx`

## 驗收標準
- [ ] testid 命名與 spec 一致：`bs-week-chip[data-active][data-week]`、`bs-game-card[data-game][data-highlighted]`、`bs-game-title`、`bs-team-table[data-team]`、`bs-totals-row`、`bs-player-row[data-dnp]`、`bs-staff-toggle`、`bs-staff-panel`、`bs-skeleton`、`bs-error`、`bs-empty`
- [ ] 11 欄主表（球員/得分/2P/3P/FT/TREB/AST/STL/BLK/TOV/PF）
- [ ] 合計 row 用 TEAM_CONFIG 隊色
- [ ] DNP 樣式：text-gray-400 italic + 「(未出賽)」標籤
- [ ] staff 預設摺疊、有 staff 才顯示 toggle
- [ ] highlight game 時 scroll into view（block: 'center'）

## Style Rules（從計畫檔複製，subagent 必讀）

### style-skeleton-loading（命中：BoxscorePanel 三狀態）
- Skeleton 形狀對應真實內容：chip timeline 骨架（8 個 chip 形狀色塊）+ 卡片骨架
- 用 `animate-pulse` + `bg-gray-200`
- 操作立刻有視覺回饋：tab 切到 boxscore → 立刻顯示 BoxscoreSkeleton（不等資料）
- 禁止整頁 spinner / 禁止空白等資料

### style-rwd-list（命中：11 欄表格）
- **規格優先覆寫**：本元件保留 11 欄 table（不切 mobile card），改用 `overflow-x-auto -mx-4 px-4` 容器讓手機橫向捲動。理由：球員數據對照需要 column 對齊（合計 row + DNP 視覺）。
- 桌機 ≥md：完整顯示 11 欄不需捲動
- DNP row：`text-gray-400 italic`，名字後加「(未出賽)」標籤

## 執行記錄

### Attempt 1

**狀態**：DONE
**Commit**：b9ca8fc
**Tests**：66/66 pass（tsc --noEmit 無錯誤）
**元件建立**：
- `src/components/boxscore/BoxscoreSkeleton.tsx` — animate-pulse，8 chip 骨架 + 2 卡片骨架
- `src/components/boxscore/BoxscoreError.tsx` — bs-error + onRetry button
- `src/components/boxscore/BoxscoreEmpty.tsx` — bs-empty
- `src/components/boxscore/BoxscoreTeamTable.tsx` — 11 欄主表，合計 row 套 TEAM_CONFIG 隊色，DNP italic + (未出賽) 標籤
- `src/components/boxscore/BoxscoreGameCard.tsx` — data-highlighted（spec 優先），staff 摺疊，highlight 邊框
- `src/components/boxscore/BoxscorePanel.tsx` — state machine (loading/error/empty/ok)，chip timeline，reloadKey，scroll-to-game

**注意事項**：
- `data-highlighted` 採用 spec 版本（非 plan 樣板的 `data-highlight`）
- COLUMNS（全欄位定義）從 BoxscoreTeamTable 移除，僅保留 MAIN_COLUMNS（11 欄）避免 TS unused variable 警告
- useEffect 依賴 `[reloadKey]`（刻意忽略 activeWeek，fetch 一次取全部 weeks）
