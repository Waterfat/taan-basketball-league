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
    expect(result.scheduleInfo.date).toBe('2026/5/9');
    expect(result.scheduleInfo.venue).toBe('大安');
  });
});

/**
 * Issue #17 Task 4 擴充：transformHome 完整 composite shape
 *
 * Covers: I-4（B-19）— transformHome 完整 composite（standings + dragonTop10 + miniStats）
 *
 * Multi-range 設計（順序固定，與 SHEETS_RANGES['home'] 對齊）：
 *   ranges[0] = datas!D2:M7（home meta：phase / currentWeek / date / venue）
 *   ranges[1] = datas!P2:T7（standings 6 隊）
 *   ranges[2] = datas!D13:L76（dragon → top 10 切片）
 *   ranges[3] = datas!D212:N224（leaders mini stats，第 0 欄為類別 label：得分 / 籃板 / 助攻）
 */
describe('transformHome (Issue #17)', () => {
  it('composite shape 含 standings + dragonTop10 + miniStats (Covers: I-4)', () => {
    const ranges: SheetsValueRange[] = [
      // [0] home meta
      {
        range: 'datas!D2:M7',
        values: [
          ['例行賽'],
          ['10'],
          ['比賽日期'],
          ['2026/5/9'],
          ['比賽地點'],
          ['大安'],
        ],
      },
      // [1] standings rows
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
      // [2] dragon rows (12 行 → top 10 切片)
      {
        range: 'datas!D13:L76',
        values: Array.from({ length: 12 }, (_, i) => [
          `球員${i + 1}`,
          '紅',
          '5',
          '0',
          '0',
          '—',
          `${30 - i}`,
          '',
          '',
        ]),
      },
      // [3] leaders mini stats（label / name / team / val）
      {
        range: 'datas!D212:N224',
        values: [
          ['平均得分', '王', '紅', '20.5'],
          ['平均籃板', '李', '黑', '12.3'],
          ['平均助攻', '陳', '綠', '8.1'],
        ],
      },
    ];
    const result = transformHome(ranges);
    expect(result.standings).toHaveLength(6);
    expect(result.dragonTop10.length).toBeLessThanOrEqual(10);
    expect(result.dragonTop10.length).toBeGreaterThan(0);
    expect(result.miniStats.pts.players.length).toBeGreaterThan(0);
    expect(result.miniStats.reb.players.length).toBeGreaterThan(0);
    expect(result.miniStats.ast.players.length).toBeGreaterThan(0);
  });

  it('dragonTop10 上限為 10 即使 dragon rows > 10 (Covers: I-4)', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!D2:M7', values: [['例行賽'], ['1']] },
      { range: 'datas!P2:T7', values: [] },
      {
        range: 'datas!D13:L76',
        values: Array.from({ length: 20 }, (_, i) => [
          `P${i}`, '紅', '5', '0', '0', '—', `${20 - i}`, '', '',
        ]),
      },
      { range: 'datas!D212:N224', values: [] },
    ];
    const result = transformHome(ranges);
    expect(result.dragonTop10).toHaveLength(10);
  });

  it('standings 帶出 streakType（連勝/連敗/null）(Covers: I-4)', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!D2:M7', values: [] },
      {
        range: 'datas!P2:T7',
        values: [
          ['紅', '15', '5', '75.0%', '8連勝'],
          ['黑', '11', '9', '55.0%', '2連敗'],
          ['藍', '5', '15', '25.0%', ''],
        ],
      },
      { range: 'datas!D13:L76', values: [] },
      { range: 'datas!D212:N224', values: [] },
    ];
    const result = transformHome(ranges);
    expect(result.standings[0]).toMatchObject({ rank: 1, team: '紅', streakType: 'win' });
    expect(result.standings[1]).toMatchObject({ rank: 2, team: '黑', streakType: 'lose' });
    expect(result.standings[2]).toMatchObject({ rank: 3, team: '藍', streakType: null });
  });
});

