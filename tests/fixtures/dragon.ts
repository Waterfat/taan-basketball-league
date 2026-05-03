/**
 * Dragon fixture 工廠
 *
 * 模擬 public/data/dragon.json 結構（積分龍虎榜）：
 *   - season / phase / civilianThreshold / columns / players / rulesLink
 *   - players：rank / name / team / tag / att / duty / mop / playoff / total
 *   - civilianThreshold：超過此分數的球員列加金色背景
 */

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

/** 建立單一龍虎榜球員 */
export function mockDragonPlayer(overrides: Partial<DragonPlayer> & Pick<DragonPlayer, 'rank' | 'name' | 'team'>): DragonPlayer {
  return {
    tag: null,
    att: 6,
    duty: 2,
    mop: 0,
    playoff: null,
    total: 8,
    ...overrides,
  };
}

/**
 * 完整龍虎榜（37 名球員，含平民線上下各有球員）
 * civilianThreshold = 36：rank 1 (total=16) 遠低於，所以 threshold 不會在 top 5 觸發
 *
 * 特意設計：
 *   - rank 1 韋承志 tag="裁" → ⚖️ icon
 *   - rank 3 李昊明 tag="裁" → ⚖️ icon
 *   - 所有 playoff = null → 顯示「—」
 *   - 大多數 total < civilianThreshold（36），視覺上全部在平民線以下
 */
export function mockFullDragonboard(): DragonData {
  return {
    season: 25,
    phase: '賽季進行中',
    civilianThreshold: 36,
    columns: ['出席', '輪值', '拖地', '季後賽'],
    players: [
      mockDragonPlayer({ rank: 1,  name: '韋承志', team: '紅', tag: '裁', att: 8, duty: 8, mop: 0, playoff: null, total: 16 }),
      mockDragonPlayer({ rank: 2,  name: '吳家豪', team: '綠', tag: null,  att: 6, duty: 6, mop: 0, playoff: null, total: 12 }),
      mockDragonPlayer({ rank: 3,  name: '李昊明', team: '黑', tag: '裁', att: 8, duty: 3, mop: 1, playoff: null, total: 12 }),
      mockDragonPlayer({ rank: 4,  name: '趙尹旋', team: '紅', tag: null,  att: 7, duty: 3, mop: 0, playoff: null, total: 10 }),
      mockDragonPlayer({ rank: 5,  name: '李政軒', team: '黑', tag: '裁', att: 8, duty: 1, mop: 0, playoff: null, total: 9  }),
      mockDragonPlayer({ rank: 6,  name: '楊承達', team: '黑', tag: null,  att: 4, duty: 3, mop: 0, playoff: null, total: 7  }),
      mockDragonPlayer({ rank: 7,  name: '陳鈞銘', team: '黃', tag: null,  att: 5, duty: 2, mop: 0, playoff: null, total: 7  }),
      mockDragonPlayer({ rank: 8,  name: '吳軒宇', team: '紅', tag: null,  att: 4, duty: 2, mop: 0, playoff: null, total: 6  }),
      mockDragonPlayer({ rank: 9,  name: '林志柏', team: '黑', tag: null,  att: 4, duty: 2, mop: 0, playoff: null, total: 6  }),
      mockDragonPlayer({ rank: 10, name: '江錒哲', team: '黃', tag: null,  att: 4, duty: 1, mop: 0, playoff: null, total: 5  }),
    ],
    rulesLink: 'https://example.com/rules',
  };
}

/**
 * 含平民線上下球員的龍虎榜（用於驗收金色背景 + 分隔線）
 * threshold = 10：rank 1~2 超過（total=12），rank 3+ 以下（total=9）
 */
export function mockDragonboardWithThreshold(): DragonData {
  return {
    season: 25,
    phase: '賽季進行中',
    civilianThreshold: 10,
    columns: ['出席', '輪值', '拖地', '季後賽'],
    players: [
      mockDragonPlayer({ rank: 1, name: '韋承志', team: '紅', tag: '裁', att: 8, duty: 4, mop: 0, playoff: null, total: 12 }),
      mockDragonPlayer({ rank: 2, name: '吳家豪', team: '綠', tag: null,  att: 6, duty: 5, mop: 0, playoff: null, total: 11 }),
      mockDragonPlayer({ rank: 3, name: '李昊明', team: '黑', tag: null,  att: 5, duty: 4, mop: 0, playoff: null, total: 9  }),
      mockDragonPlayer({ rank: 4, name: '趙尹旋', team: '紅', tag: null,  att: 4, duty: 3, mop: 0, playoff: null, total: 7  }),
      mockDragonPlayer({ rank: 5, name: '李政軒', team: '黑', tag: null,  att: 4, duty: 2, mop: 0, playoff: null, total: 6  }),
    ],
  };
}

