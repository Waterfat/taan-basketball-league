# 大安ㄍㄤㄍㄤ好籃球聯盟 — 開發設計準則

> 版本：v3.0
> 適用範圍：所有前台頁面的新建與維護
> 目的：確保多人協作 / AI 輔助開發時，程式碼風格、架構、命名保持一致

---

## 一、檔案結構規範

```
basketball-league/
├── index.html            ← 首頁
├── schedule.html         ← 本週賽程
├── standings.html        ← 戰績榜
├── roster.html           ← 球員名單（出席紀錄）
├── dragon.html           ← 積分龍虎榜
├── stats.html            ← 數據統計
├── rotation.html         ← 輪值排班
├── history.html          ← 歷史賽季
├── hof.html              ← 名人堂
├── announce.html         ← 公告欄
├── shared-styles.css     ← 所有 CSS（變數、共用元件、各頁專屬樣式）
├── shared-app.js         ← 共用 JS（導覽列、tab 切換、隊伍配置、Hero 生成、狀態 UI）
├── data/                 ← 靜態資料（JSON）— 未來由後端 API 取代
│   ├── roster.json       ← 球員名單與出席紀錄
│   ├── stats.json        ← 各賽季數據排行
│   ├── schedule.json     ← 賽程資料
│   ├── standings.json    ← 戰績榜
│   ├── dragon.json       ← 積分龍虎榜
│   ├── rotation.json     ← 輪值排班
│   ├── hof.json          ← 名人堂
│   └── home.json         ← 首頁摘要資料
├── js/                   ← 頁面專屬渲染邏輯
│   ├── api.js            ← **API 抽象層**（統一 fetch 入口，切換後端只改這裡）
│   ├── page-home.js      ← 首頁渲染邏輯（戰績、龍虎榜、數據榜）
│   ├── page-roster.js    ← roster.html 的渲染邏輯
│   ├── page-stats.js     ← stats.html 的渲染邏輯
│   ├── page-schedule.js  ← schedule.html & 首頁賽程的渲染邏輯
│   ├── page-standings.js ← standings.html 的渲染邏輯
│   ├── page-dragon.js    ← dragon.html 的渲染邏輯
│   ├── page-rotation.js  ← rotation.html 的渲染邏輯
│   └── page-hof.js       ← hof.html 的渲染邏輯
├── DEVELOPMENT-GUIDELINES.md  ← 本檔案
└── README.md
```

### 核心原則

1. **CSS 全部集中在 `shared-styles.css`**：各頁面 HTML 不得出現 `<style>` 區塊。新頁面需要專屬樣式時，在 shared-styles.css 底部新增以頁面名標示的區段。
2. **共用 JS 集中在 `shared-app.js`**：所有可復用的函式、全域常數、隊伍配置放這裡。
3. **API 抽象層集中在 `js/api.js`**（v3.0 新增）：所有 `fetch()` 呼叫統一透過 `api.js` 發出，各頁面 JS 不得直接呼叫 `fetch()`。未來切換後端 API 時只需修改 `api.js`。
4. **頁面專屬邏輯放 `js/page-{name}.js`**：渲染函式、事件處理、資料轉換邏輯移至獨立檔案，不在 HTML 中寫 inline `<script>` 區塊。所有頁面 JS 使用 IIFE 封裝避免全域污染。
5. **靜態資料放 `data/*.json`**：球員名單、賽季數據、賽程等結構化資料以 JSON 格式存放，由 JS 透過 `api.js` 讀取。
5. **HTML boilerplate 保持統一**：所有頁面使用相同的 `<head>` 結構（參考模板）。

---

## 二、資料與邏輯分離規範（v2.0 新增）

### 2.1 資料檔案規範 (`data/`)

