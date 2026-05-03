/**
 * Standings fixture 工廠
 *
 * 提供測試專用的固定範例資料，含正常情境與邊界情境。
 * 不會打 production Google Sheets，所有測試資料均在此手寫。
 */

export type StreakType = 'win' | 'lose' | 'none';
export type HistoryResult = 'W' | 'L';

export interface TeamStanding {
  rank: number;
  /** 隊伍全名（例：「綠隊」） */
  name: string;
  /** 隊伍 ID（單字，對應 TEAM_CONFIG key，例：「綠」） */
  team: string;
  wins: number;
  losses: number;
  pct: string;
  history: HistoryResult[];
  streak: string;
  streakType: StreakType;
}

/**
 * 戰績矩陣 cell。
 * - null：自己對自己（對角線）
 * - number：淨勝分（正數 = 該列隊伍勝出多少分；負數 = 該列隊伍輸多少分）
 *   範例：results[紅][黑] = 5 → 紅隊對黑隊累計淨勝 +5 分
 */
export type MatrixCell = number | null;

export interface MatrixData {
  /** 隊伍順序（與 results 行/列順序一致） */
  teams: string[];
  /** 6×6 淨勝分矩陣 */
  results: MatrixCell[][];
}

export interface StandingsData {
  season: number;
  phase: string;
  currentWeek: number;
  teams: TeamStanding[];
  matrix?: MatrixData;
}

/** 建立單一隊伍 standing */
export function mockTeamStanding(overrides: Partial<TeamStanding> = {}): TeamStanding {
  return {
    rank: 1,
    name: '綠隊',
    team: '綠',
    wins: 4,
    losses: 2,
    pct: '66.7%',
    history: ['L', 'W', 'W', 'L', 'W', 'W'],
    streak: '2連勝',
    streakType: 'win',
    ...overrides,
  };
}

/** 完整 6 隊聯盟戰績（與 public/data/standings.json 結構一致，含連勝、連敗、混合） */
export function mockFullStandings(): StandingsData {
  return {
    season: 25,
    phase: '例行賽',
    currentWeek: 5,
    teams: [
      {
        rank: 1, name: '綠隊', team: '綠',
        wins: 4, losses: 2, pct: '66.7%',
        history: ['L', 'W', 'W', 'L', 'W', 'W'],
        streak: '2連勝', streakType: 'win',
      },
      {
        rank: 2, name: '紅隊', team: '紅',
        wins: 4, losses: 2, pct: '66.7%',
        history: ['W', 'L', 'W', 'W', 'W', 'L'],
        streak: '1連敗', streakType: 'lose',
      },
      {
        rank: 3, name: '黑隊', team: '黑',
        wins: 3, losses: 3, pct: '50.0%',
        history: ['L', 'W', 'L', 'W', 'W', 'W'],
        streak: '2連勝', streakType: 'win',
      },
      {
        rank: 4, name: '黃隊', team: '黃',
        wins: 3, losses: 3, pct: '50.0%',
        history: ['W', 'W', 'L', 'L', 'L', 'W'],
        streak: '1連勝', streakType: 'win',
      },
      {
        rank: 5, name: '白隊', team: '白',
        wins: 3, losses: 3, pct: '50.0%',
        history: ['L', 'W', 'W', 'W', 'L', 'L'],
        streak: '2連敗', streakType: 'lose',
      },
      {
        rank: 6, name: '藍隊', team: '藍',
        wins: 1, losses: 5, pct: '16.7%',
        history: ['L', 'L', 'W', 'L', 'L', 'L'],
        streak: '3連敗', streakType: 'lose',
      },
    ],
  };
}

/** 空賽季（賽季尚未開始） */
export function mockEmptyStandings(): StandingsData {
  return {
    season: 25,
    phase: '例行賽',
    currentWeek: 0,
    teams: [],
  };
}

/** 0勝 0敗的隊（剛開賽，pct 應顯示「—」） */
export function mockZeroRecordStandings(): StandingsData {
  return {
    season: 25,
    phase: '例行賽',
    currentWeek: 1,
    teams: Array.from({ length: 6 }, (_, i) => ({
      rank: i + 1,
      name: ['綠隊', '紅隊', '黑隊', '黃隊', '白隊', '藍隊'][i],
      team: ['綠', '紅', '黑', '黃', '白', '藍'][i],
      wins: 0,
      losses: 0,
      pct: '—',
      history: [],
      streak: '',
      streakType: 'none' as StreakType,
    })),
  };
}

/**
 * 標準 6×6 戰績矩陣，含正負淨勝分混合，供 B-3.1 ~ B-3.3 驗收。
 *
 * 設計：
 *   - 對角線 null（自己對自己）
 *   - 各 row 至少含一個正分、一個負分、一個零分（驗顏色 class）
 *   - 數值小到便於肉眼判斷（±10 以內）
 */
export function mockMatrix6x6(): MatrixData {
  return {
    teams: ['紅', '黑', '藍', '綠', '黃', '白'],
    results: [
      // 紅
      [null, 5, 12, -8, 3, -2],
      // 黑
      [-5, null, 7, -10, 4, 6],
      // 藍
      [-12, -7, null, -15, -3, -1],
      // 綠
      [8, 10, 15, null, 6, 9],
      // 黃
      [-3, -4, 3, -6, null, 0],
      // 白
      [2, -6, 1, -9, 0, null],
    ],
  };
}

/**
 * 標準戰績資料 + 完整 matrix（一鍵驗收 B-3.*）
 */
export function mockStandingsWithMatrix(matrixOverride?: MatrixData): StandingsData {
  const base = mockFullStandings();
  return {
    ...base,
    matrix: matrixOverride ?? mockMatrix6x6(),
  };
}

/** 8 隊（未來支援更多隊測試排版） */
export function mockEightTeamStandings(): StandingsData {
  const base = mockFullStandings();
  return {
    ...base,
    teams: [
      ...base.teams,
      mockTeamStanding({ rank: 7, name: '紫隊', team: '紫', pct: '14.3%', wins: 1, losses: 6 }),
      mockTeamStanding({ rank: 8, name: '橙隊', team: '橙', pct: '0.0%', wins: 0, losses: 7 }),
    ],
  };
}
