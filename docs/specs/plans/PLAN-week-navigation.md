# 賽程週次導航功能 — 實作計劃

## 目標

利用 `datas!D87:N113` 的本季完整賽程資料，實作賽程頁面的「前一週 / 下一週」導航功能，讓使用者可以瀏覽每一週的對戰組合、賽果、輪值人員、日期地點。

---

## 資料格式確認（已從 Sheets 拉取驗證）

### `datas!D87:N113` 欄位對應

| D | E | F | G | H~M | N |
|---|---|---|---|-----|---|
| 周次 | 日期 | 狀態 | 比賽場地 | 對戰組合 1~6 | 備註 |

### 列結構（共 27 列）

| 列 | 類型 | 說明 |
|----|------|------|
| 第 0 列 | 標題列 | `周次, 日期, 狀態, ...` — 跳過 |
| 第 1 列 | 哨兵列 | `0, 1980/1/1` — 跳過 |
| 第 2~26 列 | 實際資料 | 依周次欄判斷類型 |

### 狀態欄（F）可能值

| 值 | 意義 |
|----|------|
| `熱身賽` | 熱身週（周次 1~2） |
| `例行賽` | 例行賽週（周次 3~12） |
| `季後賽` | 季後賽週（周次 13~15） |
| `停賽` | 停賽週（周次欄空白） |
| 空白 | 未使用的佔位列（尾部） |

### 對戰組合儲存格格式

```
已完成比賽：  白vs紅\n22 : 34
尚未對戰組合：vs\n
停賽週：     （空字串）
```

格式規則：`{主隊}vs{客隊}\n{主隊分數} : {客隊分數}`

### 週次結構概覽

```
周次 1  — 2026/1/10  — 熱身賽 — 中正 — ✅ 已完成（有賽果）
周次 2  — 2026/1/17  — 熱身賽 — 中正 — ✅ 已完成
周次 3  — 2026/1/24  — 例行賽 — 中正 — ✅ 已完成
周次 4  — 2026/1/31  — 例行賽 — 中正 — ✅ 已完成
周次 5  — 2026/2/7   — 例行賽 — 三重 — ✅ 已完成（目前最新完成週）
停賽    — 2026/2/14  — 停賽   — 大安 — 過年連假
停賽    — 2026/2/21  — 停賽   — 大安 — 過年連假
停賽    — 2026/2/28  — 停賽   — 大安 — 228連假
周次 6  — 2026/3/7   — 例行賽 — 中正 — 尚未開賽（vs\n）
周次 7~9  — 例行賽 — 尚未開賽
停賽    — 2026/4/4   — 停賽   — 大安 — 清明連假
周次 10~12 — 例行賽 — 尚未開賽
停賽    — 2026/5/2   — 停賽   — 大安 — 勞動節
周次 13~15 — 季後賽 — 尚未開賽
（尾部 5 列佔位列 — 無周次、無狀態）
```

### 與現有 `datas!D2:M7` 的對應

`D2:M7` 提供**當前週**的詳細資料（6 場比賽各自的輪值人員），其中 `week=5` 對應 allSchedule 的 `周次 5`。兩者互補：
- `allSchedule`：所有週的概覽（對戰組合 + 賽果）
- `home`：當前週的輪值人員明細

---

## 資料結構變更

### 1. `ApiConfig.sheetsRanges` 新增範圍

```javascript
sheetsRanges: {
  home:         'datas!D2:M7',       // 既有 — 當週詳細賽程（含輪值人員）
  allSchedule:  'datas!D87:N113',    // 新增 — 本季所有週次概覽
  // ... 其他不變
}
```

### 2. 擴展 `schedule` 資料結構

