/**
 * Leaders fixture 工廠
 *
 * 模擬 GAS handleStats endpoint 回應結構（依賽季 key 分組，每賽季 11 類個人 + 3 張隊伍表）。
 * 對應 src/lib/api.ts 的 fetchData('stats') 結果。
 *
 * Issue #14：個人類別由 6 類擴充為 11 類（加 turnover/foul/p2pct/p3pct/ftpct），
 * 並新增 offense / defense / net 三張隊伍表。
 */

/**
 * 領先榜個人類別。
 * 既有 6 類：scoring, rebound, assist, steal, block, eff
 * 新增 5 類：turnover, foul, p2pct, p3pct, ftpct
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

/**
 * 隊伍領先榜資料（B-5 進攻 / 防守 / 差值）。
 *
 * `headers` / `rows` 結構與 GAS handleStats 既有 leaders / offense / defense / net 欄位對齊
 * （見 public/data/leaders.json 既有 stub）。
 */
export interface TeamLeaderTable {
  /** 表格欄位標題（首欄通常為「隊伍」，後續為各分項統計）*/
  headers: string[];
  /** 每列資料（首欄為隊伍 ID，後續為對應 headers 的數值）*/
  rows: TeamLeaderRow[];
}

export interface TeamLeaderRow {
  /** 隊伍 ID（對應 TEAM_CONFIG key，例：「紅」） */
  team: string;
  /** 該隊在此表中的排名（1-based） */
  rank: number;
  /** 各欄位數值（對應 headers，扣除首欄「隊伍」） */
  values: number[];
}

/** 建立單一 entry */
export function mockLeaderEntry(name: string, team: string, val: number, advanced: Partial<Pick<LeaderEntry, 'p2' | 'p3' | 'ft' | 'off' | 'def'>> = {}): LeaderEntry {
  return { name, team, val, ...advanced };
}

/** 建立 scoring top 10 含進階指標 */
export function mockScoringLeaders(): LeaderEntry[] {
  return [
    mockLeaderEntry('黃偉訓', '綠', 9.55, { p2: '55.6%', p3: '20.0%', ft: '57.5%' }),
    mockLeaderEntry('林毅豐', '黑', 9.10, { p2: '50.2%', p3: '32.1%', ft: '70.0%' }),
    mockLeaderEntry('陳大文', '紅', 8.80, { p2: '48.0%', p3: '25.0%', ft: '60.0%' }),
    mockLeaderEntry('王小明', '白', 8.50, { p2: '52.0%', p3: '30.0%', ft: '75.0%' }),
    mockLeaderEntry('李志強', '藍', 8.20, { p2: '46.0%', p3: '28.0%', ft: '65.0%' }),
    mockLeaderEntry('張三', '黃', 7.90, { p2: '50.0%', p3: '22.0%', ft: '62.0%' }),
    mockLeaderEntry('劉四', '綠', 7.60, { p2: '45.0%', p3: '18.0%', ft: '58.0%' }),
    mockLeaderEntry('趙五', '黑', 7.30, { p2: '42.0%', p3: '15.0%', ft: '55.0%' }),
    mockLeaderEntry('錢六', '紅', 7.00, { p2: '40.0%', p3: '12.0%', ft: '50.0%' }),
    mockLeaderEntry('孫七', '白', 6.70, { p2: '38.0%', p3: '10.0%', ft: '48.0%' }),
  ];
}

/** 建立 rebound top 10 含 off/def */
export function mockReboundLeaders(): LeaderEntry[] {
  return [
    mockLeaderEntry('周八', '藍', 8.4, { off: 2.5, def: 5.9 }),
    mockLeaderEntry('吳九', '黃', 7.9, { off: 2.2, def: 5.7 }),
    mockLeaderEntry('鄭十', '綠', 7.5, { off: 2.0, def: 5.5 }),
    mockLeaderEntry('馮一', '黑', 7.2, { off: 1.8, def: 5.4 }),
    mockLeaderEntry('陳大文', '紅', 7.0, { off: 1.5, def: 5.5 }),
    mockLeaderEntry('衛二', '白', 6.8, { off: 1.4, def: 5.4 }),
    mockLeaderEntry('蔣三', '紅', 6.5, { off: 1.2, def: 5.3 }),
    mockLeaderEntry('沈四', '黃', 6.2, { off: 1.1, def: 5.1 }),
    mockLeaderEntry('韓五', '黑', 6.0, { off: 1.0, def: 5.0 }),
    mockLeaderEntry('楊六', '藍', 5.8, { off: 0.9, def: 4.9 }),
  ];
}

/** 建立通用 top 10（無進階指標） */
function mockGenericTop10(seed: string): LeaderEntry[] {
  const teams = ['紅', '黑', '藍', '綠', '黃', '白'];
  return Array.from({ length: 10 }, (_, i) => mockLeaderEntry(
    `${seed}${i + 1}`,
    teams[i % teams.length],
    Number((10 - i * 0.4).toFixed(2)),
  ));
}