describe('transformStandings (Issue #17)', () => {
  it('parse Sheets datas!P2:T7 + datas!D2:M7 → StandingsData with season/phase/currentWeek (Covers: I-1)', () => {
    const ranges: SheetsValueRange[] = [
      // [0] standings rows
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
      // [1] meta range（phase / currentWeek，與 transformHome 共用）
      {
        range: 'datas!D2:M7',
        values: [
          ['季後賽'],
          ['13'],
          ['比賽日期'],
          ['2026/5/9'],
          ['比賽地點'],
          ['大安'],
        ],
      },
    ];

    const result = transformStandings(ranges);
    // meta 欄位
    expect(result.season).toBe(25);
    expect(result.phase).toBe('季後賽');
    expect(result.currentWeek).toBe(13);
    // teams 欄位
    expect(result.teams).toHaveLength(6);
    const red = result.teams.find((t) => t.team === '紅');
    expect(red).toMatchObject({
      rank: 1,
      name: '紅隊',
      team: '紅',
      wins: 15,
      losses: 5,
      pct: '75.0%',
      streak: '8連勝',
      streakType: 'win',
    });
    expect(red?.history).toEqual([]);
    // streakType 衍生：「2連敗」→ 'lose'
    const black = result.teams.find((t) => t.team === '黑');
    expect(black?.streakType).toBe('lose');
  });

  it('meta range 缺失 → season=25, phase="", currentWeek=0 (Covers: I-1)', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!P2:T7', values: [['紅', '0', '0', '0%', '']] },
    ];
    const result = transformStandings(ranges);
    expect(result.season).toBe(25);
    expect(result.phase).toBe('');
    expect(result.currentWeek).toBe(0);
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].streakType).toBe('none');
  });
});

describe('transformDragon', () => {
  it('parse 範圍空 → players: []', () => {
    const result = transformDragon([{ range: 'datas!D13:L76', values: [] }]);
    expect(result.players).toEqual([]);
  });

  it('parse 1 row → 1 player', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!D13:L76', values: [['1', '李子昂(黑', '20', '10', '1', '—', '31', '', '']] },
    ];
    const result = transformDragon(ranges);
    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toMatchObject({ name: '李子昂', team: '黑', total: 31 });
  });
});

/**
 * Issue #17 Task 2 擴充：transformDragon 補完 season / phase + civilianThreshold 從 Sheets 動態讀取
 *
 * Covers: I-2（B-6, B-7）— transformDragon 含 season + civilianThreshold 從 Sheets 取得
 *
 * Multi-range 設計：
 *   ranges[0] = datas!D13:L76（players）
 *   ranges[1] = datas!D2:M7（meta：phase / season）
 *   ranges[2] = threshold cell（civilianThreshold；缺失 → fallback 36）
 */
describe('transformDragon (Issue #17)', () => {
  it('multi-range → DragonData with season/phase/civilianThreshold from Sheets (Covers: I-2)', () => {
    const ranges: SheetsValueRange[] = [
      {
        range: 'datas!D13:L76',
        values: [
          ['1', '李子昂(黑', '20', '10', '1', '—', '31', '', ''],
          ['2', '吳家豪(綠', '6', '6', '0', '—', '12', '', ''],
        ],
      },
      { range: 'datas!D2:M7', values: [['例行賽'], ['10']] },
      { range: 'datas!<threshold>', values: [['10']] },
    ];
    const result = transformDragon(ranges);
    expect(result.season).toBe(25);
    expect(result.phase).toBe('例行賽');
    expect(result.civilianThreshold).toBe(10);
    expect(result.players).toHaveLength(2);
    expect(result.players[0]).toMatchObject({ rank: 1, name: '李子昂', total: 31 });
    expect(result.players[1]).toMatchObject({ rank: 2, name: '吳家豪', total: 12 });
  });

  it('threshold cell 缺失 → civilianThreshold 沿用預設 36（向後相容）(Covers: I-2)', () => {
    const ranges: SheetsValueRange[] = [
      { range: 'datas!D13:L76', values: [['1', '李(黑', '5', '0', '0', '—', '5', '', '']] },
    ];
    const result = transformDragon(ranges);
    expect(result.civilianThreshold).toBe(36);
  });
});

