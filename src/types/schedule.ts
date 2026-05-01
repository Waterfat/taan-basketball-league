export type GameStatus = 'finished' | 'upcoming' | 'in_progress';

export interface Game {
  num: number;
  time: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  staff: Record<string, string[]>;
}

export interface GameWeek {
  type: 'game';
  week: number;
  date: string;
  phase: string;
  venue: string;
  matchups: Array<{
    combo: number;
    home: string;
    away: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
  }>;
  games: Game[];
}

export interface SuspendedWeek {
  type: 'suspended';
  date: string;
  venue: string;
  reason: string;
}

export type ScheduleWeek = GameWeek | SuspendedWeek;

export interface ScheduleData {
  season: number;
  currentWeek: number;
  allWeeks: ScheduleWeek[];
  weeks?: Record<string, GameWeek>;
}

export type Winner = 'home' | 'away' | 'tie' | 'none';
