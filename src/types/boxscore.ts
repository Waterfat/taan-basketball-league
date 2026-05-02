export type TeamId = '紅' | '黑' | '藍' | '綠' | '黃' | '白';

export interface BoxscorePlayer {
  name: string;
  pts: number;
  fg2: number;
  fg3: number;
  ft: number;
  oreb: number;
  dreb: number;
  treb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  /** true = 未出賽（DNP），totals 計算時排除 */
  dnp: boolean;
}

export type BoxscoreTotals = Omit<BoxscorePlayer, 'name' | 'dnp'>;

export interface BoxscoreTeam {
  team: TeamId;
  score: number;
  players: BoxscorePlayer[];
  totals: BoxscoreTotals;
}

export interface BoxscoreGame {
  week: number;
  game: number;
  home: BoxscoreTeam;
  away: BoxscoreTeam;
  staff: Record<string, string[]>;
}

export interface BoxscoreWeek {
  week: number;
  games: BoxscoreGame[];
}

export interface BoxscoreData {
  season: number;
  currentWeek: number;
  weeks: BoxscoreWeek[];
}
