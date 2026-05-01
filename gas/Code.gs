/* ══════════════════════════════════════════════════════════════
   大安ㄍㄤㄍㄤ好籃球聯盟 — GAS Web App API
   ══════════════════════════════════════════════════════════════
   單一入口點，透過 ?type=xxx 參數路由至各 handler。
   讀取 Google Sheets 資料，轉換為前端所需的 JSON 格式回傳。

   部署方式：
   1. 在 Google Apps Script 中建立新專案
   2. 將此檔案內容貼入 Code.gs
   3. 填入下方 CONFIG 中的 Sheets ID 和工作表名稱
   4. 部署 → 新增部署 → Web 應用程式
      - 執行身分：我
      - 誰可以存取：所有人
   5. 將部署 URL 貼到前端 js/api.js 的 GAS_URL
   ══════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════
   設定區 — 請填入您的 Sheets 資訊
   ══════════════════════════════════════ */

var CONFIG = {

  /* ── Google Sheets ID ──
     從 Sheets URL 取得：
     https://docs.google.com/spreadsheets/d/{THIS_PART}/edit
     若所有資料在同一 Sheets，只需填 MAIN。
     若分散於多個 Sheets，可新增 key。 */
  SHEETS: {
    MAIN: 'YOUR_SHEET_ID_HERE'
    // STATS_HISTORY: 'ANOTHER_SHEET_ID_IF_NEEDED'
  },

  /* ── 工作表（tab）名稱 ──
     對應每個 API 端點讀取的工作表 */
  TABS: {
    ROSTER:         '名單出席',       // ?type=roster
    SCHEDULE_META:  '賽程資訊',       // ?type=schedule（週次元資料）
    SCHEDULE_GAMES: '比賽明細',       // ?type=schedule（比賽詳情）
    STANDINGS:      '戰績',           // ?type=standings
    STANDINGS_H2H:  '對戰矩陣',       // ?type=standings（兩兩對戰）
    STATS:          '數據統計',       // ?type=stats（當季）
    DRAGON:         '龍虎榜',         // ?type=dragon
    ROTATION:       '輪值排班',       // ?type=rotation
    ROTATION_CUM:   '累計輪值',       // ?type=rotation（累計排名）
    HOF_AVG:        '名人堂場均',     // ?type=hof
    HOF_TOTAL:      '名人堂累計',     // ?type=hof
    HOF_IRON:       '名人堂鐵人',     // ?type=hof
    HOME_CONFIG:    '首頁設定'        // ?type=home（賽季/週次等設定）
  },

  /* ── 賽季設定 ── */
  CURRENT_SEASON: 25,
  CURRENT_WEEK: 3,
  PHASE: '例行賽',

  /* ── 隊伍名稱 → ID 對照 ── */
  TEAM_ID_MAP: {
    '紅隊': 'red',    '紅': 'red',
    '黑隊': 'black',  '黑': 'black',
    '藍隊': 'blue',   '藍': 'blue',
    '綠隊': 'green',  '綠': 'green',
    '黃隊': 'yellow', '黃': 'yellow',
    '白隊': 'white',  '白': 'white'
  }
};


/* ══════════════════════════════════════
   主路由 — doGet
   ══════════════════════════════════════ */

function doGet(e) {
  var type = (e && e.parameter && e.parameter.type) || '';
  var data;

  try {
    switch (type) {
      case 'roster':    data = handleRoster();    break;
      case 'schedule':  data = handleSchedule();  break;
      case 'standings': data = handleStandings(); break;
      case 'stats':     data = handleStats(e);    break;
      case 'dragon':    data = handleDragon();    break;
      case 'rotation':  data = handleRotation();  break;
      case 'hof':       data = handleHof();       break;
      case 'home':      data = handleHome();      break;
      default:
        data = {
          error: '未知的 API 類型',
          validTypes: ['roster','schedule','standings','stats','dragon','rotation','hof','home']
        };
    }
  } catch (err) {
    data = { error: err.message, stack: err.stack };
  }

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ══════════════════════════════════════
   通用工具函式
   ══════════════════════════════════════ */

/**
 * 開啟指定 Sheets 的工作表
 * @param {string} tabName - 工作表名稱
 * @param {string} [sheetKey='MAIN'] - CONFIG.SHEETS 中的 key
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(tabName, sheetKey) {
  sheetKey = sheetKey || 'MAIN';
  var ss = SpreadsheetApp.openById(CONFIG.SHEETS[sheetKey]);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error('找不到工作表: ' + tabName);
  return sheet;
}

/**
 * 讀取整張工作表（含標題列）→ 二維陣列
 * @param {string} tabName
 * @param {string} [sheetKey]
 * @returns {any[][]}
 */
function readAll(tabName, sheetKey) {
  var sheet = getSheet(tabName, sheetKey);
  return sheet.getDataRange().getValues();
}

/**
 * 讀取工作表並轉為物件陣列（第一列為 header）
 * @param {string} tabName
 * @param {string} [sheetKey]
 * @returns {Object[]}
 */
function readAsObjects(tabName, sheetKey) {
  var rows = readAll(tabName, sheetKey);
  if (rows.length < 2) return [];
  var headers = rows[0].map(function(h) { return String(h).trim(); });
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    if (isEmptyRow(rows[i])) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    result.push(obj);
  }
  return result;
}