| 檔案 | 內容 | 供哪些頁面使用 |
|------|------|--------------|
| `roster.json` | 週次定義、六隊球員名單與出席紀錄 | roster.html |
| `stats.json` | 各屆賽季的得分/籃板/助攻/抄截/阻攻/EFF 排行 | stats.html |
| `schedule.json` | 賽程總表（週次、對戰組合、比分、工作人員） | schedule.html, index.html |
| `standings.json` | 戰績排名、勝敗記錄、對戰矩陣 | standings.html |
| `dragon.json` | 積分龍虎榜（全員排名、出席/輪值/拖地/季後賽積分） | dragon.html |
| `rotation.json` | 輪值排班（出席狀況、請假名單、輪值分配、累積排行） | rotation.html |
| `hof.json` | 名人堂（場均數據、生涯累計、鐵人榜、奪冠紀錄） | hof.html |
| `home.json` | 首頁摘要（戰績摘要、龍虎榜 TOP10、迷你數據榜） | index.html |

**JSON 格式要求**：
- 使用標準 JSON（雙引號 key/value），不可含 JS 註解
- 數值欄位保持原始型別（number），不要轉為字串
- 未定值使用 `null`（如尚未開打的比分），不使用空字串

### 2.2 API 抽象層規範（v3.0 新增）

所有資料存取統一透過 `js/api.js`，**禁止在頁面 JS 中直接呼叫 `fetch()`**：

```javascript
// js/api.js 提供的 API
api.getRoster()    // → Promise<JSON>
api.getSchedule()  // → Promise<JSON>
api.getStats()     // → Promise<JSON>
api.getStandings() // → Promise<JSON>
api.getDragon()    // → Promise<JSON>
api.getRotation()  // → Promise<JSON>
api.getHof()       // → Promise<JSON>
api.getHome()      // → Promise<JSON>
```

**切換後端 API 時**，只需修改 `api.js` 的 `ApiConfig.BASE_URL` 和 `endpoints` 對應：

```javascript
const ApiConfig = {
  BASE_URL: 'https://api.example.com/v1',  // ← 改這裡
  endpoints: {
    roster: 'roster',                        // ← 改路徑
    schedule: 'schedule',
    // ...
  },
};
```

### 2.3 Fetch 流程規範

所有頁面專屬 JS 必須使用 `async/await` 搭配 `api.js` 讀取資料：

```javascript
async function loadPageData() {
  const container = document.getElementById('content');
  showLoading(container);                      // ← 共用函式（來自 shared-app.js）

  try {
    const data = await api.getXxx();           // ← 透過 api.js 取得資料
    renderContent(data);                       // ← 正常渲染
  } catch (err) {
    console.error('載入失敗:', err);
    showError(container, '資料載入失敗', 'loadPageData'); // ← 共用函式
  }
}
```

### 2.3 Loading / Error / Empty 狀態（v2.0 新增）

所有透過 `fetch()` 載入資料的頁面，**必須處理三種狀態**：

| 狀態 | 觸發時機 | UI |
|------|---------|-----|
| **Loading** | fetch 發出後、回傳前 | 顯示 `.spinner` 或 skeleton screen |
| **Error** | fetch 失敗或 HTTP 非 2xx | 顯示錯誤訊息 + 重試按鈕 |
| **Empty** | 資料回傳但內容為空 | 顯示「目前無資料」友善提示 |

共用 CSS class 已定義於 `shared-styles.css`：
- `.state-msg` — 狀態訊息容器
- `.state-error` — 錯誤色
- `.spinner` — 載入動畫
- `.retry-btn` — 重試按鈕
- `.skeleton` / `.skeleton-line` — 骨架屏

---

## 三、HTML 頁面模板

所有新頁面必須遵循以下骨架：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>頁面名稱 — 大安ㄍㄤㄍㄤ好籃球聯盟</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Anton&family=Bebas+Neue&family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="shared-styles.css">
</head>
<body>

<!-- 導覽列（由 shared-app.js 自動生成內容） -->
<nav id="top-nav"></nav>
<nav class="bottom-nav" id="bottom-nav"></nav>

<div class="wrap">
  <!-- 頁面內容 -->
</div>

