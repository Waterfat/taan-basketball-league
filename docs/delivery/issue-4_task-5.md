# Issue #4 Task 5: Leaders types + format utils + LeadersPanel 元件群 + Unit Tests

## 目標
產出 leaders 完整資料層 + 元件群：型別、format utils（進階指標 + 取最新賽季 key）、LeadersPanel + LeaderCard + 三狀態元件（Skeleton/Error/Empty）、unit test。

## 要修改/新增的檔案
- Create: `src/types/leaders.ts`
- Create: `src/lib/leaders-format.ts`
- Create: `src/components/boxscore/LeadersPanel.tsx`
- Create: `src/components/boxscore/LeaderCard.tsx`
- Create: `src/components/boxscore/LeadersSkeleton.tsx`
- Create: `src/components/boxscore/LeadersError.tsx`
- Create: `src/components/boxscore/LeadersEmpty.tsx`
- Test: `tests/unit/leaders-format.test.ts`
- Test (existing, turn red→green): `tests/integration/boxscore-parse.integration.test.ts` (cases I-8, I-9, I-10)

## 驗收標準（來自 qaplan / plan）
- [ ] U-6a~g: scoring/rebound 進階格式 + getCurrentSeasonKey
- [ ] I-8: fetchData('stats') 成功
- [ ] I-9: fetchData('stats') 全失敗
- [ ] I-10: leaders 空資料仍非 error
- [ ] LeaderCard / LeadersPanel testid 命名與 spec 一致：`leaders-panel`/`leaders-card[data-category=...]`/`leader-row[data-rank=N]`/`leader-name`/`leader-team-dot[data-team=...]`/`leader-val`/`leader-advanced`/`leaders-skeleton`/`leaders-error`/`leaders-empty`

## Style Rules（從計畫檔複製，subagent 必讀）

### style-skeleton-loading（命中：LeadersPanel 三狀態）
- LeadersSkeleton 形狀對應真實內容：6 個 `bg-gray-200 rounded-2xl` 卡片骨架，每張內含 1 個標題色塊 + 10 行短條色塊
- 桌機 `md:grid-cols-2`、手機 `grid-cols-1`，與真實 LeadersPanel layout 一致避免 layout shift
- `animate-pulse`、不用 spinner、不用文字
- 操作立刻有視覺回饋：tab 切到 leaders → 立刻顯示 LeadersSkeleton

### style-rwd-list（命中：top 10 多欄列表 = card-with-rows）
- 完全遵循：桌機 6 卡片兩欄並排（`md:grid-cols-2`）；手機單欄堆疊（`grid-cols-1`）
- 每張卡片內部已是 card 形式（標題 + label-value 行），手機不再拆 card

## 執行記錄

### Attempt 1

**執行時間**：2026-05-02

**TDD 流程**：
1. 先寫 `tests/unit/leaders-format.test.ts` → 確認 FAIL（Cannot find module）
2. 建立 `src/types/leaders.ts`
3. 建立 `src/lib/leaders-format.ts`
4. 跑測試 → unit 7/7 PASS，I-8/I-9/I-10 PASS
5. 建立 5 個元件（LeadersSkeleton、LeadersError、LeadersEmpty、LeaderCard、LeadersPanel）
6. 補 `data-testid="leaders-skeleton"` 到 LeadersSkeleton 根元素（plan 樣板未包含）
7. 補 `data-team={e.team}` 到 `leader-team-dot`（spec testid 要求）
8. `npx tsc --noEmit` → 無錯誤
9. `npm test` → 2 failed（I-5/I-7，fetchBoxscore stub，Task 1-3 遺留，非 Task 5 範疇）；47/49 PASS
10. Commit：`1010382`

**驗收項目狀態**：
- [x] U-6a~g: 7/7 PASS
- [x] I-8: PASS（source='gas' 或 'static'）
- [x] I-9: PASS（source='error'）
- [x] I-10: PASS（空資料仍非 error）
- [x] testid 全覆蓋：`leaders-panel`/`leaders-card[data-category=...]`/`leader-row[data-rank=N]`/`leader-name`/`leader-team-dot[data-team=...]`/`leader-val`/`leader-advanced`/`leaders-skeleton`/`leaders-error`/`leaders-empty`

**Commit hash**：`1010382`
