import { describe, it, expect } from 'vitest';
import { transformBoxscore, computeTeamTotals } from '../../src/lib/boxscore-utils';
import {
  mockBoxscorePlayer,
  mockDnpPlayer,
  mockBoxscoreGame,
  mockBoxscoreWeek,
  mockRawBoxscoreSheetsResponse,
} from '../fixtures/boxscore';

describe('transformBoxscore', () => {
  // Covers: U-1
  it('U-1a: 22 行/場偏移正確（單場）→ 解析出 home/away 雙隊', () => {
    const game = mockBoxscoreGame(5, 1, { homeTeam: '紅', awayTeam: '白', homeScore: 34, awayScore: 22 });
    const raw = mockRawBoxscoreSheetsResponse([game]);

    const weeks = transformBoxscore(raw.values);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].week).toBe(5);
    expect(weeks[0].games).toHaveLength(1);
    expect(weeks[0].games[0].home.team).toBe('紅');
    expect(weeks[0].games[0].away.team).toBe('白');
    expect(weeks[0].games[0].home.score).toBe(34);
    expect(weeks[0].games[0].away.score).toBe(22);
  });

  // Covers: U-1
  it('U-1b: 多場（同週 6 場）依 22 行 chunking 解析全部', () => {
    const week = mockBoxscoreWeek(5);
    const raw = mockRawBoxscoreSheetsResponse(week.games);

    const weeks = transformBoxscore(raw.values);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].games).toHaveLength(6);
    expect(weeks[0].games.map((g) => g.game).sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  // Covers: U-1
  it('U-1c: 跨週合併（W1 + W5 兩週）→ 依 week 分組', () => {
    const w1 = mockBoxscoreWeek(1);
    const w5 = mockBoxscoreWeek(5);
    const raw = mockRawBoxscoreSheetsResponse([...w1.games, ...w5.games]);

    const weeks = transformBoxscore(raw.values);
    expect(weeks).toHaveLength(2);
    const found1 = weeks.find((w) => w.week === 1);
    const found5 = weeks.find((w) => w.week === 5);
    expect(found1?.games).toHaveLength(6);
    expect(found5?.games).toHaveLength(6);
  });

  // Covers: U-1
  it('U-1d: 空列陣 → 空 weeks', () => {
    expect(transformBoxscore([])).toEqual([]);
  });

  // Covers: U-1
  it('U-1e: 不足 22 行的尾段（殘缺）→ 略過不報錯', () => {
    const game = mockBoxscoreGame(1, 1);
    const raw = mockRawBoxscoreSheetsResponse([game]);
    const truncated = raw.values.slice(0, 10); // 半場資料
    expect(() => transformBoxscore(truncated)).not.toThrow();
    expect(transformBoxscore(truncated)).toEqual([]);
  });
});

describe('computeTeamTotals', () => {
  // Covers: U-2
  it('U-2a: 純出賽球員 → 加總所有欄位', () => {
    const players = [
      mockBoxscorePlayer('A', { pts: 10, ast: 3, treb: 5 }),
      mockBoxscorePlayer('B', { pts: 8, ast: 2, treb: 4 }),
    ];
    const totals = computeTeamTotals(players);
    expect(totals.pts).toBe(18);
    expect(totals.ast).toBe(5);
    expect(totals.treb).toBe(9);
  });

  // Covers: U-2
  it('U-2b: 含 DNP 球員 → DNP 不計入合計', () => {
    const players = [
      mockBoxscorePlayer('A', { pts: 10 }),
      mockDnpPlayer('B'), // pts:0 dnp:true
      mockBoxscorePlayer('C', { pts: 5 }),
    ];
    const totals = computeTeamTotals(players);
    expect(totals.pts).toBe(15);
  });

  // Covers: U-2
  it('U-2c: 全 DNP → 合計全 0', () => {
    const players = [mockDnpPlayer('A'), mockDnpPlayer('B')];
    const totals = computeTeamTotals(players);
    expect(totals.pts).toBe(0);
    expect(totals.fg2).toBe(0);
    expect(totals.fg3).toBe(0);
    expect(totals.ast).toBe(0);
  });

  // Covers: U-2
  it('U-2d: 空陣列 → 全 0 totals', () => {
    const totals = computeTeamTotals([]);
    expect(totals.pts).toBe(0);
    expect(totals.treb).toBe(0);
  });
});