<script src="shared-app.js"></script>
<script src="js/api.js"></script>
<!-- 頁面專屬 JS（如有）放在這裡 -->
<script src="js/page-xxx.js"></script>
</body>
</html>
```

### 注意事項
- `<title>` 格式統一為 `頁面中文名 — 大安ㄍㄤㄍㄤ好籃球聯盟`
- Google Fonts link **不要修改**，瀏覽器會自動快取
- **不要在 HTML 中寫 `<style>` 標籤**
- **不要在 HTML 中寫 inline style**，除非是由 JS 動態產生的隊伍色等必要情境
- **不要在 HTML 中寫 `<script>` 包含大量邏輯**，應抽出至 `js/page-xxx.js`

---

## 四、CSS 規範

### 4.1 shared-styles.css 結構

檔案以 `/* ═══ 區塊標題 ═══ */` 作為頁面區段分隔：

```css
/* 全域變數 :root */
/* 全域 reset、body */
/* NAV（top + bottom） */
/* PAGE（wrap、fadeUp） */
/* TYPE（eyebrow、sec-title、label） */
/* CARD */
/* BADGE */
/* TEAM COLORS */
/* SHARED COMPONENTS（see-more-link、stat-table、podium、standings table...） */
/* LOADING / ERROR / EMPTY STATES */          ← v2.0 新增
/* UTILS（row、gap、margin helpers） */
/* ═══ HOME PAGE STYLES ═══ */
/* ═══ SCHEDULE PAGE STYLES ═══ */
/* ═══ STANDINGS PAGE STYLES ═══ */
/* ═══ ROSTER PAGE STYLES ═══ */
/* ═══ DRAGON TIGER PAGE STYLES ═══ */
/* ═══ STATS PAGE STYLES ═══ */
/* ═══ ROTATION PAGE STYLES ═══ */
/* ═══ HISTORY PAGE STYLES ═══ */
/* ═══ HOF PAGE STYLES ═══ */
/* ═══ ANNOUNCEMENTS PAGE STYLES ═══ */
```

### 4.2 命名慣例

| 類型 | 命名方式 | 範例 |
|------|---------|------|
| 頁面專屬 prefix | 頁面縮寫 2-4 字元 | `sched-`, `rot-`, `ann-`, `hof-`, `dt-`, `st-` |
| 共用元件 | 功能描述 | `.card`, `.badge`, `.stat-table`, `.podium` |
| 隊伍色 class | `.c-{color}` (文字) / `.d-{color}` (圓點) | `.c-red`, `.d-green` |
| Badge 變體 | `.b{首字}` | `.bw`(win), `.bl`(lose), `.bs`(special) |
| 互動狀態 | `.active`, `.open`, `.active-toggle` | — |
| 佈局 helpers | 簡短功能詞 | `.row`, `.between`, `.gap`, `.mt`, `.mb` |
| 狀態訊息 | `.state-` prefix | `.state-msg`, `.state-error` |

### 4.3 CSS 變數

所有顏色、圓角、字型均透過 `:root` 變數定義，禁止在樣式中寫 hardcoded 色碼（JS 動態產生的隊伍色除外，應引用 `TEAM_CONFIG`）。

```css
:root {
  /* 主色 */
  --navy, --orange, --cream 等
  /* 文字色 */
  --txt-dark, --txt-mid, --txt-light
  /* 圓角 */
  --r: 14px;  --r-sm: 8px;
  /* 字型 */
  --font-hero, --font-disp, --font-cond, --font-body
}
```

---

## 五、JavaScript 規範

### 5.1 shared-app.js 暴露的共用 API

| 函式 / 常數 | 用途 |
|-------------|------|
| `NAV_ITEMS` | 導覽列設定陣列 |
| `TEAM_CONFIG` | **隊伍色統一配置** — 所有頁面的隊伍色、背景色、CSS class 從此取得 |
| `TEAM_BY_ID` | 以 id 反查的快捷 map |
| `initNavigation()` | 自動產生 top nav + bottom nav |
| `genericTabSwitch(clickedEl, tabClass, panelIds, activeCls, targetId, scope)` | **通用 tab 切換**函式 |
| `toggleCard(el)` | 賽程卡片展開收合 |
| `renderHero(containerId, options)` | **Hero 區塊動態生成**（v2.0 新增） |
| `renderPodium(containerId, top3, unit)` | 共用 podium（前三名）渲染 |
| `teamTdHtml(teamName)` / `nameTdHtml(name, team)` / `rowBgStyle(team)` | HTML 輔助函式 |
| `showLoading(container)` | 顯示載入中狀態（v3.0 提升至共用） |
| `showError(container, msg, retryFnName)` | 顯示錯誤狀態 + 重試按鈕（v3.0 提升至共用） |
| `showEmpty(container, msg)` | 顯示空資料狀態（v3.0 提升至共用） |

### 5.2 TEAM_CONFIG 使用規範

```javascript
const TEAM_CONFIG = {
  '紅': { id:'red', cls:'c-red', dot:'d-red', color:'#e53935', ... },
  // ...
};
```

**各頁面的 JS 必須引用 `TEAM_CONFIG`**，禁止自行重複定義隊伍色 mapping。

### 5.3 通用 Tab 切換

使用 `genericTabSwitch()` 取代各頁獨立的 `switchTab`、`switchHof`、`switchMS` 等函式：

```javascript
// 用法範例：
// onclick="genericTabSwitch(this, 'stab', ['s-scoring','s-rebound',...], 'active', 's-scoring')"
```

### 5.4 頁面專屬 JS（`js/page-xxx.js`）

- **必須放在 `<script src="shared-app.js"></script>` 之後**
- **資料不在 JS 中 hardcode**，改用 `fetch('./data/xxx.json')` 讀取
- 渲染函式如需使用隊伍色，一律透過 `TEAM_CONFIG` 取得
- 函式命名建議加上頁面前綴避免衝突：`stats_renderAll()`、`roster_renderAll()` 等
- **必須處理 Loading / Error / Empty 三種狀態**

### 5.5 禁止 Inline Script（v2.0 強調）

HTML 頁面中**禁止**出現大段 `<script>` 區塊。唯一允許的例外：

```html
<!-- 允許：一行啟動呼叫 -->
<script>document.addEventListener('DOMContentLoaded', loadSchedule);</script>
```

---

## 六、隊伍色使用規範

### 6.1 六隊色碼對照

| 隊伍 | 文字色 | 色條/圓點 | 列背景 (rgba) | 備註 |
|------|--------|----------|--------------|------|
| 紅 | `#e53935` | `#e53935` | `rgba(229,57,53,.14)` | |
| 黑 | `#4a4a4a` | `#4a4a4a` | `rgba(40,40,40,.12)` | |
| 藍 | `#1976d2` | `#1976d2` | `rgba(25,118,210,.12)` | |
| 綠 | `#2e7d32` | `#2e7d32` | `rgba(46,125,50,.16)` | |
| 黃 | `#b38f00` | `#e6b800` | `rgba(230,184,0,.14)` | 文字用深版 `#b38f00` 確保白底可讀 |
| 白 | `#757575` | `#9e9e9e` | `rgba(158,158,158,.07)` | 文字用灰色確保可讀 |