describe('transformSchedule (Issue #17)', () => {
  it('zip dates + allSchedule + allMatchups → weeks[] (Covers: I-5)', () => {
    const ranges: SheetsValueRange[] = [
      // [0] dates: 一橫列，每欄一週日期
      { range: 'datas!P13:AG13', values: [['2026/5/2', '2026/5/9', '2026/5/16']] },
      // [1] allSchedule: 每週 GAMES_PER_WEEK=3 列，每列一場比賽
      // 欄位：num / time / home / away / homeScore / awayScore / status / staff...
      {
        range: 'datas!D87:N113',
        values: [
          ['1', '14:00', '紅', '黑', '88', '77', 'finished', ''],
          ['2', '15:00', '綠', '藍', '90', '80', 'finished', ''],
          ['3', '16:00', '黃', '白', '70', '75', 'finished', ''],
          ['1', '14:00', '紅', '綠', '', '', 'upcoming', ''],
          ['2', '15:00', '黑', '黃', '', '', 'upcoming', ''],
          ['3', '16:00', '藍', '白', '', '', 'upcoming', ''],
        ],
      },
      // [2] allMatchups: combo / home / away
      {
        range: 'datas!D117:F206',
        values: [
          ['1', '紅', '黑'],
          ['2', '綠', '藍'],
          ['3', '黃', '白'],
          ['1', '紅', '綠'],
          ['2', '黑', '黃'],
          ['3', '藍', '白'],
        ],
      },
    ];
    const result = transformSchedule(ranges);
    // 兩週有比賽（dates 第三欄無對應 schedule rows，跳過）
    expect(result.allWeeks).toHaveLength(2);
    const w1 = result.allWeeks[0];
    expect(w1.type).toBe('game');
    if (w1.type === 'game') {
      expect(w1.week).toBe(1);
      expect(w1.date).toBe('2026/5/2');
      expect(w1.games).toHaveLength(3);
      expect(w1.games[0]).toMatchObject({
        num: 1,
        time: '14:00',
        home: '紅',
        away: '黑',
        homeScore: 88,
        awayScore: 77,
        status: 'finished',
      });
      expect(w1.matchups).toHaveLength(3);
      expect(w1.matchups[0]).toMatchObject({ combo: 1, home: '紅', away: '黑' });
    }
    // currentWeek：第一個含 upcoming 的週 = w2 → currentWeek = 2
    expect(result.currentWeek).toBe(2);
    // weeks Record 對應 allWeeks
    expect(result.weeks).toBeDefined();
    expect(result.weeks?.['1']?.date).toBe('2026/5/2');
    expect(result.weeks?.['2']?.date).toBe('2026/5/9');
  });

  it('ranges 為空 → allWeeks: [] (Covers: I-5)', () => {
    const result = transformSchedule([]);
    expect(result.allWeeks).toEqual([]);
    expect(result.weeks).toEqual({});
  });
});

describe('transformRoster (Issue #17)', () => {
  it('ranges 為空 → weeks: [], teams: [] (Covers: I-3)', () => {
    const result = transformRoster([]);
    expect(result.weeks).toEqual([]);
    expect(result.teams).toEqual([]);
  });

  it('6-team 切分 + att 陣列 (Covers: I-3)', () => {
    // datas!O19:AH83 結構（GAS handleRoster）：
    //   header：球員姓名 / 隊伍 / 隊伍ID / 第1週... 第N週
    //   rows：每列一個球員，前 3 欄為 name/teamName/teamId，第 4 欄起為 att 值
    // GAS 已展平為「flat row」格式（無分隊 block 起始列），靠 row[2] teamId 分組
    const headerRow = [
      '球員姓名', '隊伍', '隊伍ID',
      '第1週 1/10', '第2週 1/17', '第3週 1/24', '第4週 1/31', '第5週 2/7',
    ];
    const rows = [
      headerRow,
      ['韋承志', '紅隊', 'red',   '1', '1', '0', 'x', '?'],
      ['吳軒宇', '紅隊', 'red',   '1', '0', '1', '1', '1'],
      ['李昊明', '黑隊', 'black', '1', '1', '1', '1', '1'],
      ['李政軒', '黑隊', 'black', '0', '1', '1', '1', '1'],
      ['藍球員', '藍隊', 'blue',  '1', '1', '1', '1', '1'],
      ['綠球員', '綠隊', 'green', '1', '1', '1', '1', '1'],
      ['黃球員', '黃隊', 'yellow','1', '1', '1', '1', '1'],
      ['白球員', '白隊', 'white', '1', '1', '1', '1', '1'],
    ];

    const ranges: SheetsValueRange[] = [
      { range: 'datas!O19:AH83', values: rows },
    ];
    const result = transformRoster(ranges);

    // weeks 從 header 第 4 欄起解析
    expect(result.weeks).toHaveLength(5);
    expect(result.weeks[0]).toMatchObject({ wk: 1, label: '第1週', date: '1/10' });
    expect(result.weeks[4]).toMatchObject({ wk: 5, label: '第5週', date: '2/7' });

    // 6 隊
    expect(result.teams).toHaveLength(6);

    // 隊伍順序維持讀入順序
    const ids = result.teams.map((t) => t.id);
    expect(ids).toEqual(['red', 'black', 'blue', 'green', 'yellow', 'white']);

    // 紅隊 2 球員
    const red = result.teams.find((t) => t.id === 'red');
    expect(red?.name).toBe('紅隊');
    expect(red?.players).toHaveLength(2);
    expect(red?.players[0].name).toBe('韋承志');
    expect(red?.players[0].att).toEqual([1, 1, 0, 'x', '?']);
    expect(red?.players[1].att).toEqual([1, 0, 1, 1, 1]);

    // 黑隊 2 球員
    const black = result.teams.find((t) => t.id === 'black');
    expect(black?.players).toHaveLength(2);
    expect(black?.players[1].att).toEqual([0, 1, 1, 1, 1]);
  });

  it('att 空格解析為 "?" (Covers: I-3)', () => {
    const ranges: SheetsValueRange[] = [
      {
        range: 'datas!O19:AH83',
        values: [
          ['球員姓名', '隊伍', '隊伍ID', '第1週 1/10', '第2週 1/17'],
          ['測試員', '紅隊', 'red', '', ''],
        ],
      },
    ];
    const result = transformRoster(ranges);
    expect(result.teams[0].players[0].att).toEqual(['?', '?']);
  });
});

