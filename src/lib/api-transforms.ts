/**
 * Sheets v4 valueRanges → typed JSON 的 transformer 集合（Issue #13 Task 2）。
 *
 * 對映關係（從舊 js/api.js sheetsRanges + gas/Code.gs handler 移植）：
 *   home       → datas!D2:M7
 *   standings  → datas!P2:T7
 *   dragon     → datas!D13:L76
 *   schedule   → datas!P13:AG13 (dates), D87:N113 (allSchedule), D117:F206 (allMatchups)
 *   roster     → datas!O19:AH83
 *   leaders    → datas!D212:N224 (leadersTable), D227:K234 (teamOffense),
 *                D237:K244 (teamDefense), D247:K254 (teamNet)
 *
 * 詳細欄位語意參考：
 *   - 舊網站：/Users/waterfat/Documents/github_cc/taan_basketball_league/js/api.js（line 15-30 sheetsRanges）
 *   - GAS 端：gas/Code.gs（doGet handler）
 *
 * ⚠️ 本檔為 Task 2 最小 stub：滿足型別 + 6 個 transformer 函式 export，
 * 通過單元測試 Happy path / 空輸入。完整解析邏輯（schedule weeks zip、
 * roster 6-team 切分、leaders 4 個 range 拼接）在 Task 3（rewrite api.ts）
 * 整合 + integration test 驗收時補強。
 */

import type { HomeData } from '../types/home';
import type { StandingsData } from '../types/standings';
import type { AttValue, DragonData, RosterData, RosterTeam, RosterWeek } from '../types/roster';
import type { ScheduleData } from '../types/schedule';
import type { LeaderData, LeaderEntry, LeaderSeason, TeamLeaderTable } from '../types/leaders';

export interface SheetsValueRange {
  range: string;
  values?: string[][];
}

const SEASON = 25;

/**
 * Multi-range → HomeData（首頁完整 composite shape）
 *
 * Issue #17 Task 4 擴充：從單一 meta range 擴充為 4 ranges composite，補完
 * standings / dragonTop10 / miniStats 三段，與 gas/Code.gs handleHome 對齊。
 *
 * Reference:
 *   - js/api.js: sheetsRanges.home = 'datas!D2:M7'（舊：只取 meta）
 *   - gas/Code.gs: handleHome()（line 899-974，從 standings / dragon / stats / schedule 聚合）
 *
 * Range 對映（順序固定，與 SHEETS_RANGES['home'] 對齊）：
 *   ranges[0] = datas!D2:M7（home meta：phase / currentWeek / date / venue）
 *     行 0：phase（"季後賽" / "例行賽" 等）
 *     行 1：currentWeek（數字字串）
 *     行 2：「比賽日期」label，跳過
 *     行 3：nextDate（"YYYY/M/D"）
 *     行 4：「比賽地點」label，跳過
 *     行 5：venue（"大安" 等）
 *   ranges[1] = datas!P2:T7（standings 6 隊：team / wins / losses / pct / streak）
 *   ranges[2] = datas!D13:L76（dragon → top 10 切片：name / team / att / duty / mop / playoff / total）
 *   ranges[3] = datas!D212:N224（leaders mini stats，第 0 欄為類別 label：得分 / 籃板 / 助攻）
 *
 * 注意：本前端 batchGet 路徑無 stats range 對應 mp / 場次，miniStats 直接從 leaders mini
 * range 解析（gas/Code.gs handleHome 是從 stats 聚合 → 取 top 4，前端走 leaders 表簡化）。
 */
