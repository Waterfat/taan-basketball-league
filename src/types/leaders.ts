// src/types/leaders.ts
export type LeaderCategory = 'scoring' | 'rebound' | 'assist' | 'steal' | 'block' | 'eff';

export interface LeaderEntry {
  name: string;
  team: string;
  val: number;
  /** scoring 才有 */
  p2?: string;
  p3?: string;
  ft?: string;
  /** rebound 才有 */
  off?: number;
  def?: number;
}

export interface LeaderSeason {
  label: string;
  scoring: LeaderEntry[];
  rebound: LeaderEntry[];
  assist: LeaderEntry[];
  steal: LeaderEntry[];
  block: LeaderEntry[];
  eff: LeaderEntry[];
}

export type LeaderData = Record<string, LeaderSeason>;