describe('transformLeaders (Issue #17)', () => {
  it('4-block 解析個人 + offense / defense / net (Covers: I-6)', () => {
    const ranges: SheetsValueRange[] = [
      // leadersTable: 個人類別表，cols: [類別 / name / team / val / p2 / p3 / ft / off / def]
      {
        range: 'datas!D212:N224',
        values: [
          ['平均得分', '王', '紅', '20.5'],
          ['平均得分', '李', '黑', '18.2'],
          ['平均籃板', '陳', '綠', '12.3'],
          ['平均助攻', '林', '黃', '8.1'],
        ],
      },
      // teamOffense: 6 隊
      {
        range: 'datas!D227:K234',
        values: [
          ['隊伍', '得分', '助攻', '失誤'],
          ['紅', '88.5', '20.1', '12.3'],
          ['黑', '85.0', '18.5', '13.0'],
          ['藍', '78.2', '15.0', '14.5'],
          ['綠', '90.1', '22.3', '10.8'],
          ['黃', '80.0', '17.0', '13.5'],
          ['白', '82.5', '19.0', '12.0'],
        ],
      },
      // teamDefense: 6 隊
      {
        range: 'datas!D237:K244',
        values: [
          ['隊伍', '失分', '抄截', '阻攻'],
          ['紅', '75.0', '8.5', '4.0'],
          ['黑', '78.0', '7.0', '3.5'],
          ['藍', '85.0', '6.0', '2.0'],
          ['綠', '72.5', '9.0', '4.5'],
          ['黃', '80.0', '7.5', '3.0'],
          ['白', '79.5', '8.0', '3.8'],
        ],
      },
      // teamNet: 6 隊
      {
        range: 'datas!D247:K254',
        values: [
          ['隊伍', '淨勝分'],
          ['紅', '13.5'],
          ['黑', '7.0'],
          ['藍', '-6.8'],
          ['綠', '17.6'],
          ['黃', '0.0'],
          ['白', '3.0'],
        ],
      },
    ];
    const result = transformLeaders(ranges);
    const season = result['25'];
    expect(season).toBeDefined();
    expect(season.scoring.length).toBeGreaterThan(0);
    expect(season.scoring[0]).toMatchObject({ name: '王', team: '紅', val: 20.5 });
    expect(season.rebound[0]).toMatchObject({ name: '陳' });
    expect(season.assist[0]).toMatchObject({ name: '林' });
    expect(season.offense?.rows).toHaveLength(6);
    expect(season.defense?.rows).toHaveLength(6);
    expect(season.net?.rows).toHaveLength(6);
  });

  it('ranges 為空 → 回 {} (Covers: I-6)', () => {
    const result = transformLeaders([]);
    expect(result).toEqual({});
  });
});
