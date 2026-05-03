# Issue #14 Task 9 — 龍虎榜分組 + Hero 擴充（C1~C4）

**Goal**：
- C1：DragonTabPanel 用 civilianThreshold 切兩組（平民/奴隸區），加分組標題
- C3：表格下方加選秀規則連結（從 `dragon.rulesLink`）
- C2 + C4：RosterHero 接受 activeTab prop，dragon tab 時顯示新 subtitle + 三 chip

**Files**：
- `src/components/roster/DragonTabPanel.tsx`（拆分組 + group titles + rules link）
- `src/components/roster/RosterHero.tsx`（接 activeTab prop + 條件顯示 subtitle/chips）
- `src/components/roster/RosterApp.tsx`（傳 activeTab 給 RosterHero）

**Plan reference**：見 `docs/specs/plans/2026-05-03-issue-14-missing-features.md` Task 9 段落

## Acceptance
- E2E：
  - `tests/e2e/features/roster/dragon-tab.spec.ts` 全綠（E-803~E-804）
  - `tests/e2e/features/roster/dragon-tab-grouping.spec.ts` 全綠（E-801~E-802）
  - `tests/e2e/features/roster/hero-roster-tab.spec.ts` 全綠（E-901~E-902）
- 既有 roster specs 不退化

## Style Rules
- **style-rwd-list**：DragonTabPanel 既有 PC table + Mobile card 雙呈現，分組後兩組各自保留同模式
- **style-skeleton-loading**：RosterApp 既有 SkeletonState 沿用

## Result

**狀態**：完成 ✅

**變更檔案**：
- `src/components/roster/DragonTabPanel.tsx` — 重構：
  - 抽出 `DragonGroupTable` 子元件（PC table + Mobile cards 雙呈現）
  - 用 `total >= civilianThreshold` 切分為平民/奴隸區，各自包裝 `<section data-testid="dragon-group-civilian">` 與 `<section data-testid="dragon-group-slave">`，含 `data-group` 屬性
  - 平民區標題：「🧑 平民區（前 {threshold} 名 · 可優先自由選擇加入隊伍）」
  - 奴隸區標題：「⛓️ 奴隸區（第 {threshold + 1} 名起 · 為聯盟貢獻過低淪為奴隸，無法自由選擇進入哪一隊）」
  - 結尾加 `dragon-rules-link`（從 `data.rulesLink`，`target="_blank"` + `rel="noopener noreferrer"`，文案「📋 查看完整選秀規則公告 →」）
  - 既有 `civilian-divider` testid 移到兩 group section 之間（PC + Mobile 皆可見），向後相容 AC-8
- `src/components/roster/RosterHero.tsx` — 接受新 prop `activeTab: RosterTab`：
  - dragon tab：title「龍虎榜 · 第 N 季」、subtitle「活躍度積分累計 · 決定下賽季選秀順位」、三個 chip（`hero-chip-civilian` / `hero-chip-slave` / `hero-chip-playoff-note`）
  - roster tab：保留原行為「ROSTER · 第 N 季」+「{phase} · 平民線 N 分」，不渲染任何 chip
- `src/components/roster/RosterApp.tsx` — 傳 `activeTab` 給 RosterHero。

**測試結果**：
- TypeScript：通過（exit 0）。
- E2E：
  - `tests/e2e/features/roster/dragon-tab.spec.ts` E-803 + E-804 全綠（含 features-mobile）
  - `tests/e2e/features/roster/dragon-tab-grouping.spec.ts` E-801 + E-802 全綠
  - `tests/e2e/features/roster/hero-roster-tab.spec.ts` E-901 + E-902 全綠
- 既有 dragon-tab AC tests（AC-5~AC-10、AC-19、AC-20）皆通過。
- **唯一 pre-existing failure**：`features-mobile` AC-9a（裁判 icon 在 mobile viewport 上不可見）— 此為基線就存在的失敗（mobile 用 `dragon-player-card` 而非 `dragon-player-row` testid），與 Task 9 改動無關。

**設計決策（Deviation from plan code spec）**：
- 分組標題的「前 N 名」的 N **改用 `civilianThreshold`**（不是 plan 範例的 `civilianCount`）。理由：fixture `mockDragonGroupingShowcase` 的 threshold=10，spec E-801 期待「前 10 名」（threshold 值），而非實際平民人數 5。對應的奴隸區「第 N+1 名起」也沿用同邏輯。