/** 判斷是否為空列 */
function isEmptyRow(row) {
  for (var i = 0; i < row.length; i++) {
    if (row[i] !== '' && row[i] !== null && row[i] !== undefined) return false;
  }
  return true;
}

/** 安全轉數字，空值回傳 null */
function toNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  var n = Number(v);
  return isNaN(n) ? null : n;
}

/** 安全轉字串，空值回傳 null */
function toStr(v) {
  if (v === '' || v === null || v === undefined) return null;
  return String(v).trim();
}

/** 百分比格式化 */
function toPct(v) {
  if (v === '' || v === null || v === undefined) return null;
  var n = Number(v);
  if (isNaN(n)) return String(v).trim();
  // 如果已經是百分比格式（如 66.7），直接加 %
  if (n > 1) return n.toFixed(1) + '%';
  // 如果是小數（如 0.667），乘 100
  return (n * 100).toFixed(1) + '%';
}

/** 取隊伍 ID */
function getTeamId(teamName) {
  return CONFIG.TEAM_ID_MAP[String(teamName).trim()] || String(teamName).trim().toLowerCase();
}


/* ══════════════════════════════════════
   API 1: handleRoster — 球員名單與出席
   ══════════════════════════════════════

   預期工作表格式（tab: 名單出席）：
   ┌──────────┬──────┬────────┬──────────┬──────────┬───┐
   │ 球員姓名 │ 隊伍 │ 隊伍ID │ 第1週1/10│ 第2週1/17│...│
   ├──────────┼──────┼────────┼──────────┼──────────┼───┤
   │ 韋承志   │ 紅隊 │ red    │ 1        │ 1        │...│
   │ 吳軒宇   │ 紅隊 │ red    │ 1        │ 0        │...│
   └──────────┴──────┴────────┴──────────┴──────────┴───┘
   出席值：1=出席, 0=缺席, x=無故缺席, ?=尚未舉行
*/

function handleRoster() {
  var rows = readAll(CONFIG.TABS.ROSTER);
  var headers = rows[0];

  // 前 3 欄為固定欄位，第 4 欄起為各週
  var weekHeaders = [];
  for (var c = 3; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    if (!h) break;
    // 解析「第N週 M/D」格式
    var match = h.match(/第(\d+)週\s*([\d\/]+)?/);
    weekHeaders.push({
      wk: match ? parseInt(match[1]) : (c - 2),
      label: match ? '第' + match[1] + '週' : h,
      date: match && match[2] ? match[2] : ''
    });
  }

  // 按隊伍分組球員
  var teamMap = {};
  var teamOrder = [];
  for (var i = 1; i < rows.length; i++) {
    if (isEmptyRow(rows[i])) continue;
    var name = String(rows[i][0]).trim();
    var teamName = String(rows[i][1]).trim();
    var teamId = String(rows[i][2]).trim() || getTeamId(teamName);

    if (!teamMap[teamId]) {
      teamMap[teamId] = { id: teamId, name: teamName, players: [] };
      teamOrder.push(teamId);
    }

    var att = [];
    for (var c = 3; c < 3 + weekHeaders.length; c++) {
      var v = rows[i][c];
      if (v === '' || v === undefined || v === null) {
        att.push('?');
      } else {
        var sv = String(v).trim().toLowerCase();
        if (sv === '1' || sv === 'true') att.push(1);
        else if (sv === '0' || sv === 'false') att.push(0);
        else att.push(sv); // 'x', '?', etc.
      }
    }

    teamMap[teamId].players.push({ name: name, att: att });
  }

  var teams = teamOrder.map(function(id) { return teamMap[id]; });

  return {
    weeks: weekHeaders,
    teams: teams
  };
}