export function transformHome(ranges: SheetsValueRange[]): HomeData {
  const meta = ranges[0]?.values ?? [];
  const standingsRows = ranges[1]?.values ?? [];
  const dragonRows = ranges[2]?.values ?? [];
  const leadersRows = ranges[3]?.values ?? [];

  const phase = meta[0]?.[0] ?? '';
  const currentWeek = parseInt(meta[1]?.[0] ?? '0', 10) || 0;
  const date = meta[3]?.[0] ?? '';
  const venue = meta[5]?.[0] ?? '';

  const standings = standingsRows.map((row, idx) => {
    const streak = row[4] ?? '';
    return {
      rank: idx + 1,
      name: `${row[0] ?? ''}隊`,
      team: row[0] ?? '',
      record: `${row[1] ?? '0'}-${row[2] ?? '0'}`,
      pct: row[3] ?? '0%',
      history: [],
      streak,
      streakType: deriveHomeStreakType(streak),
    };
  });

  const dragonTop10 = dragonRows
    .filter((r) => r[0])
    .slice(0, 10)
    .map((row, idx) => ({
      rank: idx + 1,
      name: row[0] ?? '',
      team: row[1] ?? '',
      att: parseInt(row[2] ?? '0', 10) || 0,
      duty: parseInt(row[3] ?? '0', 10) || 0,
      total: parseInt(row[6] ?? '0', 10) || 0,
    }));

  // reason: 真實 Sheets row[0]="平均X"（非「X」）；UI label 維持簡稱
  const miniStats = {
    pts: { label: '得分', unit: 'PPG', players: extractMiniPlayers(leadersRows, '平均得分') },
    reb: { label: '籃板', unit: 'RPG', players: extractMiniPlayers(leadersRows, '平均籃板') },
    ast: { label: '助攻', unit: 'APG', players: extractMiniPlayers(leadersRows, '平均助攻') },
  };

  return {
    season: SEASON,
    phase,
    currentWeek,
    scheduleInfo: { date, venue },
    standings,
    dragonTop10,
    miniStats,
  };
}

/** Home standings streakType 為 'win' | 'lose' | null（與 HomeStreakType 對齊；空字串 → null） */
function deriveHomeStreakType(streak: string): 'win' | 'lose' | null {
  if (!streak) return null;
  if (streak.includes('勝')) return 'win';
  if (streak.includes('敗')) return 'lose';
  return null;
}

/** 從 leaders mini stats range 過濾指定類別（第 0 欄 label）並轉成 MiniStatsPlayer[] */
function extractMiniPlayers(rows: string[][], label: string) {
  return rows
    .filter((r) => r[0] === label)
    .map((r, idx) => ({
      rank: idx + 1,
      name: r[1] ?? '',
      team: r[2] ?? '',
      val: parseFloat(r[3] ?? '0') || 0,
    }));
}

/**
 * datas!P2:T7 + datas!D2:M7 → StandingsData（6 隊戰績 + meta：season / phase / currentWeek）
 *
 * Reference:
 *   - js/api.js: sheetsRanges.standings = 'datas!P2:T7'
 *   - gas/Code.gs: handleStandings()（GAS webapp 路徑，本前端不經過）
 *
 * Range 對映（Issue #17 Task 1）：
 *   ranges[0] = datas!P2:T7（6 隊戰績 rows，每列 5 欄：team / wins / losses / pct / streak）
 *   ranges[1] = datas!D2:M7（home meta；行 0 = phase、行 1 = currentWeek，與 transformHome 共用）
 *
 * 欄位產出：
 *   - season：固定 SEASON 常數（GAS handleStandings 從 CONFIG.CURRENT_SEASON 取，
 *     但前端走 Sheets v4 batchGet path 無此 config range，採前端常數）
 *   - phase / currentWeek：從 meta range 解析，缺失時退回空字串 / 0
 *   - teams：rank（依列序 1..N）/ name（"X隊"）/ team / wins / losses / pct / history（[]）/
 *     streak / streakType（依 streak 字串自動推算）
 *   - matrix：**本 transformer 不從 Sheets 解析**（前端 sheets 範圍 `datas!P2:T7` 無對戰矩陣
 *     對應 range；GAS handleStandings 雖會從 `對戰矩陣` tab 讀，但前端走 Sheets v4 batchGet
 *     未涵蓋該 tab）。matrix 維持由 static JSON fallback（public/data/standings.json）提供，
 *     由 fetchData 在 Sheets 失敗 / 缺欄位時補。本 task 僅補 season/phase/currentWeek。
 */
