/**
 * Home fixture 工廠
 *
 * 提供測試專用的固定範例資料。
 * 結構對應 public/data/home.json（GAS 整合來源）。
 * 不會打 production Google Sheets，所有資料均在此手寫。
 */

export type StreakType = 'win' | 'lose' | null;

export interface HomeStandingTeam {
  rank: number;
  name: string;
  team: string;
  record: string;
  pct: string;
  history: string[];
  streak: string;
  streakType: StreakType;
}

export interface MiniStatsPlayer {
  rank: number;
  name: string;
  team: string;
  val: number;
}

export interface MiniStatCategory {
  label: string;
  unit: string;
  players: MiniStatsPlayer[];
}

export interface DragonEntry {
  rank: number;
  name: string;
  team: string;
  att: number;
  duty: number;
  total: number;
}

/**
 * 對戰組合單筆資料（B1 / B7 「對戰組合」視圖）。
 * combo 為對戰組合編號（1~6），home / away 為隊伍 ID。
 * homeScore / awayScore / status 為比賽結果（已開賽才有）。
 */
export interface MatchupCombo {
  combo: number;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status?: 'upcoming' | 'finished';
}

/**
 * 賽程順序單筆資料（B1 / B7 「賽程順序」視圖）。
 * num 為當週第幾場（1~6），time 為開賽時間。
 * games[].home / .away 任一非空 → 視為「順序已公告」。
 */
export interface MatchupGame {
  num: number;
  time: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status?: 'upcoming' | 'finished';
}

/**
 * 本週對戰資料（Issue #14 B1 新增）。
 *
 * 設計：home page 從 `home.json` 直接拿到完整 6 組對戰，不必再 fetch schedule.json。
 * 智慧切換邏輯（B-2.*）：
 *   - games[] 任一筆有 home/away → 預設「賽程順序」
 *   - games[] 全部 home/away 為空 → 預設「對戰組合」+ 顯示「順序尚未公告」提示
 */
export interface WeekMatchups {
  week: number;
  date: string;
  venue: string;
  combos: MatchupCombo[];
  games: MatchupGame[];
}

export interface HomeData {
  season: number;
  currentWeek: number;
  phase: string;
  scheduleInfo: {
    date: string;
    venue: string;
  };
  /** Issue #14 B1：本週 6 組對戰預覽（含 combo 與 games 兩種視圖） */
  weekMatchups?: WeekMatchups;
  standings: HomeStandingTeam[];
  dragonTop10: DragonEntry[];
  miniStats: {
    pts: MiniStatCategory;
    reb: MiniStatCategory;
    ast: MiniStatCategory;
  };
}

/** 完整正常情境 home data（對應 public/data/home.json 快照） */
export function mockHomeData(): HomeData {
  return {
    season: 25,
    currentWeek: 3,
    phase: '例行賽',
    scheduleInfo: {
      date: '2026 / 2 / 14（六）07:30',
      venue: '三重體育館',
    },
    standings: [
      { rank: 1, name: '綠隊', team: '綠', record: '4勝 2敗', pct: '66.7%', history: ['L','W','W','L','W','W'], streak: '2連勝', streakType: 'win' },
      { rank: 2, name: '紅隊', team: '紅', record: '4勝 2敗', pct: '66.7%', history: ['W','L','W','W','W','L'], streak: '1連敗', streakType: 'lose' },
      { rank: 3, name: '黑隊', team: '黑', record: '3勝 3敗', pct: '50.0%', history: ['L','W','L','W','W','W'], streak: '2連勝', streakType: 'win' },
      { rank: 4, name: '黃隊', team: '黃', record: '3勝 3敗', pct: '50.0%', history: ['W','W','L','L','L','W'], streak: '1連勝', streakType: 'win' },
      { rank: 5, name: '白隊', team: '白', record: '3勝 3敗', pct: '50.0%', history: ['L','W','W','W','L','L'], streak: '2連敗', streakType: 'lose' },
      { rank: 6, name: '藍隊', team: '藍', record: '1勝 5敗', pct: '16.7%', history: ['L','L','W','L','L','L'], streak: '3連敗', streakType: 'lose' },
    ],
    dragonTop10: [
      { rank: 1,  name: '韋承志', team: '紅', att: 8, duty: 8, total: 16 },
      { rank: 2,  name: '吳家豪', team: '綠', att: 6, duty: 6, total: 12 },
      { rank: 3,  name: '李昊明', team: '黑', att: 8, duty: 3, total: 11 },
      { rank: 4,  name: '趙尹旋', team: '紅', att: 7, duty: 3, total: 10 },
      { rank: 5,  name: '李政軒', team: '黑', att: 8, duty: 1, total: 9 },
      { rank: 6,  name: '楊承達', team: '黑', att: 5, duty: 3, total: 8 },
      { rank: 7,  name: '陳鈞銘', team: '黃', att: 5, duty: 2, total: 7 },
      { rank: 8,  name: '吳軒宇', team: '紅', att: 4, duty: 2, total: 6 },
      { rank: 9,  name: '林志柏', team: '黑', att: 4, duty: 2, total: 6 },
      { rank: 10, name: '江錒哲', team: '黃', att: 4, duty: 1, total: 5 },
    ],
    miniStats: {
      pts: {
        label: '得分', unit: 'PPG',
        players: [
          { rank: 1, name: '黃偉訓', team: '綠', val: 9.55 },
          { rank: 2, name: '吳軒宇', team: '紅', val: 7.62 },
          { rank: 3, name: '吳家豪', team: '綠', val: 7.00 },
          { rank: 4, name: '陳彥汗', team: '白', val: 6.68 },
        ],
      },
      reb: {
        label: '籃板', unit: 'RPG',
        players: [
          { rank: 1, name: '陳曉川', team: '白', val: 4.90 },
          { rank: 2, name: '江浩仲', team: '藍', val: 4.84 },
          { rank: 3, name: '林毅豐', team: '黑', val: 4.08 },
          { rank: 4, name: '李政軒', team: '黑', val: 4.04 },
        ],
      },
      ast: {
        label: '助攻', unit: 'APG',
        players: [
          { rank: 1, name: '梁修綸', team: '黑', val: 1.61 },
          { rank: 2, name: '陳彥廷', team: '黃', val: 1.15 },
          { rank: 3, name: '吳家豪', team: '綠', val: 1.11 },
          { rank: 4, name: '連育樟', team: '綠', val: 1.09 },
        ],
      },
    },
  };
}