/* ══════════════════════════════════════
   API 2: handleSchedule — 賽程
   ══════════════════════════════════════

   預期工作表格式 A（tab: 賽程資訊）：
   ┌──────┬──────┬──────┬──────────────┬──────┬──────────┐
   │ 週次 │ 賽季 │ 階段 │ 日期         │ 時間 │ 場地     │
   ├──────┼──────┼──────┼──────────────┼──────┼──────────┤
   │ 3    │ 25   │例行賽│2026/2/14（六）│07:30 │三重體育館│
   └──────┴──────┴──────┴──────────────┴──────┴──────────┘

   預期工作表格式 B（tab: 比賽明細）：
   ┌──────┬──────┬──────┬──────┬──────┬────────┬────────┬────────┬──────────────┐
   │ 週次 │ 場次 │ 時間 │ 主隊 │ 客隊 │ 主隊分 │ 客隊分 │ 狀態   │ 工作人員     │
   ├──────┼──────┼──────┼──────┼──────┼────────┼────────┼────────┼──────────────┤
   │ 3    │ 1    │07:30 │ 黃   │ 綠   │ 22     │ 34     │finished│裁判:李昊明...│
   └──────┴──────┴──────┴──────┴──────┴────────┴────────┴────────┴──────────────┘
   工作人員欄格式：「裁判:A,B,C|場務:D,E|攝影:F|器材:G|數據:H|場控:I」
*/

function handleSchedule() {
  // 讀取賽程元資料
  var metaRows = readAsObjects(CONFIG.TABS.SCHEDULE_META);
  // 讀取比賽明細
  var gameRows = readAsObjects(CONFIG.TABS.SCHEDULE_GAMES);

  var season = CONFIG.CURRENT_SEASON;
  var phase = CONFIG.PHASE;
  var currentWeek = CONFIG.CURRENT_WEEK;
  var totalWeeks = 10;

  // 從 meta 取得更精確的設定
  if (metaRows.length > 0) {
    var firstMeta = metaRows[0];
    if (firstMeta['賽季']) season = toNum(firstMeta['賽季']) || season;
    if (firstMeta['階段']) phase = toStr(firstMeta['階段']) || phase;
    if (firstMeta['總週數']) totalWeeks = toNum(firstMeta['總週數']) || totalWeeks;
  }

  // 依週次組織資料
  var weeks = {};

  // 建立每週元資料
  metaRows.forEach(function(row) {
    var wk = String(toNum(row['週次']) || row['週次']);
    weeks[wk] = {
      date: toStr(row['日期']) || '',
      time: toStr(row['時間']) || '',
      venue: toStr(row['場地']) || '',
      matchups: [],
      games: []
    };
    if (toNum(row['當前週'])) currentWeek = toNum(row['當前週']);
  });

  // 填入比賽明細
  gameRows.forEach(function(row) {
    var wk = String(toNum(row['週次']) || row['週次']);
    if (!weeks[wk]) {
      weeks[wk] = { date: '', time: '', venue: '', matchups: [], games: [] };
    }

    var home = toStr(row['主隊']) || '';
    var away = toStr(row['客隊']) || '';
    var homeScore = toNum(row['主隊分']);
    var awayScore = toNum(row['客隊分']);
    var status = toStr(row['狀態']) || 'upcoming';
    var num = toNum(row['場次']) || (weeks[wk].games.length + 1);
    var time = toStr(row['時間']) || '';

    // 解析工作人員
    var staff = {};
    var staffStr = toStr(row['工作人員']);
    if (staffStr) {
      staffStr.split('|').forEach(function(part) {
        var colonIdx = part.indexOf(':');
        if (colonIdx > -1) {
          var role = part.substring(0, colonIdx).trim();
          var people = part.substring(colonIdx + 1).split(',').map(function(s) {
            return s.trim();
          }).filter(Boolean);
          staff[role] = people;
        }
      });
    }

    weeks[wk].games.push({
      num: num,
      time: time,
      home: home,
      away: away,
      homeScore: homeScore,
      awayScore: awayScore,
      status: status,
      staff: staff
    });

    // 自動產生 matchups（唯一配對）
    var comboKey = [home, away].sort().join('-');
    var existing = weeks[wk].matchups.some(function(m) {
      return [m.home, m.away].sort().join('-') === comboKey;
    });
    if (!existing) {
      weeks[wk].matchups.push({
        combo: weeks[wk].matchups.length + 1,
        home: home,
        away: away
      });
    }
  });

  return {
    season: season,
    phase: phase,
    currentWeek: currentWeek,
    totalWeeks: totalWeeks,
    weeks: weeks
  };
}