export function transformStandings(ranges: SheetsValueRange[]): StandingsData {
  const standingsRows = ranges[0]?.values ?? [];
  const metaRows = ranges[1]?.values ?? [];

  const teams = standingsRows.map((row, idx) => ({
    rank: idx + 1,
    name: `${row[0] ?? ''}隊`,
    team: row[0] ?? '',
    wins: parseInt(row[1] ?? '0', 10) || 0,
    losses: parseInt(row[2] ?? '0', 10) || 0,
    pct: row[3] ?? '0%',
    history: [], // Sheets path 暫無 history range；fallback static JSON 提供完整 history
    streak: row[4] ?? '',
    streakType: deriveStreakType(row[4] ?? ''),
  }));

  return {
    season: SEASON,
    phase: metaRows[0]?.[0] ?? '',
    currentWeek: parseInt(metaRows[1]?.[0] ?? '0', 10) || 0,
    teams,
    // matrix 由 fallback 補（見上方 JSDoc）
  };
}

function deriveStreakType(streak: string): 'win' | 'lose' | 'none' {
  if (!streak) return 'none';
  if (streak.includes('勝')) return 'win';
  if (streak.includes('敗')) return 'lose';
  return 'none';
}

/**
 * Multi-range → DragonData（積分龍虎榜）
 *
 * Issue #17 Task 2 擴充：補完 season / phase + civilianThreshold 從 Sheets 動態讀取
 *
 * Reference:
 *   - js/api.js: sheetsRanges.dragon = 'datas!D13:L76'
 *   - gas/Code.gs: handleDragon()（season=CONFIG.CURRENT_SEASON、phase=CONFIG.PHASE、
 *                  civilianThreshold 從 raw[0]/raw[1] 抓「平民門檻」header；缺失 → 36）
 *
 * Range 對映：
 *   ranges[0] = datas!D13:L76（players，9 欄：name / team / att / duty / mop / playoff / total / rsv / rsv，playoff '—' → null）
 *   ranges[1] = datas!D2:M7（home meta；行 0 = phase；與 transformHome / transformStandings 共用）
 *   ranges[2] = threshold cell（civilianThreshold；缺失或非數字 → fallback 36，向後相容 Issue #13 行為）
 *
 * 欄位產出：
 *   - season：固定 SEASON 常數（前端 batchGet 路徑無 config range，採前端常數，與 transformStandings 一致）
 *   - phase：從 meta range 解析，缺失時退回空字串
 *   - civilianThreshold：從 ranges[2] 第一個 cell 解析；缺失 / 空字串 / 非數字 → 36
 *   - rank：依 Sheets row order，從 1 起遞增（GAS 端已排序）
 *   - tag：Sheets D13:L76 沒有 tag 欄位（GAS handleDragon 從「標籤」column 讀，前端 batchGet 暫無對應 range），預設 null
 */
export function transformDragon(ranges: SheetsValueRange[]): DragonData {
  const playerRows = ranges[0]?.values ?? [];
  const metaRows = ranges[1]?.values ?? [];
  const thresholdCell = ranges[2]?.values?.[0]?.[0];

  // reason: 真實 Sheets row[0]=rank, row[1]="名字(色"（GAS 合併寫法），需拆 name + team
  const players = playerRows
    .filter((row) => row[1])
    .map((row) => {
      const rawNameTeam = row[1] ?? '';
      const m = rawNameTeam.match(/^(.+?)\(([^)]+)/);
      const name = m ? m[1].trim() : rawNameTeam.trim();
      const team = m ? m[2].trim() : '';
      return {
        rank: parseInt(row[0] ?? '0', 10) || 0,
        name,
        team,
        tag: null,
        att: parseInt(row[2] ?? '0', 10) || 0,
        duty: parseInt(row[3] ?? '0', 10) || 0,
        mop: parseInt(row[4] ?? '0', 10) || 0,
        playoff: row[5] === '—' ? null : parseInt(row[5] ?? '0', 10) || 0,
        total: parseInt(row[6] ?? '0', 10) || 0,
      };
    });

  const parsedThreshold =
    thresholdCell !== undefined && thresholdCell !== ''
      ? parseInt(thresholdCell, 10)
      : NaN;

  return {
    season: SEASON,
    phase: metaRows[0]?.[0] ?? '',
    civilianThreshold: Number.isFinite(parsedThreshold) ? parsedThreshold : 36,
    columns: ['出席', '輪值', '拖地', '季後賽'],
    players,
  };
}

