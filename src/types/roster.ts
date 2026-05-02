export type AttValue = 1 | 0 | 'x' | '?';

export interface RosterWeek {
  wk: number;
  label: string;
  date: string;
}

export interface RosterPlayer {
  name: string;
  att: AttValue[];
  tag?: string | null;
}

export interface RosterTeam {
  id: string;
  name: string;
  players: RosterPlayer[];
}

export interface RosterData {
  weeks: RosterWeek[];
  teams: RosterTeam[];
}

export interface DragonPlayer {
  rank: number;
  name: string;
  team: string;
  tag: string | null;
  att: number;
  duty: number;
  mop: number;
  playoff: number | null;
  total: number;
}

export interface DragonData {
  season: number;
  phase: string;
  civilianThreshold: number;
  columns: string[];
  players: DragonPlayer[];
  rulesLink?: string;
}

export type RosterTab = 'roster' | 'dragon';
