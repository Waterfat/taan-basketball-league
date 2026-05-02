import type {
  BoxscorePlayer,
  BoxscoreTotals,
  BoxscoreTeam,
  BoxscoreGame,
  BoxscoreWeek,
  TeamId,
} from '../types/boxscore';

const TEAM_IDS: TeamId[] = ['紅', '黑', '藍', '綠', '黃', '白'];
const ROWS_PER_GAME = 22;

function isTeamId(value: string): value is TeamId {
  return (TEAM_IDS as string[]).includes(value);
}

function toNum(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parsePlayerRow(row: string[]): BoxscorePlayer | null {
  const name = (row[0] ?? '').trim();
  if (!name) return null;
  if (name === '合計') return null;

  // DNP：名字存在但完全沒上場（所有數值為 0 或空）
  const cells = row.slice(1, 13);
  const allEmpty = cells.every((c) => !c || c.trim() === '' || c.trim() === '0');
  const dnp = allEmpty;

  return {
    name,
    pts: toNum(row[1]),
    fg2: toNum(row[2]),
    fg3: toNum(row[3]),
    ft: toNum(row[4]),
    oreb: toNum(row[5]),
    dreb: toNum(row[6]),
    treb: toNum(row[7]),
    ast: toNum(row[8]),
    stl: toNum(row[9]),
    blk: toNum(row[10]),
    tov: toNum(row[11]),
    pf: toNum(row[12]),
    dnp,
  };
}

/**
 * 排除 DNP 球員後加總
 * Covers U-2 / I-3 / B-12
 */
export function computeTeamTotals(players: BoxscorePlayer[]): BoxscoreTotals {
  const active = players.filter((p) => !p.dnp);
  const sum = (key: keyof BoxscoreTotals): number =>
    active.reduce((acc, p) => acc + (p[key] as number), 0);
  return {
    pts: sum('pts'),
    fg2: sum('fg2'),
    fg3: sum('fg3'),
    ft: sum('ft'),
    oreb: sum('oreb'),
    dreb: sum('dreb'),
    treb: sum('treb'),
    ast: sum('ast'),
    stl: sum('stl'),
    blk: sum('blk'),
    tov: sum('tov'),
    pf: sum('pf'),
  };
}

function parseTitleRow(row: string[]): { week: number; game: number; homeTeam: TeamId; homeScore: number; awayScore: number; awayTeam: TeamId } | null {
  const titleCell = (row[0] ?? '').trim(); // 例：「第5週 第1場」
  const m = titleCell.match(/第(\d+)週\s*第(\d+)場/);
  if (!m) return null;
  const week = Number(m[1]);
  const game = Number(m[2]);

  const homeTeamCell = (row[1] ?? '').trim();
  const awayTeamCell = (row[5] ?? '').trim();
  if (!isTeamId(homeTeamCell) || !isTeamId(awayTeamCell)) return null;

  return {
    week,
    game,
    homeTeam: homeTeamCell,
    homeScore: toNum(row[2]),
    awayScore: toNum(row[4]),
    awayTeam: awayTeamCell,
  };
}

function parseStaffRow(row: string[]): Record<string, string[]> {
  const text = (row[0] ?? '').trim();
  if (!text) return {};
  const result: Record<string, string[]> = {};
  for (const part of text.split('|')) {
    const m = part.match(/^\s*([^:：]+)[:：]\s*(.+)\s*$/);
    if (!m) continue;
    const role = m[1].trim();
    const names = m[2].split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
    if (names.length > 0) result[role] = names;
  }
  return result;
}

function parseGameChunk(rows: string[][]): BoxscoreGame | null {
  if (rows.length < ROWS_PER_GAME) return null;

  const title = parseTitleRow(rows[0]);
  if (!title) return null;

  // Home: rows[2..9]（8 列球員）
  const homePlayers: BoxscorePlayer[] = [];
  for (let i = 2; i <= 9; i++) {
    const p = parsePlayerRow(rows[i]);
    if (p) homePlayers.push(p);
  }

  // Away: rows[12..19]
  const awayPlayers: BoxscorePlayer[] = [];
  for (let i = 12; i <= 19; i++) {
    const p = parsePlayerRow(rows[i]);
    if (p) awayPlayers.push(p);
  }

  const home: BoxscoreTeam = {
    team: title.homeTeam,
    score: title.homeScore,
    players: homePlayers,
    totals: computeTeamTotals(homePlayers),
  };
  const away: BoxscoreTeam = {
    team: title.awayTeam,
    score: title.awayScore,
    players: awayPlayers,
    totals: computeTeamTotals(awayPlayers),
  };

  return {
    week: title.week,
    game: title.game,
    home,
    away,
    staff: parseStaffRow(rows[21]),
  };
}

/**
 * 從 Sheets API values（22 行/場）解析回 BoxscoreWeek[]
 * 沿用舊專案 js/page-boxscore.js 邏輯
 *
 * Covers U-1, I-1~I-4
 */
export function transformBoxscore(rows: string[][]): BoxscoreWeek[] {
  if (!Array.isArray(rows) || rows.length < ROWS_PER_GAME) return [];

  const weekMap = new Map<number, BoxscoreGame[]>();

  for (let i = 0; i + ROWS_PER_GAME <= rows.length; i += ROWS_PER_GAME) {
    const chunk = rows.slice(i, i + ROWS_PER_GAME);
    const game = parseGameChunk(chunk);
    if (!game) continue;
    const list = weekMap.get(game.week) ?? [];
    list.push(game);
    weekMap.set(game.week, list);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, games]) => ({
      week,
      games: games.sort((a, b) => a.game - b.game),
    }));
}
