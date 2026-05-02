/**
 * Boxscore fixture 工廠
 *
 * 模擬 Google Sheets API 直打 boxscore tab 後解析得到的結構，
 * 與 leaders（GAS handleStats）回應，供 unit / integration / e2e 三層共用。
 *
 * 產生兩種形式：
 *   - rawBoxscoreRows：Sheets API values.get 的原始 22 行/場格式
 *   - parsedBoxscoreWeek：transformBoxscore 解析後的結構化資料
 */

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
  dnp: boolean;
}

export interface BoxscoreTeam {
  team: TeamId;
  score: number;
  players: BoxscorePlayer[];
  totals: Omit<BoxscorePlayer, 'name' | 'dnp'>;
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

/** 建單一球員（出賽） */
export function mockBoxscorePlayer(name: string, opts: Partial<BoxscorePlayer> = {}): BoxscorePlayer {
  return {
    name,
    pts: opts.pts ?? 6,
    fg2: opts.fg2 ?? 2,
    fg3: opts.fg3 ?? 1,
    ft: opts.ft ?? 1,
    oreb: opts.oreb ?? 1,
    dreb: opts.dreb ?? 2,
    treb: opts.treb ?? (opts.oreb ?? 1) + (opts.dreb ?? 2),
    ast: opts.ast ?? 1,
    stl: opts.stl ?? 1,
    blk: opts.blk ?? 0,
    tov: opts.tov ?? 1,
    pf: opts.pf ?? 1,
    dnp: false,
  };
}

/** 建單一 DNP（未出賽）球員 */
export function mockDnpPlayer(name: string): BoxscorePlayer {
  return {
    name,
    pts: 0, fg2: 0, fg3: 0, ft: 0,
    oreb: 0, dreb: 0, treb: 0,
    ast: 0, stl: 0, blk: 0, tov: 0, pf: 0,
    dnp: true,
  };
}

/** 計算合計（排除 DNP） */
function computeTotals(players: BoxscorePlayer[]): BoxscoreTeam['totals'] {
  const active = players.filter((p) => !p.dnp);
  return {
    pts: active.reduce((s, p) => s + p.pts, 0),
    fg2: active.reduce((s, p) => s + p.fg2, 0),
    fg3: active.reduce((s, p) => s + p.fg3, 0),
    ft: active.reduce((s, p) => s + p.ft, 0),
    oreb: active.reduce((s, p) => s + p.oreb, 0),
    dreb: active.reduce((s, p) => s + p.dreb, 0),
    treb: active.reduce((s, p) => s + p.treb, 0),
    ast: active.reduce((s, p) => s + p.ast, 0),
    stl: active.reduce((s, p) => s + p.stl, 0),
    blk: active.reduce((s, p) => s + p.blk, 0),
    tov: active.reduce((s, p) => s + p.tov, 0),
    pf: active.reduce((s, p) => s + p.pf, 0),
  };
}

/** 建單隊：5 出賽 + 1 DNP */
export function mockBoxscoreTeam(team: TeamId, score: number, opts: { withDnp?: boolean } = {}): BoxscoreTeam {
  const players: BoxscorePlayer[] = [
    mockBoxscorePlayer(`${team}1`, { pts: Math.round(score * 0.4) }),
    mockBoxscorePlayer(`${team}2`, { pts: Math.round(score * 0.25) }),
    mockBoxscorePlayer(`${team}3`, { pts: Math.round(score * 0.2) }),
    mockBoxscorePlayer(`${team}4`, { pts: Math.round(score * 0.1) }),
    mockBoxscorePlayer(`${team}5`, { pts: Math.round(score * 0.05) }),
  ];
  if (opts.withDnp) {
    players.push(mockDnpPlayer(`${team}6`));
  }
  return {
    team,
    score,
    players,
    totals: computeTotals(players),
  };
}

/** 建單場（紅 vs 白） */
export function mockBoxscoreGame(week: number, game: number, opts: Partial<{ homeTeam: TeamId; awayTeam: TeamId; homeScore: number; awayScore: number; withDnp: boolean; withStaff: boolean }> = {}): BoxscoreGame {
  const homeTeam = opts.homeTeam ?? '紅';
  const awayTeam = opts.awayTeam ?? '白';
  return {
    week,
    game,
    home: mockBoxscoreTeam(homeTeam, opts.homeScore ?? 34, { withDnp: opts.withDnp }),
    away: mockBoxscoreTeam(awayTeam, opts.awayScore ?? 22, { withDnp: opts.withDnp }),
    staff: opts.withStaff
      ? { 裁判: ['李昊明(黑)', '李政軒(黑)'], 場務: ['林毅豐(黑)'] }
      : {},
  };
}

/** 建一週 6 場 */
export function mockBoxscoreWeek(week: number): BoxscoreWeek {
  return {
    week,
    games: [
      mockBoxscoreGame(week, 1, { homeTeam: '紅', awayTeam: '白', homeScore: 34, awayScore: 22, withDnp: true, withStaff: true }),
      mockBoxscoreGame(week, 2, { homeTeam: '黑', awayTeam: '黃', homeScore: 23, awayScore: 22 }),
      mockBoxscoreGame(week, 3, { homeTeam: '綠', awayTeam: '藍', homeScore: 28, awayScore: 20 }),
      mockBoxscoreGame(week, 4, { homeTeam: '白', awayTeam: '黑', homeScore: 21, awayScore: 17 }),
      mockBoxscoreGame(week, 5, { homeTeam: '紅', awayTeam: '藍', homeScore: 20, awayScore: 14 }),
      mockBoxscoreGame(week, 6, { homeTeam: '黃', awayTeam: '綠', homeScore: 22, awayScore: 21 }),
    ],
  };
}

/** 建完整 boxscore 資料（多週） */
export function mockFullBoxscore(): BoxscoreData {
  return {
    season: 25,
    currentWeek: 5,
    weeks: [
      mockBoxscoreWeek(1),
      mockBoxscoreWeek(5),
      mockBoxscoreWeek(6),
    ],
  };
}

/** 空 boxscore（賽季初） */
export function mockEmptyBoxscore(): BoxscoreData {
  return { season: 25, currentWeek: 1, weeks: [] };
}

/** 該週缺資料：currentWeek=99 但 weeks 只有 W1, W2 */
export function mockBoxscoreWithMissingWeek(): BoxscoreData {
  return {
    season: 25,
    currentWeek: 99,
    weeks: [mockBoxscoreWeek(1), mockBoxscoreWeek(2)],
  };
}

/**
 * 建構原始 Sheets API 回應（22 行/場 raw 格式）
 *
 * 每場 22 行：
 *   Row 0:  標題列（"第N週 第M場 紅 vs 白" + 比分）
 *   Row 1:  紅隊 header（"姓名 | 得分 | 2P | 3P | FT | OREB | DREB | TREB | AST | STL | BLK | TOV | PF" 等）
 *   Row 2~9: 紅隊球員 8 名
 *   Row 10: 紅隊合計
 *   Row 11: 白隊 header
 *   Row 12~19: 白隊球員 8 名
 *   Row 20: 白隊合計
 *   Row 21: 工作人員列（"裁判: ... | 場務: ..."）
 */
export function mockRawBoxscoreRows(game: BoxscoreGame): string[][] {
  const rows: string[][] = [];

  // Row 0: 標題列
  rows.push([
    `第${game.week}週 第${game.game}場`,
    game.home.team,
    String(game.home.score),
    'vs',
    String(game.away.score),
    game.away.team,
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
  ]);

  // 紅隊（home）
  rows.push(['name', 'pts', 'fg2', 'fg3', 'ft', 'oreb', 'dreb', 'treb', 'ast', 'stl', 'blk', 'tov', 'pf', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  for (let i = 0; i < 8; i++) {
    const p = game.home.players[i];
    if (p) {
      rows.push([
        p.name, String(p.pts), String(p.fg2), String(p.fg3), String(p.ft),
        String(p.oreb), String(p.dreb), String(p.treb),
        String(p.ast), String(p.stl), String(p.blk), String(p.tov), String(p.pf),
        ...new Array(28).fill(''),
      ]);
    } else {
      rows.push(new Array(41).fill(''));
    }
  }
  // 紅隊合計
  rows.push([
    '合計', String(game.home.totals.pts), String(game.home.totals.fg2), String(game.home.totals.fg3), String(game.home.totals.ft),
    String(game.home.totals.oreb), String(game.home.totals.dreb), String(game.home.totals.treb),
    String(game.home.totals.ast), String(game.home.totals.stl), String(game.home.totals.blk), String(game.home.totals.tov), String(game.home.totals.pf),
    ...new Array(28).fill(''),
  ]);

  // 白隊（away）
  rows.push(['name', 'pts', 'fg2', 'fg3', 'ft', 'oreb', 'dreb', 'treb', 'ast', 'stl', 'blk', 'tov', 'pf', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  for (let i = 0; i < 8; i++) {
    const p = game.away.players[i];
    if (p) {
      rows.push([
        p.name, String(p.pts), String(p.fg2), String(p.fg3), String(p.ft),
        String(p.oreb), String(p.dreb), String(p.treb),
        String(p.ast), String(p.stl), String(p.blk), String(p.tov), String(p.pf),
        ...new Array(28).fill(''),
      ]);
    } else {
      rows.push(new Array(41).fill(''));
    }
  }
  // 白隊合計
  rows.push([
    '合計', String(game.away.totals.pts), String(game.away.totals.fg2), String(game.away.totals.fg3), String(game.away.totals.ft),
    String(game.away.totals.oreb), String(game.away.totals.dreb), String(game.away.totals.treb),
    String(game.away.totals.ast), String(game.away.totals.stl), String(game.away.totals.blk), String(game.away.totals.tov), String(game.away.totals.pf),
    ...new Array(28).fill(''),
  ]);

  // 工作人員列
  const staffStr = Object.entries(game.staff)
    .map(([role, names]) => `${role}: ${names.join(', ')}`)
    .join(' | ');
  rows.push([staffStr, ...new Array(40).fill('')]);

  return rows;
}

/** 把多場合併成完整的 Sheets values 陣列（每 22 行一場） */
export function mockRawBoxscoreSheetsResponse(games: BoxscoreGame[]): { values: string[][] } {
  const values: string[][] = [];
  for (const game of games) {
    const rows = mockRawBoxscoreRows(game);
    values.push(...rows);
  }
  return { values };
}