/** 空龍虎榜（賽季初，無資料） */
export function mockEmptyDragonboard(): DragonData {
  return {
    season: 25,
    phase: '賽季進行中',
    civilianThreshold: 36,
    columns: ['出席', '輪值', '拖地', '季後賽'],
    players: [],
  };
}

/**
 * 含選秀規則連結的龍虎榜（驗 C3：📋 查看完整選秀規則公告）。
 * threshold 設在中段，平民區 + 奴隸區皆有球員。
 */
export function mockDragonWithRulesLink(): DragonData {
  return {
    season: 25,
    phase: '賽季進行中',
    civilianThreshold: 8,
    columns: ['出席', '輪值', '拖地', '季後賽'],
    players: [
      mockDragonPlayer({ rank: 1, name: '韋承志', team: '紅', tag: '裁', att: 8, duty: 8, mop: 0, total: 16 }),
      mockDragonPlayer({ rank: 2, name: '吳家豪', team: '綠', att: 6, duty: 6, mop: 0, total: 12 }),
      mockDragonPlayer({ rank: 3, name: '李昊明', team: '黑', tag: '裁', att: 8, duty: 3, mop: 1, total: 12 }),
      mockDragonPlayer({ rank: 4, name: '趙尹旋', team: '紅', att: 7, duty: 3, mop: 0, total: 10 }),
      mockDragonPlayer({ rank: 5, name: '李政軒', team: '黑', tag: '裁', att: 8, duty: 1, mop: 0, total: 9 }),
      mockDragonPlayer({ rank: 6, name: '楊承達', team: '黑', att: 4, duty: 3, mop: 0, total: 7 }),
      mockDragonPlayer({ rank: 7, name: '陳鈞銘', team: '黃', att: 5, duty: 2, mop: 0, total: 7 }),
      mockDragonPlayer({ rank: 8, name: '吳軒宇', team: '紅', att: 4, duty: 2, mop: 0, total: 6 }),
      mockDragonPlayer({ rank: 9, name: '林志柏', team: '黑', att: 4, duty: 2, mop: 0, total: 6 }),
      mockDragonPlayer({ rank: 10, name: '江錒哲', team: '黃', att: 4, duty: 1, mop: 0, total: 5 }),
    ],
    rulesLink: 'https://example.com/rules',
  };
}

/**
 * 龍虎榜分組展示（驗 C1：平民區 / 奴隸區 標題 + 完整文案）。
 * threshold = 10：平民區 5 人（rank 1~5 total >= 10），奴隸區 5 人（rank 6~10）。
 */
export function mockDragonGroupingShowcase(): DragonData {
  return {
    season: 25,
    phase: '賽季進行中',
    civilianThreshold: 10,
    columns: ['出席', '輪值', '拖地', '季後賽'],
    players: [
      mockDragonPlayer({ rank: 1, name: '韋承志', team: '紅', tag: '裁', total: 16 }),
      mockDragonPlayer({ rank: 2, name: '吳家豪', team: '綠', total: 14 }),
      mockDragonPlayer({ rank: 3, name: '李昊明', team: '黑', tag: '裁', total: 12 }),
      mockDragonPlayer({ rank: 4, name: '趙尹旋', team: '紅', total: 11 }),
      mockDragonPlayer({ rank: 5, name: '李政軒', team: '黑', tag: '裁', total: 10 }),
      mockDragonPlayer({ rank: 6, name: '楊承達', team: '黑', total: 8 }),
      mockDragonPlayer({ rank: 7, name: '陳鈞銘', team: '黃', total: 7 }),
      mockDragonPlayer({ rank: 8, name: '吳軒宇', team: '紅', total: 6 }),
      mockDragonPlayer({ rank: 9, name: '林志柏', team: '黑', total: 5 }),
      mockDragonPlayer({ rank: 10, name: '江錒哲', team: '黃', total: 4 }),
    ],
    rulesLink: 'https://example.com/rules',
  };
}
