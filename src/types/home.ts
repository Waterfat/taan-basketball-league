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

export interface HomeData {
  season: number;
  currentWeek: number;
  phase: string;
  scheduleInfo: {
    date: string;
    venue: string;
  };
  standings: HomeStandingTeam[];
  dragonTop10: DragonEntry[];
  miniStats: {
    pts: MiniStatCategory;
    reb: MiniStatCategory;
    ast: MiniStatCategory;
  };
}