/* ══════════════════════════════════════
   API 3: handleStandings — 戰績榜
   ══════════════════════════════════════

   預期工作表格式（tab: 戰績）：
   ┌──────┬──────────┬──────┬────┬────┬──────┬──────┬──────┬───┬────────┬────────────┐
   │ 排名 │ 隊伍名稱 │ 簡稱 │ 勝 │ 敗 │ 勝率 │ 第1週│ 第2週│...│ 連勝/敗│ 連勝類型   │
   ├──────┼──────────┼──────┼────┼────┼──────┼──────┼──────┼───┼────────┼────────────┤
   │ 1    │ 綠隊     │ 綠   │ 4  │ 2  │66.7% │ L    │ W   │...│ 2連勝  │ win        │
   └──────┴──────────┴──────┴────┴────┴──────┴──────┴──────┴───┴────────┴────────────┘

   預期對戰矩陣（tab: 對戰矩陣）：
   ┌──────┬────┬────┬────┬────┬────┬────┐
   │      │ 紅 │ 黑 │ 藍 │ 綠 │ 黃 │ 白 │
   ├──────┼────┼────┼────┼────┼────┼────┤
   │ 紅   │    │ 1  │ 1  │ -1 │ 1  │ -1 │
   │ 黑   │ -1 │    │ 1  │ -1 │ 1  │ 1  │
   └──────┴────┴────┴────┴────┴────┴────┘
   值：1=勝, -1=敗, 空=未交手
*/

function handleStandings() {
  var rows = readAll(CONFIG.TABS.STANDINGS);
  var headers = rows[0];

  // 找出歷史欄位（W/L 欄位）的起始和結束位置
  var fixedCols = ['排名','隊伍名稱','簡稱','勝','敗','勝率'];
  var historyStart = -1;
  var streakCol = -1;
  var streakTypeCol = -1;

  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    if (h.match(/第\d+週/) && historyStart === -1) historyStart = c;
    if (h === '連勝/敗' || h === '連勝敗' || h === '連勝連敗') streakCol = c;
    if (h === '連勝類型' || h === 'streakType') streakTypeCol = c;
  }

  var teams = [];
  for (var i = 1; i < rows.length; i++) {
    if (isEmptyRow(rows[i])) continue;

    var rank = toNum(rows[i][0]) || i;
    var name = toStr(rows[i][1]) || '';
    var team = toStr(rows[i][2]) || '';
    var wins = toNum(rows[i][3]) || 0;
    var losses = toNum(rows[i][4]) || 0;
    var pct = toPct(rows[i][5]) || '0.0%';

    // 收集歷史 W/L
    var history = [];
    if (historyStart > -1) {
      for (var c = historyStart; c < (streakCol > -1 ? streakCol : headers.length); c++) {
        var v = toStr(rows[i][c]);
        if (v === 'W' || v === 'L') history.push(v);
        else if (v) history.push(v);
      }
    }

    var streak = streakCol > -1 ? toStr(rows[i][streakCol]) : '';
    var streakType = streakTypeCol > -1 ? toStr(rows[i][streakTypeCol]) : '';

    // 自動推算 streakType
    if (!streakType && streak) {
      streakType = streak.indexOf('勝') > -1 ? 'win' : 'lose';
    }

    teams.push({
      rank: rank,
      name: name,
      team: team,
      wins: wins,
      losses: losses,
      pct: pct,
      record: wins + '勝 ' + losses + '敗',
      history: history,
      streak: streak || '',
      streakType: streakType || ''
    });
  }

  // 讀取對戰矩陣
  var matrix = { teams: [], results: [] };
  try {
    var matrixRows = readAll(CONFIG.TABS.STANDINGS_H2H);
    if (matrixRows.length > 1) {
      // 第一列從第 2 欄起為隊伍名
      for (var c = 1; c < matrixRows[0].length; c++) {
        var t = toStr(matrixRows[0][c]);
        if (t) matrix.teams.push(t);
      }
      // 每列為一隊的對戰結果
      for (var i = 1; i < matrixRows.length; i++) {
        if (isEmptyRow(matrixRows[i])) continue;
        var row = [];
        for (var c = 1; c <= matrix.teams.length; c++) {
          var v = toNum(matrixRows[i][c]);
          row.push(v); // 1, -1, or null
        }
        matrix.results.push(row);
      }
    }
  } catch (e) {
    // 對戰矩陣為可選
  }

  return {
    season: CONFIG.CURRENT_SEASON,
    phase: CONFIG.PHASE,
    currentWeek: CONFIG.CURRENT_WEEK,
    teams: teams,
    matrix: matrix
  };
}


