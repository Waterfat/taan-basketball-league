/**
 * Leaders fixture 工廠
 *
 * 模擬 GAS handleStats endpoint 回應結構（依賽季 key 分組，每賽季 6 類別）。
 * 對應 src/lib/api.ts 的 fetchData('stats') 結果。
 */

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

/** 完整賽季 leader 資料（6 類別都填滿） */
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
