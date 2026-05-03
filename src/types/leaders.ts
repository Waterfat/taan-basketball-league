// src/types/leaders.ts

/**
 * 領先榜個人類別。Issue #14 由 6 類擴充為 11 類：
 *   既有：scoring, rebound, assist, steal, block, eff
 *   新增：turnover（失誤）, foul（犯規）, p2pct（2P%）, p3pct（3P%）, ftpct（FT%）
 */
export type LeaderCategory =
  | 'scoring'
  | 'rebound'
  | 'assist'
  | 'steal'
  | 'block'
  | 'eff'
  | 'turnover'
  | 'foul'
  | 'p2pct'
  | 'p3pct'
  | 'ftpct';

/** 11 類顯示順序：既有 6 類在前，新 5 類在後（B-Q6 約定） */
export const LEADER_CATEGORIES_ORDERED: readonly LeaderCategory[] = [
  'scoring', 'rebound', 'assist', 'steal', 'block', 'eff',
  'turnover', 'foul', 'p2pct', 'p3pct', 'ftpct',
] as const;

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

/**
 * 隊伍領先榜資料（B-5 進攻 / 防守 / 差值）。
 * `headers` 第一欄通常為「隊伍」，後續為各分項統計欄位。
 */
export interface TeamLeaderRow {
  /** 隊伍 ID（對應 TEAM_CONFIG key，例：「紅」） */
  team: string;
  /** 排名（1-based） */
  rank: number;
  /** 各欄位數值（對應 headers，扣除首欄「隊伍」） */
  values: number[];
}

export interface TeamLeaderTable {
  headers: string[];
  rows: TeamLeaderRow[];
}

export interface LeaderSeason {
  label: string;
  scoring: LeaderEntry[];
  rebound: LeaderEntry[];
  assist: LeaderEntry[];
  steal: LeaderEntry[];
  block: LeaderEntry[];
  eff: LeaderEntry[];
  /** Issue #14 新增 5 類個人 */
  turnover?: LeaderEntry[];
  foul?: LeaderEntry[];
  p2pct?: LeaderEntry[];
  p3pct?: LeaderEntry[];
  ftpct?: LeaderEntry[];
  /** Issue #14 新增 3 張隊伍表 */
  offense?: TeamLeaderTable;
  defense?: TeamLeaderTable;
  net?: TeamLeaderTable;
}

export type LeaderData = Record<string, LeaderSeason>;