### 6.2 使用方式

- **CSS 中**：使用 `.c-red`, `.c-blue` 等 class 設定文字色
- **CSS 中**：使用 `.d-red`, `.d-blue` 等 class 設定圓點色
- **JS 動態渲染中**：透過 `TEAM_CONFIG['紅'].bg` 取得背景色，設定在 inline style
- **不要**在 HTML 中 hardcode 色碼（如 `style="color:#e53935"`），除非是 JS 動態產生

---

## 七、Hero 區塊設計模式

所有子頁面頂部的 Hero 遵循統一模式：

```css
.{page}-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--r);
  margin-bottom: 1.5rem;
  background:
    linear-gradient(135deg, rgba(15,27,45,.9) 0%, rgba(15,27,45,.65) 100%),
    url('...') center/cover no-repeat;
  padding: 1.7rem 2rem;
}
```

**動態生成方式**（v2.0 新增，選用）：

```javascript
renderHero('hero-container', {
  title: '頁面標題',
  subtitle: '副標題',
  eyebrow: '第 25 屆',
  heroClass: 'stats-hero',
  heroType: 'simple'   // or 'layered'
});
```

帶有背景圖分層的變體（history、hof、dragon）使用 `heroType: 'layered'`。

---

## 八、響應式斷點

| 斷點 | 用途 |
|------|------|
| `≤ 400px` | 極小手機：隱藏部分欄位 |
| `≤ 420px` | 小手機：game-grid 改單欄 |
| `≤ 560px` | 一般手機：隱藏戰績近況等次要欄位 |
| `≤ 600px` | 手機：roster hero 縮小 |
| `≤ 680px` | 大手機/小平板：雙欄改單欄 |
| `≥ 700px` | 桌機：顯示 top nav，隱藏 bottom nav |