/* ══════════════════════════════════════
   API 4: handleStats — 數據統計
   ══════════════════════════════════════

   預期工作表格式（tab: 數據統計）：
   第一列標記各區塊（scoring / rebound / assist / steal / block / eff）
   或用多個工作表分別存放。

   簡易方式：一張表，依區塊垂直排列：
   ┌──────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────────┐
   │ [scoring]│      │      │      │      │      │      │          │
   │ 球員     │ 隊伍 │ 場均 │ 2P%  │ 3P%  │ FT%  │      │          │
   │ 黃偉訓   │ 綠   │ 9.55 │55.6% │20.0% │57.5% │      │          │
   │ ...      │      │      │      │      │      │      │          │
   │ [rebound]│      │      │      │      │      │      │          │
   │ 球員     │ 隊伍 │ 場均 │ 進攻 │ 防守 │      │      │          │
   │ ...      │      │      │      │      │      │      │          │
   └──────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────────┘

   更推薦的方式：每季一張 tab（如「S25數據」「S24數據」），
   或在同一 tab 的不同區段用空列分隔。
   下方實作支援兩種方式，請依實際 Sheets 結構選用。
*/

function handleStats(e) {
  var result = {};

  // 讀取主要數據 tab
  var rows = readAll(CONFIG.TABS.STATS);

  // 解析方式：假設以 [section] 標記分隔
  var currentSection = '';
  var currentSeason = String(CONFIG.CURRENT_SEASON);
  var sectionData = {};

  for (var i = 0; i < rows.length; i++) {
    var firstCell = String(rows[i][0]).trim();

    // 偵測賽季標記，如 [S25] 或 [第25屆]
    var seasonMatch = firstCell.match(/\[S(\d+)\]|\[第(\d+)屆\]/);
    if (seasonMatch) {
      currentSeason = seasonMatch[1] || seasonMatch[2];
      if (!result[currentSeason]) {
        result[currentSeason] = {
          label: '第 ' + currentSeason + ' 屆',
          scoring: [], rebound: [], assist: [],
          steal: [], block: [], eff: []
        };
      }
      continue;
    }

    // 偵測區塊標記
    var sectionMatch = firstCell.match(/\[(scoring|rebound|assist|steal|block|eff)\]/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toLowerCase();
      // 下一列可能是 header，跳過
      i++; // skip header row
      continue;
    }

    // 跳過空列
    if (isEmptyRow(rows[i])) continue;

    // 確保 result 物件存在
    if (!result[currentSeason]) {
      result[currentSeason] = {
        label: '第 ' + currentSeason + ' 屆',
        scoring: [], rebound: [], assist: [],
        steal: [], block: [], eff: []
      };
    }

    // 解析資料列
    if (currentSection && result[currentSeason][currentSection] !== undefined) {
      var name = toStr(rows[i][0]);
      var team = toStr(rows[i][1]);
      var val = toNum(rows[i][2]);

      if (!name) continue;

      var entry = { name: name, team: team, val: val };

      // scoring 額外欄位：2P%, 3P%, FT%
      if (currentSection === 'scoring') {
        entry.p2 = toStr(rows[i][3]) || '';
        entry.p3 = toStr(rows[i][4]) || '';
        entry.ft = toStr(rows[i][5]) || '';
      }

      // rebound 額外欄位：進攻籃板、防守籃板
      if (currentSection === 'rebound') {
        entry.off = toNum(rows[i][3]) || 0;
        entry.def = toNum(rows[i][4]) || 0;
      }

      result[currentSeason][currentSection].push(entry);
    }
  }

  // 為當季設定 label
  if (result[String(CONFIG.CURRENT_SEASON)]) {
    result[String(CONFIG.CURRENT_SEASON)].label =
      '第 ' + CONFIG.CURRENT_SEASON + ' 屆 · 本季個人排行榜';
  }

  return result;
}


/* ══════════════════════════════════════
   API 5: handleDragon — 積分龍虎榜
   ══════════════════════════════════════

   預期工作表格式（tab: 龍虎榜）：
   ┌──────┬──────────┬──────┬──────┬──────┬──────┬──────┬────────┬──────┐
   │ 排名 │ 球員姓名 │ 隊伍 │ 標籤 │ 出席 │ 輪值 │ 拖地 │ 季後賽 │ 總計 │
   ├──────┼──────────┼──────┼──────┼──────┼──────┼──────┼────────┼──────┤
   │ 1    │ 韋承志   │ 紅   │ 裁   │ 8    │ 8    │ 0    │        │ 16   │
   └──────┴──────────┴──────┴──────┴──────┴──────┴──────┴────────┴──────┘
   標籤：裁=裁判, 空白=一般球員
   季後賽：例行賽期間為空（回傳 null）
*/