/**
 * datas!P13:AG13 (dates) + D87:N113 (allSchedule) + D117:F206 (allMatchups) → ScheduleData
 *
 * Reference:
 *   - js/api.js: sheetsRanges.dates / allSchedule / allMatchups
 *   - gas/Code.gs: handleSchedule()（zip 三組資料組成 weeks[]）
 *
 * Issue #17 Task 5：完整 zip 三個 ranges → weeks[]
 *   - ranges[0] = datas!P13:AG13 (dates)：一橫列，每欄一週日期字串
 *   - ranges[1] = datas!D87:N113 (allSchedule)：每週 GAMES_PER_WEEK 列，
 *     欄位順序：num / time / home / away / homeScore / awayScore / status / staff...
 *   - ranges[2] = datas!D117:F206 (allMatchups)：每週 GAMES_PER_WEEK 列，
 *     欄位順序：combo / home / away
 *
 * 每週對應 dates[i] + allSchedule.slice(i*N, (i+1)*N) + allMatchups.slice(i*N, (i+1)*N)。
 * currentWeek：第一個含 status=upcoming 比賽的週；全 finished 則最後一週。
 */
export function transformSchedule(ranges: SheetsValueRange[]): ScheduleData {
  if (ranges.length === 0) {
    return { season: SEASON, currentWeek: 1, allWeeks: [], weeks: {} };
  }

  const dates = ranges[0]?.values?.[0] ?? [];
  const scheduleRows = ranges[1]?.values ?? [];
  const matchupRows = ranges[2]?.values ?? [];
  const GAMES_PER_WEEK = 3;

  const allWeeks: ScheduleData['allWeeks'] = [];
  for (let w = 0; w < dates.length; w++) {
    const date = dates[w];
    if (!date) continue;
    const games = scheduleRows
      .slice(w * GAMES_PER_WEEK, (w + 1) * GAMES_PER_WEEK)
      .map((row) => ({
        num: parseInt(row[0] ?? '0', 10) || 0,
        time: row[1] ?? '',
        home: row[2] ?? '',
        away: row[3] ?? '',
        homeScore: row[4] ? parseInt(row[4], 10) : null,
        awayScore: row[5] ? parseInt(row[5], 10) : null,
        status: (row[6] ?? 'upcoming') as 'finished' | 'upcoming' | 'in_progress',
        staff: {},
      }));
    if (games.length === 0) continue;
    const matchups = matchupRows
      .slice(w * GAMES_PER_WEEK, (w + 1) * GAMES_PER_WEEK)
      .map((row) => ({
        combo: parseInt(row[0] ?? '0', 10) || 0,
        home: row[1] ?? '',
        away: row[2] ?? '',
        homeScore: null,
        awayScore: null,
        status: 'upcoming',
      }));
    allWeeks.push({
      type: 'game',
      week: w + 1,
      date,
      phase: '',
      venue: '',
      matchups,
      games,
    });
  }

  // 同時建 weeks Record（給舊 UI 用，以週次字串為 key）
  const weeks: Record<string, NonNullable<ScheduleData['weeks']>[string]> = {};
  for (const wk of allWeeks) {
    if (wk.type === 'game') weeks[String(wk.week)] = wk;
  }

  // currentWeek：第一個 status=upcoming 的週；全 finished 則最後一週
  const currentIdx = allWeeks.findIndex(
    (w) => w.type === 'game' && w.games.some((g) => g.status === 'upcoming'),
  );
  const currentWeek = currentIdx >= 0 ? currentIdx + 1 : Math.max(allWeeks.length, 1);

  return { season: SEASON, currentWeek, allWeeks, weeks };
}