行動優先設計：**預設寫手機樣式，桌機樣式用 `@media (min-width: 700px)` 覆寫**。

---

## 九、新增頁面 Checklist

新增一個頁面時，請依序完成：

- [ ] 複製 HTML 模板骨架
- [ ] 在 `shared-app.js` 的 `NAV_ITEMS` 中新增導覽項
- [ ] 頁面專屬 CSS 寫在 `shared-styles.css` 底部，用 `/* ═══ PAGE NAME ═══ */` 區段標示
- [ ] 若有資料需求，建立 `data/xxx.json`，頁面 JS 透過 `fetch()` 讀取
- [ ] 渲染邏輯寫在 `js/page-xxx.js`，不寫 inline `<script>`
- [ ] 隊伍色透過 `TEAM_CONFIG` 取得，不自行定義
- [ ] Tab 切換使用 `genericTabSwitch()`，不自寫函式
- [ ] 實作 Loading / Error / Empty 三種狀態
- [ ] 測試手機版 bottom nav 是否正確高亮
- [ ] 測試桌機版 top nav 是否正確高亮
- [ ] 確認 `<title>` 遵循命名規範

---

## 十、常見錯誤與避免方式

| ❌ 不要 | ✅ 應該 |
|---------|--------|
| 在 HTML `<style>` 中寫 CSS | 所有樣式放 `shared-styles.css` |
| 在 HTML `<script>` 中寫大段 JS | 渲染邏輯抽至 `js/page-xxx.js` |
| 在 JS 中 hardcode 資料陣列 | 資料放 `data/*.json`，透過 `api.js` 讀取 |
| 在頁面 JS 中直接呼叫 `fetch()` | 透過 `api.js` 的 `api.getXxx()` 取得資料 |
| 將變數暴露至全域 | 使用 IIFE 封裝，只暴露必要的入口函式 |
| 複製隊伍色定義到各頁面 JS | 引用 `TEAM_CONFIG` |
| 每個頁面寫自己的 tab 切換邏輯 | 使用 `genericTabSwitch()` |
| inline style 寫死色碼 | 使用 CSS class 或 `TEAM_CONFIG` |
| `fetch` 成功直接渲染，不處理錯誤 | 必須處理 Loading / Error / Empty |
| 修改 Google Fonts link | 維持統一，瀏覽器會快取 |
| 在 shared-styles.css 中段插入新樣式 | 在對應頁面區段或底部新增 |

---

## 十一、版本控制建議

- 每次修改 shared-styles.css 或 shared-app.js 時，應同步測試**所有頁面**
- CSS 變數修改影響全站，需格外謹慎
- 新增共用元件時，先確認是否有類似元件可復用
- `data/*.json` 修改後，建議用 JSON validator 驗證格式正確

---

## 十二、未來架構演進路線圖（v2.0 新增）

以下為建議的演進方向，不強制要求但供規劃參考：

### P1：CSS 模組化（行有餘力）
- 將 `shared-styles.css` 拆分為：`base.css`（變數/Reset）、`components.css`（Card/Badge/Table）、`layout.css`（Nav/Hero）、`pages/*.css`
- 引入 SCSS 預處理器管理巢狀與變數

### P2：賽程狀態自動判斷
- 在 `js/page-schedule.js` 加入時間比對邏輯：
  - 比賽時間未到 → 顯示「VS」
  - 比賽時間已過且有比分 → 顯示「比分」
  - 比賽進行中 → 顯示「🔴 LIVE」標籤

### P3：後端 API 切換（v3.0 已預備）
- `js/api.js` 已建立統一 API 抽象層，所有頁面的資料存取均透過 `api.js`
- 切換後端時只需修改 `ApiConfig.BASE_URL` 和 `endpoints` 對應
- 可在 `api.js` 中加入 **資料轉換層（transformer）**，將後端回傳格式轉為前端所需格式
- 可加入 auth token、request headers、快取策略等
