/**
 * Schedule fixture 工廠
 *
 * 提供測試專用的固定範例資料，含正常情境與邊界情境。
 * 不會打 production Google Sheets，所有測試資料均在此手寫或從快照載入。
 */

export interface Game {
  num: number;
  time: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'finished' | 'upcoming' | 'in_progress';
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

/** 建立單一已完賽場次 */
export function mockFinishedGame(home: string, away: string, homeScore: number, awayScore: number, num = 1, staff = {}): Game {
  return {
    num,
    time: '',
    home,
    away,
    homeScore,
    awayScore,
    status: 'finished',
    staff,
  };
}

/** 建立單一即將進行場次 */
export function mockUpcomingGame(home: string, away: string, num = 1): Game {
  return {
    num,
    time: '',
    home,
    away,
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
    staff: {},
  };
}

/** 建立完整一週 6 場已完賽 */
export function mockGameWeek(week: number, date: string, opts: Partial<GameWeek> = {}): GameWeek {
  const games: Game[] = [
    mockFinishedGame('紅', '白', 34, 22, 1, { 裁判: ['李昊明(黑)', '李政軒(黑)'], 場務: ['林毅豐(黑)'] }),
    mockFinishedGame('黑', '黃', 23, 22, 2),
    mockFinishedGame('綠', '藍', 28, 20, 3),
    mockFinishedGame('白', '黑', 21, 17, 4),
    mockFinishedGame('紅', '藍', 20, 14, 5),
    mockFinishedGame('黃', '綠', 22, 21, 6),
  ];
  return {
    type: 'game',
    week,
    date,
    phase: '例行賽',
    venue: '三重',
    matchups: games.map((g) => ({
      combo: g.num,
      home: g.home,
      away: g.away,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      status: g.status,
    })),
    games,
    ...opts,
  };
}

/** 混合場次：4/6 已完賽，2/6 即將進行 */
export function mockMixedWeek(week: number, date: string): GameWeek {
  const games: Game[] = [
    mockFinishedGame('紅', '白', 34, 22, 1),
    mockFinishedGame('黑', '黃', 23, 22, 2),
    mockFinishedGame('綠', '藍', 28, 20, 3),
    mockFinishedGame('白', '黑', 21, 17, 4),
    mockUpcomingGame('紅', '藍', 5),
    mockUpcomingGame('黃', '綠', 6),
  ];
  return {
    type: 'game',
    week,
    date,
    phase: '例行賽',
    venue: '中正',
    matchups: games.map((g) => ({
      combo: g.num,
      home: g.home,
      away: g.away,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      status: g.status,
    })),
    games,
  };
}

/** 暫停週 */
export function mockSuspendedWeek(date: string, reason: string, venue = '大安'): SuspendedWeek {
  return { type: 'suspended', date, venue, reason };
}

/** 完整 schedule：包含已完賽 + 暫停 + 即將進行 */
export function mockFullSchedule(): ScheduleData {
  return {
    season: 25,
    currentWeek: 5,
    allWeeks: [
      mockGameWeek(1, '2026/1/10', { phase: '熱身賽', venue: '中正' }),
      mockGameWeek(5, '2026/2/7'),
      mockSuspendedWeek('2026/2/14', '過年連假'),
      mockSuspendedWeek('2026/2/21', '過年連假'),
      mockSuspendedWeek('2026/2/28', '228 連假'),
      mockMixedWeek(6, '2026/3/7'),
      {
        type: 'game',
        week: 7,
        date: '2026/3/14',
        phase: '例行賽',
        venue: '中正',
        matchups: [],
        games: [
          mockUpcomingGame('紅', '黑', 1),
          mockUpcomingGame('藍', '綠', 2),
          mockUpcomingGame('黃', '白', 3),
          mockUpcomingGame('紅', '綠', 4),
          mockUpcomingGame('黑', '白', 5),
          mockUpcomingGame('藍', '黃', 6),
        ],
      },
    ],
  };
}

/** 空 schedule（資料源回空陣列）*/
export function mockEmptySchedule(): ScheduleData {
  return { season: 25, currentWeek: 1, allWeeks: [] };
}

/** 第 1 週情境（無前一週） */
export function mockFirstWeekOnly(): ScheduleData {
  return {
    season: 25,
    currentWeek: 1,
    allWeeks: [mockGameWeek(1, '2026/1/10', { phase: '熱身賽' })],
  };
}

/** 該週無資料情境（currentWeek 指向沒有資料的週數） */
export function mockCurrentWeekMissing(): ScheduleData {
  return {
    season: 25,
    currentWeek: 99,
    allWeeks: [mockGameWeek(1, '2026/1/10'), mockGameWeek(2, '2026/1/17')],
  };
}