function handleDragon() {
  var rows = readAsObjects(CONFIG.TABS.DRAGON);

  var players = rows.map(function(row, idx) {
    return {
      rank: toNum(row['排名']) || (idx + 1),
      name: toStr(row['球員姓名']) || toStr(row['姓名']) || '',
      team: toStr(row['隊伍']) || '',
      tag: toStr(row['標籤']) || null,
      att: toNum(row['出席']) || 0,
      duty: toNum(row['輪值']) || 0,
      mop: toNum(row['拖地']) || 0,
      playoff: toNum(row['季後賽']),  // null if empty
      total: toNum(row['總計']) || toNum(row['總積分']) || 0
    };
  });

  // 找平民門檻：看是否有設定列，或用預設 36
  var civilianThreshold = 36;
  // 嘗試在第一列之前或額外欄位找「平民門檻」
  try {
    var raw = readAll(CONFIG.TABS.DRAGON);
    // 檢查是否有 "平民門檻" 這個 header
    var headers = raw[0];
    for (var c = 0; c < headers.length; c++) {
      if (String(headers[c]).trim() === '平民門檻') {
        civilianThreshold = toNum(raw[1][c]) || 36;
        break;
      }
    }
  } catch (e) {}

  return {
    season: CONFIG.CURRENT_SEASON,
    phase: CONFIG.PHASE === '例行賽' ? '賽季進行中' : CONFIG.PHASE,
    civilianThreshold: civilianThreshold,
    columns: ['出席', '輪值', '拖地', '季後賽'],
    players: players,
    rulesLink: ''
  };
}


/* ══════════════════════════════════════
   API 6: handleRotation — 輪值排班
   ══════════════════════════════════════

   預期工作表格式（tab: 輪值排班）：
   第一區塊 — 出缺席：
   ┌──────────┬────┐
   │ 出席人數 │ 36 │
   │ 缺席人數 │ 8  │
   │ 缺席名單 │ 周昱丞(紅), 蔡一聲(紅), ... │
   └──────────┴────┘

   第二區塊 — 各角色分配：
   ┌──────┬──────┬──────────┬──────┬──────┬────────┐
   │ 角色 │ icon │ 姓名     │ 隊伍 │ 累計 │ bonus  │
   ├──────┼──────┼──────────┼──────┼──────┼────────┤
   │ 裁判 │ ⚖️   │ 李昊明   │ 黑   │ 8    │        │
   │ 裁判 │      │ 李政軒   │ 黑   │ 8    │        │
   │ 數據 │ 📊   │ 韋承志   │ 紅   │ 8    │+1積分  │
   └──────┴──────┴──────────┴──────┴──────┴────────┘

   預期累計輪值（tab: 累計輪值）：
   ┌──────┬──────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
   │ 排名 │ 姓名     │ 隊伍 │ 裁判 │ 場務 │ 攝影 │ 器材 │ 數據 │ 總計 │
   └──────┴──────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
*/