/** 空資料（賽季尚未開始） */
export function mockEmptyHomeData(): HomeData {
  return {
    season: 0,
    currentWeek: 0,
    phase: '',
    scheduleInfo: { date: '', venue: '' },
    standings: [],
    dragonTop10: [],
    miniStats: {
      pts: { label: '得分', unit: 'PPG', players: [] },
      reb: { label: '籃板', unit: 'RPG', players: [] },
      ast: { label: '助攻', unit: 'APG', players: [] },
    },
  };
}

/** streakType null 邊界情境 */
export function mockHomeDataWithNullStreak(): HomeData {
  const data = mockHomeData();
  data.standings = data.standings.map((t) => ({ ...t, streakType: null as unknown as StreakType }));
  return data;
}

/** 領先榜 players < 3 情境 */
export function mockHomeDataWithFewPlayers(): HomeData {
  const data = mockHomeData();
  data.miniStats.pts.players = [{ rank: 1, name: '唯一得分王', team: '綠', val: 9.55 }];
  data.miniStats.reb.players = [
    { rank: 1, name: '籃板王甲', team: '白', val: 4.90 },
    { rank: 2, name: '籃板王乙', team: '藍', val: 4.84 },
  ];
  return data;
}

/** 龍虎榜 < 5 情境 */
export function mockHomeDataWithFewDragon(): HomeData {
  const data = mockHomeData();
  data.dragonTop10 = data.dragonTop10.slice(0, 2);
  return data;
}

/** 標準 6 組對戰組合（紅黑、藍綠、黃白；六隊兩兩配對）*/
function mockSixCombos(): MatchupCombo[] {
  return [
    { combo: 1, home: '白', away: '紅', status: 'upcoming' },
    { combo: 2, home: '黃', away: '黑', status: 'upcoming' },
    { combo: 3, home: '藍', away: '綠', status: 'upcoming' },
    { combo: 4, home: '黑', away: '白', status: 'upcoming' },
    { combo: 5, home: '紅', away: '藍', status: 'upcoming' },
    { combo: 6, home: '綠', away: '黃', status: 'upcoming' },
  ];
}

/** 標準 6 場賽程順序（已公告 home/away 與 time）*/
function mockSixGamesPublished(): MatchupGame[] {
  return [
    { num: 1, time: '07:30', home: '白', away: '紅', status: 'upcoming' },
    { num: 2, time: '08:30', home: '黃', away: '黑', status: 'upcoming' },
    { num: 3, time: '09:30', home: '藍', away: '綠', status: 'upcoming' },
    { num: 4, time: '10:30', home: '黑', away: '白', status: 'upcoming' },
    { num: 5, time: '11:30', home: '紅', away: '藍', status: 'upcoming' },
    { num: 6, time: '12:30', home: '綠', away: '黃', status: 'upcoming' },
  ];
}

/** 賽程順序未公告（home/away 為空字串）*/
function mockSixGamesUnpublished(): MatchupGame[] {
  return Array.from({ length: 6 }, (_, i) => ({
    num: i + 1,
    time: '',
    home: '',
    away: '',
    status: 'upcoming' as const,
  }));
}

/**
 * Home + 本週 6 組對戰（Issue #14 B1 用）。
 *
 * @param opts.gamesPublished true → games[] 含 home/away（B-2.2 走「賽程順序」）；
 *                            false → games[] 空 home/away（B-2.1 走「對戰組合」+ 提示）。
 *                            預設 true。
 */
export function mockHomeWithWeekMatchups(opts: { gamesPublished?: boolean } = {}): HomeData {
  const { gamesPublished = true } = opts;
  const data = mockHomeData();
  data.weekMatchups = {
    week: data.currentWeek,
    date: data.scheduleInfo.date,
    venue: data.scheduleInfo.venue,
    combos: mockSixCombos(),
    games: gamesPublished ? mockSixGamesPublished() : mockSixGamesUnpublished(),
  };
  return data;
}
