/**
 * Roster fixture 工廠
 *
 * 模擬 public/data/roster.json 結構：
 *   - weeks：10 週日期標籤
 *   - teams：6 隊，每隊含球員列表與 att（出席）陣列
 *   att 值：1（出席）| 0（缺席）| "x"（公假/輪值）| "?"（未記錄）
 */

export type AttValue = 1 | 0 | 'x' | '?';

export interface RosterWeek {
  wk: number;
  label: string;
  date: string;
}

export interface RosterPlayer {
  name: string;
  att: AttValue[];
  /** tag："裁"（裁判資格）| null */
  tag?: string | null;
}

export interface RosterTeam {
  id: string;
  name: string;
  players: RosterPlayer[];
}

export interface RosterData {
  weeks: RosterWeek[];
  teams: RosterTeam[];
}

/** 標準 10 週標籤 */
export function mockRosterWeeks(): RosterWeek[] {
  return [
    { wk: 1,  label: '第1週',  date: '1/10' },
    { wk: 2,  label: '第2週',  date: '1/17' },
    { wk: 3,  label: '第3週',  date: '1/24' },
    { wk: 4,  label: '第4週',  date: '1/31' },
    { wk: 5,  label: '第5週',  date: '2/7'  },
    { wk: 6,  label: '第6週',  date: '2/14' },
    { wk: 7,  label: '第7週',  date: '2/21' },
    { wk: 8,  label: '第8週',  date: '2/28' },
    { wk: 9,  label: '第9週',  date: '3/7'  },
    { wk: 10, label: '第10週', date: '3/14' },
  ];
}

/** 建立單一球員 */
export function mockRosterPlayer(name: string, att: AttValue[] = [1,1,1,1,1,1,'?','?','?','?'], tag: string | null = null): RosterPlayer {
  return { name, att, tag };
}

/** 建立單隊（5球員）*/
export function mockRosterTeam(id: string, name: string, overrides: Partial<RosterTeam> = {}): RosterTeam {
  return {
    id,
    name,
    players: [
      mockRosterPlayer(`${name}球員1`),
      mockRosterPlayer(`${name}球員2`, [1,0,1,1,1,1,'?','?','?','?']),
      mockRosterPlayer(`${name}球員3`, [1,1,0,1,1,1,'?','?','?','?']),
      mockRosterPlayer(`${name}球員4`, [0,1,1,1,0,0,'?','?','?','?']),
      mockRosterPlayer(`${name}球員5`, [1,1,1,0,1,1,'?','?','?','?']),
    ],
    ...overrides,
  };
}

/** 完整 roster：6 隊，含各種 att 值（1/0/x/?），一名球員含 tag="裁" */
export function mockFullRoster(): RosterData {
  return {
    weeks: mockRosterWeeks(),
    teams: [
      {
        id: 'red', name: '紅隊',
        players: [
          mockRosterPlayer('韋承志', [1,1,1,1,1,1,'?','?','?','?'], '裁'),
          mockRosterPlayer('吳軒宇', [1,0,1,1,1,1,'?','?','?','?']),
          mockRosterPlayer('趙尹旋', [1,1,0,1,1,1,'?','?','?','?']),
          mockRosterPlayer('周昱丞', [1,1,1,0,0,0,'?','?','?','?']),
          mockRosterPlayer('蔡一聲', [0,1,1,1,0,'x','?','?','?','?']),
        ],
      },
      {
        id: 'black', name: '黑隊',
        players: [
          mockRosterPlayer('李昊明', [1,1,1,1,1,1,'?','?','?','?'], '裁'),
          mockRosterPlayer('李政軒', [1,1,1,1,1,1,'?','?','?','?']),
          mockRosterPlayer('楊承達', [1,0,1,1,0,1,'?','?','?','?']),
          mockRosterPlayer('林毅豐', [1,1,1,0,1,1,'?','?','?','?']),
          mockRosterPlayer('喻柏淵', [1,1,0,1,1,1,'?','?','?','?']),
        ],
      },
      mockRosterTeam('blue', '藍隊'),
      mockRosterTeam('green', '綠隊'),
      mockRosterTeam('yellow', '黃隊'),
      mockRosterTeam('white', '白隊'),
    ],
  };
}

/** 空 roster（賽季尚未開始） */
export function mockEmptyRoster(): RosterData {
  return {
    weeks: mockRosterWeeks(),
    teams: [],
  };
}

/** 所有 att 皆為 "?"（賽季剛開始，無出席記錄） */
export function mockRosterAllQuestions(): RosterData {
  const allQ: AttValue[] = ['?','?','?','?','?','?','?','?','?','?'];
  return {
    weeks: mockRosterWeeks(),
    teams: [
      {
        id: 'red', name: '紅隊',
        players: [
          mockRosterPlayer('韋承志', allQ),
          mockRosterPlayer('吳軒宇', allQ),
          mockRosterPlayer('趙尹旋', allQ),
        ],
      },
    ],
  };
}