function handleRotation() {
  var rows = readAll(CONFIG.TABS.ROTATION);

  // 解析出缺席資訊（前幾列為 key-value）
  var present = 0, absent = 0;
  var absentees = [];
  var assignmentStart = -1;

  for (var i = 0; i < rows.length; i++) {
    var key = String(rows[i][0]).trim();

    if (key === '出席人數' || key === '出席') {
      present = toNum(rows[i][1]) || 0;
    } else if (key === '缺席人數' || key === '缺席') {
      absent = toNum(rows[i][1]) || 0;
    } else if (key === '缺席名單') {
      var absStr = String(rows[i][1]).trim();
      if (absStr) {
        absentees = absStr.split(/[,，]/).map(function(s) {
          return s.trim();
        }).filter(Boolean);
      }
    } else if (key === '角色' || key === 'role') {
      assignmentStart = i;
      break;
    }
  }

  // 解析角色分配
  var assignments = [];
  var roleMap = {};
  var roleOrder = [];
  var roleIcons = { '裁判': '⚖️', '場務': '🏃', '攝影': '📷', '器材': '🎒', '數據': '📊' };

  if (assignmentStart > -1) {
    for (var i = assignmentStart + 1; i < rows.length; i++) {
      if (isEmptyRow(rows[i])) continue;

      var role = toStr(rows[i][0]);
      var icon = toStr(rows[i][1]);
      var staffName = toStr(rows[i][2]);
      var staffTeam = toStr(rows[i][3]);
      var count = toNum(rows[i][4]) || 0;
      var bonus = toStr(rows[i][5]);

      if (!staffName) continue;

      if (!roleMap[role]) {
        roleMap[role] = {
          role: role,
          icon: icon || roleIcons[role] || '',
          staff: []
        };
        if (bonus) roleMap[role].bonus = bonus;
        roleOrder.push(role);
      }
      // 如果這列有 bonus 且之前沒設
      if (bonus && !roleMap[role].bonus) {
        roleMap[role].bonus = bonus;
      }

      roleMap[role].staff.push({
        name: staffName,
        team: staffTeam,
        count: count
      });
    }
  }

  assignments = roleOrder.map(function(r) { return roleMap[r]; });

  // 讀取累計輪值排名
  var cumulativeRanking = [];
  try {
    var cumRows = readAsObjects(CONFIG.TABS.ROTATION_CUM);
    cumulativeRanking = cumRows.map(function(row, idx) {
      return {
        rank: toNum(row['排名']) || (idx + 1),
        name: toStr(row['姓名']) || '',
        team: toStr(row['隊伍']) || '',
        referee: toNum(row['裁判']) || 0,
        court: toNum(row['場務']) || 0,
        photo: toNum(row['攝影']) || 0,
        equip: toNum(row['器材']) || 0,
        data: toNum(row['數據']) || 0,
        total: toNum(row['總計']) || 0
      };
    });
  } catch (e) {
    // 累計輪值為可選
  }

  return {
    season: CONFIG.CURRENT_SEASON,
    currentWeek: CONFIG.CURRENT_WEEK,
    attendance: { present: present, absent: absent },
    absentees: absentees,
    assignments: assignments,
    cumulativeRanking: cumulativeRanking
  };
}


/* ══════════════════════════════════════
   API 7: handleHof — 名人堂
   ══════════════════════════════════════

   預期工作表格式 A（tab: 名人堂場均）：
   ┌──────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
   │ 球員     │ 隊伍 │ PPG  │ RPG  │ APG  │ BPG  │ SPG  │ EFF  │
   ├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
   │ 黃偉訓   │ 綠   │ 9.55 │ 3.1  │ 0.6  │ 0.13 │ 0.85 │ 7.75 │
   └──────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

   預期工作表格式 B（tab: 名人堂累計）：
   ┌──────────┬────────┬────────┬────────┬────────┐
   │ 球員     │ 總得分 │ 總籃板 │ 總助攻 │ 總出賽 │
   └──────────┴────────┴────────┴────────┴────────┘

   預期工作表格式 C（tab: 名人堂鐵人）：
   ┌──────────┬──────────┬──────┬──────┬──────┐
   │ 球員     │ 三鐵霸主 │ 2P鐵 │ 3P鐵 │ FT鐵 │
   └──────────┴──────────┴──────┴──────┴──────┘
*/

function handleHof() {
  // 場均數據
  var avgRows = readAsObjects(CONFIG.TABS.HOF_AVG);
  var avgPlayers = avgRows.map(function(row) {
    return {
      name: toStr(row['球員']) || toStr(row['姓名']) || '',
      team: toStr(row['隊伍']) || '',
      ppg: toNum(row['PPG']) || 0,
      rpg: toNum(row['RPG']) || 0,
      apg: toNum(row['APG']) || 0,
      bpg: toNum(row['BPG']) || 0,
      spg: toNum(row['SPG']) || 0,
      eff: toNum(row['EFF']) || 0
    };
  });

  // 製作 podium（前 3 名，以 PPG 排序）
  var sorted = avgPlayers.slice().sort(function(a, b) { return b.ppg - a.ppg; });
  var top3 = sorted.slice(0, 3).map(function(p) {
    return { name: p.name, team: p.team, val: p.ppg };
  });

  // 生涯累計
  var totalRows = readAsObjects(CONFIG.TABS.HOF_TOTAL);
  var totalPlayers = totalRows.map(function(row) {
    return {
      name: toStr(row['球員']) || toStr(row['姓名']) || '',
      pts: toNum(row['總得分']) || 0,
      reb: toNum(row['總籃板']) || 0,
      ast: toNum(row['總助攻']) || 0,
      games: toNum(row['總出賽']) || 0
    };
  });

  // 鐵人榜
  var ironRows = readAsObjects(CONFIG.TABS.HOF_IRON);
  var ironPlayers = ironRows.map(function(row) {
    return {
      name: toStr(row['球員']) || toStr(row['姓名']) || '',
      total: toNum(row['三鐵霸主']) || toNum(row['總計']) || 0,
      p2: toNum(row['2P鐵']) || 0,
      p3: toNum(row['3P鐵']) || 0,
      ft: toNum(row['FT鐵']) || 0
    };
  });

  return {
    description: '聯盟歷史 · 第11–19屆、第24屆',
    tabs: ['場均數據', '生涯累計', '鐵人榜', '奪冠榜'],
    avgStats: {
      podium: {
        label: '場均得分 TOP 3',
        unit: 'PPG',
        top3: top3
      },
      columns: ['#', '球員', 'PPG', 'RPG', 'APG', 'BPG', 'SPG', 'EFF'],
      players: avgPlayers
    },
    totalStats: {
      columns: ['#', '球員', '總得分', '總籃板', '總助攻', '總出賽'],
      players: totalPlayers
    },
    ironStats: {
      columns: ['#', '球員', '三鐵霸主', '2P鐵', '3P鐵', 'FT鐵'],
      players: ironPlayers
    },
    champStats: {
      status: 'preparing',
      message: '奪冠榜資料整合中'
    }
  };
}


