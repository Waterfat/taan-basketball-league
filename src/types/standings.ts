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

export interface StandingsData {
  season: number;
  phase: string;
  currentWeek: number;
  teams: TeamStanding[];
  matrix?: unknown;
}
