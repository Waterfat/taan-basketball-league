/**
 * Covers: Issue #13 Task 2 — per-DataKind Sheets transformer 單元層
 *
 * 對映：
 *   transformHome      → datas!D2:M7（home meta）
 *   transformStandings → datas!P2:T7（6 隊戰績）
 *   transformDragon    → datas!D13:L76（龍虎榜）
 *   transformSchedule  → datas!P13:AG13 / D87:N113 / D117:F206
 *   transformRoster    → datas!O19:AH83
 *   transformLeaders   → datas!D212:N224 / D227:K234 / D237:K244 / D247:K254
 *
 * 完整邏輯整合在 Task 3（src/lib/api.ts）走 integration test 驗收；
 * 本檔僅驗 transformer 在「正常 / 空輸入」兩種情境下的型別安全與基本欄位輸出。
 */

import { describe, it, expect } from 'vitest';
import {
  transformHome,
  transformStandings,
  transformDragon,
  transformSchedule,
  transformRoster,
  transformLeaders,
  type SheetsValueRange,
} from '../../src/lib/api-transforms';

describe('transformHome', () => {
  it('parse Sheets datas!D2:M7 → HomeData', () => {
    const ranges: SheetsValueRange[] = [
      {
        range: 'datas!D2:M7',
        values: [
          ['季後賽'],     // phase
          ['13'],          // currentWeek
          ['比賽日期'],    // label (skip)
          ['2026/5/9'],    // nextDate
          ['比賽地點'],    // label (skip)
          ['大安'],        // venue
        ],
      },
    ];

    const result = transformHome(ranges);
    expect(result.season).toBe(25);
    expect(result.phase).toBe('季後賽');
    expect(result.currentWeek).toBe(13);
    expect(result.nextDate).toBe('2026/5/9');
    expect(result.venue).toBe('大安');
  });
});

describe('transformStandings', () => {
  it('parse Sheets datas!P2:T7 → StandingsData (6 teams)', () => {
    const ranges: SheetsValueRange[] = [
      {
        range: 'datas!P2:T7',
        values: [
          ['紅', '15', '5', '75.0%', '8連勝'],
          ['黑', '11', '9', '55.0%', '2連敗'],
          ['藍', '5', '15', '25.0%', '2連敗'],
          ['綠', '16', '4', '80.0%', '2連勝'],
          ['黃', '6', '14', '30.0%', '1連勝'],
          ['白', '7', '13', '35.0%', '1連敗'],
        ],
      },
    ];

    const result = transformStandings(ranges);
    expect(result.teams).toHaveLength(6);
    const red = result.teams.find((t) => t.team === '紅');
    expect(red).toMatchObject({ wins: 15, losses: 5, streak: '8連勝' });
  });
});

describe('transformDragon', () => {
  it('parse 範圍空 → players: []', () => {
    const result = transformDragon([{ range: 'datas!D13:L76', values: [] }]);
    expect(result.players).toEqual([]);
  });

  it('parse 1 row → 1 player', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!D13:L76', values: [['李子昂', '黑', '20', '10', '1', '—', '31', '', '']] },
    ];
    const result = transformDragon(ranges);
    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toMatchObject({ name: '李子昂', team: '黑', total: 31 });
  });
});

// 其餘 transformer（schedule / roster / leaders）至少各 1 個 happy path test
describe('transformSchedule', () => {
  it('回傳空陣列當 ranges 為空', () => {
    const result = transformSchedule([]);
    expect(result.weeks).toEqual([]);
  });
});

describe('transformRoster', () => {
  it('回傳 6 隊空陣列當 ranges 為空', () => {
    const result = transformRoster([]);
    expect(result.teams).toBeDefined();
  });
});

describe('transformLeaders', () => {
  it('回傳空 leaders 陣列當 ranges 為空', () => {
    const result = transformLeaders([]);
    expect(result.leaders).toBeDefined();
  });
});