```javascript
// Schedule 頂層（調整）
{
  season: 25,
  currentWeek: 5,             // 改用 allSchedule 的絕對周次
  totalWeeks: 15,             // 總比賽週數（不含停賽）
  weeks: { ... },             // 所有週次（key = 周次數字字串）
  suspendedWeeks: [ ... ],    // 新增：停賽週列表
  weekOrder: [ ... ],         // 新增：所有日期列的順序（含停賽），供導航用
}

// WeekData（新增欄位 ✅）
{
  date: "2026/1/10",          // 比賽日期
  venue: "中正",              // 場地
  phase: "熱身賽",            // ✅ 新增：狀態/階段

  matchups: [                 // 對戰組合（✅ 新增賽果欄位）
    {
      combo: 1,
      home: "白",
      away: "紅",
      homeScore: 22,          // ✅ null = 尚未開打
      awayScore: 34,          // ✅
      status: "finished"      // ✅ "finished" | "upcoming"
    },
    ...
  ],

  games: [ ... ],             // 僅當前週有（含輪值人員明細）
}

// SuspendedWeek（新增 ✅）
{
  date: "2026/2/14",
  venue: "大安",
  reason: "過年連假",         // 停賽原因
}

// weekOrder（新增 ✅ — 按日期順序的導航索引）
// 包含所有列（比賽週 + 停賽週），供前一週/下一週按鈕使用
[
  { type: "game", week: 1 },
  { type: "game", week: 2 },
  ...
  { type: "suspended", index: 0 },  // 對應 suspendedWeeks[0]
  { type: "suspended", index: 1 },
  ...
]
```

### 3. 各週顯示邏輯

| 週次類型 | 顯示內容 |
|----------|----------|
| 已完成週（有賽果） | Hero（日期/場地/階段）+ 對戰組合卡片含比分 + 輪值人員 |
| 當前週 | Hero + 完整 game cards（含 staff 展開）+ 輪值人員 |
| 停賽週 | Hero（日期/場地）+ 停賽原因提示卡 |
| 未來週（有對戰組合） | Hero + 對戰組合卡片（尚未開打） |
| 未來週（無對戰組合） | Hero + 「對戰組合尚未公告」提示 |

---

## 輪值人員：歷史週次的處理

### 問題

目前輪值人員資料只有當前週（`datas!D2:M7` 提供 staff），歷史週次的 staff 資料不在 Sheets 中。

### 方案

當前週的輪值人員從 `D2:M7` 即時取得；歷史週次的輪值人員需要一個持久化儲存。

**建議做法**：擴充 `data/schedule.json` 作為歷史紀錄庫。每當新一週資料確定後，將該週的 `games`（含 staff）寫入 `schedule.json`。這樣：
- 當前週：Sheets 即時資料（`D2:M7`）
- 歷史週：`schedule.json` 中已儲存的 `games` 資料
- 未來週：無 staff 資料

> **需確認**：歷史週次的輪值人員資料是否有其他 Sheets 範圍可以取得？
> 還是以手動/定期更新 `schedule.json` 的方式維護？

---

## 實作步驟

### Step 1：API 層修改（`js/api.js`）

1. 在 `sheetsRanges` 新增 `allSchedule: 'datas!D87:N113'`
2. 新增 `parseMatchupCell(cell)` 函數
   - 解析 `"白vs紅\n22 : 34"` → `{ home: "白", away: "紅", homeScore: 22, awayScore: 34, status: "finished" }`
   - 解析 `"vs\n"` → `{ home: "", away: "", homeScore: null, awayScore: null, status: "upcoming" }`
3. 新增 `transformAllSchedule(rows)` 函數
   - 跳過標題列（第 0 列）和哨兵列（第 1 列，周次=0）
   - 遍歷剩餘列，依周次欄 + 狀態欄判斷：
     - 有周次數字 → 比賽週，解析 6 個對戰組合
     - 狀態=`停賽` → 停賽週，讀取備註欄作為原因
     - 狀態為空白且無周次 → 佔位列，跳過
   - 組裝 `weeks`、`suspendedWeeks`、`weekOrder`
4. 修改 `api.getSchedule()`
   - 批次抓取 `allSchedule` + `home`
   - 用 `transformAllSchedule` 建構所有週次
   - 用 `transformSchedule` 取得當前週的 `games`（含 staff），合併進對應週次
   - 嘗試從 `schedule.json` 取得歷史週次的 `games` 資料補入

### Step 2：頁面邏輯修改（`js/page-schedule.js`）

1. 新增狀態管理
   ```javascript
   let _schedule = null;       // 完整賽程資料
   let _viewIndex = 0;         // 當前在 weekOrder 中的索引
   ```

2. 改寫 `loadSchedule()`
   - 取得完整資料後，找到 currentWeek 在 weekOrder 中的位置
   - 初始渲染該週

3. 新增 `navigateWeek(direction)` — 暴露為全域函數
   - `'prev'` / `'next'` 在 weekOrder 中移動索引
   - 到達頭尾時 disable 對應按鈕
   - 呼叫 `renderWeekView()`

