export type StreakType = 'win' | 'lose' | 'none';
export type HistoryResult = 'W' | 'L';

export interface TeamStanding {
  rank: number;
  name: string;     // 「綠隊」
  team: string;     // 「綠」（對應 TEAM_CONFIG key）
  wins: number;
  losses: number;
  pct: string;
  history: HistoryResult[];
  streak: string;
  streakType: StreakType;
}

/**
 * 戰績矩陣 cell（Issue #14 B2）。
 * - null：自己對自己（對角線）
 * - number：淨勝分（正 = 該列隊伍勝出多少分；負 = 輸多少分）
 */
export type MatrixCell = number | null;

export interface MatrixData {
  /** 隊伍順序（與 results 行/列順序一致） */
  teams: string[];
  /** 6×6 淨勝分矩陣 */
  results: MatrixCell[][];
}

export interface StandingsData {
  season: number;
  phase: string;
  currentWeek: number;
  teams: TeamStanding[];
  matrix?: MatrixData;
}