/* ══════════════════════════════════════
   API 8: handleHome — 首頁摘要（聚合）
   ══════════════════════════════════════
   從其他 API 取用資料並組合。
*/

function handleHome() {
  // 取得戰績資料
  var standingsData = handleStandings();

  // 首頁戰績 — 加上 record 欄位
  var homeStandings = standingsData.teams.map(function(t) {
    return {
      rank: t.rank,
      name: t.name,
      team: t.team,
      record: t.record || (t.wins + '勝 ' + t.losses + '敗'),
      pct: t.pct,
      history: t.history,
      streak: t.streak,
      streakType: t.streakType
    };
  });

  // 取得龍虎榜 Top 10
  var dragonData = handleDragon();
  var dragonTop10 = dragonData.players.slice(0, 10).map(function(p) {
    return {
      rank: p.rank,
      name: p.name,
      team: p.team,
      att: p.att,
      duty: p.duty,
      total: p.total
    };
  });

  // 取得當季數據（取前 4 名）
  var statsData = handleStats({});
  var currentStats = statsData[String(CONFIG.CURRENT_SEASON)] || {};

  var miniStats = {};
  var statMap = {
    pts:  { key: 'scoring', label: '得分', unit: 'PPG' },
    reb:  { key: 'rebound', label: '籃板', unit: 'RPG' },
    ast:  { key: 'assist',  label: '助攻', unit: 'APG' },
    stl:  { key: 'steal',   label: '抄截', unit: 'SPG' },
    blk:  { key: 'block',   label: '阻攻', unit: 'BPG' }
  };

  Object.keys(statMap).forEach(function(k) {
    var conf = statMap[k];
    var arr = currentStats[conf.key] || [];
    miniStats[k] = {
      label: conf.label,
      unit: conf.unit,
      players: arr.slice(0, 4).map(function(p, idx) {
        return { rank: idx + 1, name: p.name, team: p.team, val: p.val };
      })
    };
  });

  // 取得當週賽程資訊
  var schedData = handleSchedule();
  var currentWeekData = schedData.weeks[String(CONFIG.CURRENT_WEEK)] || {};
  var scheduleInfo = {
    date: currentWeekData.date
      ? currentWeekData.date + ' ' + (currentWeekData.time || '')
      : '',
    venue: currentWeekData.venue || ''
  };

  return {
    season: CONFIG.CURRENT_SEASON,
    currentWeek: CONFIG.CURRENT_WEEK,
    phase: CONFIG.PHASE,
    scheduleInfo: scheduleInfo,
    standings: homeStandings,
    dragonTop10: dragonTop10,
    miniStats: miniStats
  };
}


/* ══════════════════════════════════════
   測試用函式（可在 GAS 編輯器中直接執行）
   ══════════════════════════════════════ */

/** 測試 doGet 模擬 */
function testDoGet() {
  var types = ['roster', 'schedule', 'standings', 'stats', 'dragon', 'rotation', 'hof', 'home'];
  types.forEach(function(t) {
    Logger.log('=== Testing: ' + t + ' ===');
    try {
      var result = doGet({ parameter: { type: t } });
      Logger.log(result.getContent().substring(0, 500) + '...');
    } catch (err) {
      Logger.log('ERROR: ' + err.message);
    }
  });
}

/** 測試單一 API */
function testSingle() {
  var type = 'roster'; // 改這裡測試不同 API
  var result = doGet({ parameter: { type: type } });
  Logger.log(result.getContent());
}
