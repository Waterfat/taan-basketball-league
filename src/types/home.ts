export type HomeStreakType = 'win' | 'lose' | null;

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

export interface HomeStandingTeam {
  rank: number;
  name: string;
  team: string;
  record: string;
  pct: string;
  history: string[];
  streak: string;
  streakType: HomeStreakType;
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
 * 對戰組合單筆（Issue #14 B1 / B7「對戰組合」視圖）。
 * combo 為對戰組合編號（1~6），home / away 為隊伍 ID。
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
 * 賽程順序單筆（Issue #14 B1 / B7「賽程順序」視圖）。
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
 * 智慧切換邏輯：
 *  - games[] 任一筆有 home/away → 預設「賽程順序」
 *  - games[] 全部 home/away 為空 → 預設「對戰組合」+ 顯示「順序尚未公告」提示
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