/** 完整賽季 leader 資料（既有 6 類別都填滿，向後相容） */
export function mockFullLeaders(): LeaderData {
  return {
    '25': {
      label: '第 25 屆 · 本季個人排行榜',
      scoring: mockScoringLeaders(),
      rebound: mockReboundLeaders(),
      assist: mockGenericTop10('助攻'),
      steal: mockGenericTop10('抄截'),
      block: mockGenericTop10('阻攻'),
      eff: mockGenericTop10('效率'),
    },
  };
}

/**
 * 進階 11 類個人 leader（Issue #14 新增）。
 * 既有 6 類沿用 mockFullLeaders，新增 5 類使用通用工廠。
 */
export function mockExtendedLeaders(): LeaderData {
  const base = mockFullLeaders()['25'];
  return {
    '25': {
      ...base,
      turnover: mockGenericTop10('失誤'),
      foul: mockGenericTop10('犯規'),
      p2pct: mockPercentageLeaders('2P', [55, 52, 50, 48, 46, 45, 43, 42, 40, 38]),
      p3pct: mockPercentageLeaders('3P', [42, 38, 35, 32, 30, 28, 25, 22, 20, 18]),
      ftpct: mockPercentageLeaders('FT', [88, 85, 82, 80, 78, 75, 72, 70, 68, 65]),
    },
  };
}

/**
 * 完整 11 類個人 + 3 張隊伍表（一鍵驗收 B-3 / B-4 / B-5）。
 */
export function mockExtendedLeadersWithTeams(): LeaderData {
  const extended = mockExtendedLeaders()['25'];
  return {
    '25': {
      ...extended,
      offense: mockTeamOffense(),
      defense: mockTeamDefense(),
      net: mockTeamNet(),
    },
  };
}

/** 百分率類 leader（2P% / 3P% / FT%）— val 直接是百分比數字 */
function mockPercentageLeaders(seed: string, vals: number[]): LeaderEntry[] {
  const teams = ['紅', '黑', '藍', '綠', '黃', '白'];
  return vals.map((v, i) => mockLeaderEntry(
    `${seed}王${i + 1}`,
    teams[i % teams.length],
    v,
  ));
}

/** 隊伍進攻表（PPG + 各分項，用於 B-5.1 ⚔️） */
export function mockTeamOffense(): TeamLeaderTable {
  return {
    headers: ['隊伍', 'PPG', '2P', '3P', 'FT', 'AST'],
    rows: [
      { team: '綠', rank: 1, values: [78.5, 28, 7, 11, 18] },
      { team: '紅', rank: 2, values: [76.2, 27, 6, 10, 17] },
      { team: '黑', rank: 3, values: [74.0, 26, 5, 12, 16] },
      { team: '黃', rank: 4, values: [71.8, 25, 6, 9, 15] },
      { team: '白', rank: 5, values: [68.5, 23, 5, 11, 14] },
      { team: '藍', rank: 6, values: [62.0, 21, 4, 8, 12] },
    ],
  };
}

/** 隊伍防守表（失分 + 各分項，用於 B-5.1 🛡️） */
export function mockTeamDefense(): TeamLeaderTable {
  return {
    headers: ['隊伍', 'Opp PPG', 'STL', 'BLK', 'TO_FORCED'],
    rows: [
      { team: '綠', rank: 1, values: [62.0, 9, 3, 12] },
      { team: '紅', rank: 2, values: [64.5, 8, 4, 11] },
      { team: '黑', rank: 3, values: [66.8, 7, 3, 10] },
      { team: '黃', rank: 4, values: [70.0, 6, 2, 9] },
      { team: '白', rank: 5, values: [73.5, 5, 2, 8] },
      { team: '藍', rank: 6, values: [78.5, 4, 1, 7] },
    ],
  };
}

/** 隊伍進攻−防守差值表（用於 B-5.1 📈） */
export function mockTeamNet(): TeamLeaderTable {
  return {
    headers: ['隊伍', 'Net'],
    rows: [
      { team: '綠', rank: 1, values: [16.5] },
      { team: '紅', rank: 2, values: [11.7] },
      { team: '黑', rank: 3, values: [7.2] },
      { team: '黃', rank: 4, values: [1.8] },
      { team: '白', rank: 5, values: [-5.0] },
      { team: '藍', rank: 6, values: [-16.5] },
    ],
  };
}

/** 部分隊伍表為空（驗 B-Q2：缺一張不影響其他）*/
export function mockExtendedLeadersWithPartialTeams(): LeaderData {
  const extended = mockExtendedLeaders()['25'];
  return {
    '25': {
      ...extended,
      offense: { headers: [], rows: [] },
      defense: mockTeamDefense(),
      net: mockTeamNet(),
    },
  };
}

/** 空資料（賽季初） */
export function mockEmptyLeaders(): LeaderData {
  return {
    '25': {
      label: '第 25 屆 · 本季個人排行榜',
      scoring: [],
      rebound: [],
      assist: [],
      steal: [],
      block: [],
      eff: [],
    },
  };
}

/** 部分類別有資料、部分為空（驗證個別 empty） */
export function mockPartialLeaders(): LeaderData {
  return {
    '25': {
      label: '第 25 屆 · 本季個人排行榜',
      scoring: mockScoringLeaders(),
      rebound: [],
      assist: mockGenericTop10('助攻'),
      steal: [],
      block: mockGenericTop10('阻攻'),
      eff: [],
    },
  };
}