/**
 * datas!O19:AH83 → RosterData（六隊 roster + 出席紀錄）
 *
 * Reference:
 *   - js/api.js: sheetsRanges.roster = 'datas!O19:AH83'
 *   - gas/Code.gs: handleRoster()（line 206-260）
 *
 * Sheet 結構（flat 格式，依 row[2] teamId 分組，非 block 起始列）：
 *   header: [球員姓名, 隊伍, 隊伍ID, 第1週 1/10, 第2週 1/17, ...]
 *   row：   [name,    teamName, teamId, att1, att2, ...]
 *
 * Att 解析：1 / 0 → number；'x' / 'X' → 'x'；空格 / undefined → '?'；其他 → '?'
 *
 * 注意：本 Issue (#17) 不擴 RosterData 型別補 season/phase，
 * 該欄位由 RosterHero 元件透過另一 API kind 取得（plan 第 421-431 行設計決策）。
 */
export function transformRoster(ranges: SheetsValueRange[]): RosterData {
  const rows = ranges[0]?.values ?? [];
  if (rows.length === 0) {
    return { weeks: [], teams: [] };
  }

  const headerRow = rows[0];
  // 前 3 欄為固定欄位（球員姓名 / 隊伍 / 隊伍ID），第 4 欄起為各週
  const weeks: RosterWeek[] = [];
  for (let c = 3; c < headerRow.length; c++) {
    const h = String(headerRow[c] ?? '').trim();
    if (!h) break;
    // 解析「第N週 M/D」格式（與 GAS handleRoster 一致）
    const match = h.match(/第(\d+)週\s*([\d/]+)?/);
    weeks.push({
      wk: match ? parseInt(match[1], 10) : c - 2,
      label: match ? `第${match[1]}週` : h,
      date: match && match[2] ? match[2] : '',
    });
  }

  // 依 teamId 分組（保留讀入順序）
  const teamMap = new Map<string, RosterTeam>();
  const teamOrder: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => !cell)) continue;
    const name = String(row[0] ?? '').trim();
    const teamName = String(row[1] ?? '').trim();
    const teamId = String(row[2] ?? '').trim();
    if (!name || !teamId) continue;

    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, { id: teamId, name: teamName, players: [] });
      teamOrder.push(teamId);
    }

    const att: AttValue[] = [];
    for (let c = 3; c < 3 + weeks.length; c++) {
      att.push(parseAttCell(row[c]));
    }
    teamMap.get(teamId)!.players.push({ name, att });
  }

  const teams = teamOrder.map((id) => teamMap.get(id)!);
  return { weeks, teams };
}

function parseAttCell(v: string | undefined | null): AttValue {
  if (v === '' || v === undefined || v === null) return '?';
  const s = String(v).trim().toLowerCase();
  if (s === '1' || s === 'true') return 1;
  if (s === '0' || s === 'false') return 0;
  if (s === 'x') return 'x';
  return '?';
}