4. 新增 `renderWeekView()` — 根據 weekOrder 當前項目類型渲染
   - 更新 Hero（週次標題、日期、場地）
   - 更新按鈕 disabled 狀態及周次指示（例如 `第 3 週 / 共 15 週`）
   - 比賽週：渲染對戰組合卡片（含賽果）+ 輪值人員區塊
   - 停賽週：渲染停賽提示

5. 新增 `buildMatchupResultCard(matchup)` — 適用於非當前週的簡化卡片
   - 顯示主客隊 + 比分（或「尚未開打」）
   - 不含 staff 展開功能

6. 新增 `renderWeekStaff(weekData)` — 渲染輪值人員區塊
   - 若該週有 `games` 且 games 有 staff → 顯示各場次裁判/場務等
   - 否則不顯示

### Step 3：HTML 修改（`schedule.html`）

1. Hero 區改為動態容器
   ```html
   <div class="sched-hero">
     <div id="sched-hero-content">
       <!-- 由 JS 動態填入：屆次、週次標題、日期場地 -->
     </div>
   </div>
   ```

2. 週次導航按鈕綁定事件 + 加入 id
   ```html
   <button id="btn-prev-week" class="wbtn" onclick="navigateWeek('prev')">← 前一週</button>
   <div id="wk-label" class="wk-lbl">例行賽 第 3 週</div>
   <button id="btn-next-week" class="wbtn" onclick="navigateWeek('next')">下一週 →</button>
   ```

3. 新增停賽提示容器
   ```html
   <div id="sched-suspended" class="card" style="display:none">
     <!-- 停賽原因 -->
   </div>
   ```

4. 新增輪值人員容器（放在對戰組合/賽程順序區塊下方）
   ```html
   <div id="sched-staff" style="display:none">
     <!-- 該週輪值人員 -->
   </div>
   ```

### Step 4：Mock 資料更新（`js/mock-data.js`）

擴充 `MOCK_DATA.schedule` 為多週次結構：
- 週次 1~5：已完成（含賽果）
- 停賽週（過年/228）
- 週次 6+：未來（無賽果）
- 週次 5 保留完整 games + staff（當前週）

### Step 5：靜態 JSON 更新（`data/schedule.json`）

更新為多週次格式，包含已完成週次的 games（含 staff），作為：
1. Sheets 不可用時的 fallback
2. 歷史週次輪值人員的儲存庫

---

## 頁面行為流程

```
使用者進入 schedule.html
       ↓
loadSchedule()
  ├─ 抓 allSchedule（全季概覽）
  ├─ 抓 home（當前週 staff）
  └─ 讀 schedule.json（歷史 staff）
       ↓
合併資料，定位 currentWeek
       ↓
renderWeekView() — 初始顯示 currentWeek
       ↓
  ┌─────────────────────────┐
  │  ← 前一週 / 下一週 →    │
  └────────┬────────────────┘
           ↓
  navigateWeek(direction)
           ↓
  renderWeekView()
           ↓
  ┌────────────────────────────────────┐
  │ 停賽週？→ 停賽原因提示             │
  │ 有 games？→ 完整 game cards + staff │
  │ 有 matchups + 賽果？→ 賽果卡片     │
  │ 有 matchups 無賽果？→ 對戰組合預告  │
  │ 無 matchups？→ 「對戰組合尚未公告」 │
  └────────────────────────────────────┘
```

---

## 影響範圍

| 檔案 | 異動類型 | 異動內容 |
|------|----------|----------|
| `js/api.js` | 修改 | 新增 range + transformer + 修改 getSchedule |
| `js/page-schedule.js` | 修改 | 新增導航邏輯 + 多種渲染函數 |
| `schedule.html` | 修改 | Hero 動態化 + 按鈕綁定 + 新增容器 |
| `js/mock-data.js` | 修改 | 擴充多週次 mock 資料 |
| `data/schedule.json` | 修改 | 擴充多週次 + 歷史 staff 資料 |

**不需變更**：`shared-app.js`、`rotation.html`、`page-rotation.js`、其他頁面

---

## 待確認

1. **歷史輪值人員來源** — 歷史週次的 staff 資料是否有 Sheets 範圍可取得？還是由我手動把已知的歷史資料寫入 `schedule.json`？