/**
 * datas!D212:N224 + D227:K234 + D237:K244 + D247:K254 → LeaderData（Issue #17 Task 6）
 *
 * Reference:
 *   - js/api.js: sheetsRanges.leadersTable / teamOffense / teamDefense / teamNet
 *   - gas/Code.gs: handleStats()（個人類別 [scoring]/[rebound]/... 區塊解析）
 *
 * Range 對映（4-block 解析）：
 *   ranges[0] = datas!D212:N224（leadersTable，個人類別）
 *     每列 cols：[類別中文名 / name / team / val / p2 / p3 / ft / off / def]
 *     類別中文名透過 CATEGORY_MAP 對映到 LeaderSeason 欄位（scoring / rebound / assist / ...）
 *   ranges[1] = datas!D227:K234（teamOffense，6 隊進攻表）
 *     第 0 列 = headers，第 1..N 列 = 各隊資料（首欄為隊名，後續為對應 headers 的數值）
 *   ranges[2] = datas!D237:K244（teamDefense，6 隊防守表）— 同 offense 結構
 *   ranges[3] = datas!D247:K254（teamNet，6 隊淨值表）— 同 offense 結構
 *
 * 產出 shape：`Record<seasonKey, LeaderSeason>`，當前以 `String(SEASON)` 為唯一 key。
 * 缺值處理：
 *   - 個人類別 row 若 `類別中文名` 不在 CATEGORY_MAP 內 → 跳過
 *   - 數值欄位 parseFloat 失敗 / 非數字 → 0
 *   - ranges 為空 → 回 `{}`（caller 由 fallback 補）
 */

/** 個人類別中文 → LeaderSeason 欄位名 */
// reason: 真實 Sheets row[0] 用「平均X」+「兩/三分球命中率」+「EFF」（非 agent 假設的「X / 2P% / 效率值」）
const CATEGORY_MAP: Record<string, keyof Pick<LeaderSeason,
  'scoring' | 'rebound' | 'assist' | 'steal' | 'block' | 'eff' |
  'turnover' | 'foul' | 'p2pct' | 'p3pct' | 'ftpct'>> = {
  '平均得分': 'scoring',
  '平均籃板': 'rebound',
  '平均助攻': 'assist',
  '平均抄截': 'steal',
  '平均阻攻': 'block',
  'EFF': 'eff',
  '平均失誤': 'turnover',
  '平均犯規': 'foul',
  '兩分球命中率': 'p2pct',
  '三分球命中率': 'p3pct',
  '罰球命中率': 'ftpct',
};

export function transformLeaders(ranges: SheetsValueRange[]): LeaderData {
  if (ranges.length === 0) return {};

  const leadersRows = ranges[0]?.values ?? [];
  const offenseBlock = ranges[1]?.values ?? [];
  const defenseBlock = ranges[2]?.values ?? [];
  const netBlock = ranges[3]?.values ?? [];

  const season: LeaderSeason = {
    label: `第 ${SEASON} 屆 · 本季個人排行榜`,
    scoring: [],
    rebound: [],
    assist: [],
    steal: [],
    block: [],
    eff: [],
  };

  for (const row of leadersRows) {
    const cat = CATEGORY_MAP[row[0] ?? ''];
    if (!cat) continue;
    const list = (season[cat] ?? []) as LeaderEntry[];
    list.push({
      name: row[1] ?? '',
      team: row[2] ?? '',
      val: parseFloat(row[3] ?? '0') || 0,
    });
    season[cat] = list;
  }

  season.offense = parseTeamBlock(offenseBlock);
  season.defense = parseTeamBlock(defenseBlock);
  season.net = parseTeamBlock(netBlock);

  return { [String(SEASON)]: season };
}

/**
 * 解析隊伍區塊（offense / defense / net 共用結構）
 * 第 0 列 = headers；第 1..N 列 = 各隊資料 row（首欄為隊名，後續為對應 headers 的數值）
 * rank 依列序 1..N。空 block → 回 { headers: [], rows: [] }。
 */
function parseTeamBlock(rows: string[][]): TeamLeaderTable {
  const [headerRow, ...dataRows] = rows;
  const headers = headerRow ?? [];
  const teamRows = dataRows.map((r, idx) => ({
    team: r[0] ?? '',
    rank: idx + 1,
    values: r.slice(1).map((v) => parseFloat(v) || 0),
  }));
  return { headers, rows: teamRows };
}
