/**
 * tests/helpers/mock-api — Re-export 統一入口
 *
 * 涵蓋範圍：
 *   集合 schedule / standings / boxscore / leaders / roster / home 六個 mock 模組，
 *   供所有 E2E spec 以不變的 import path 使用：
 *   `import { ... } from '../../helpers/mock-api'`
 *
 * 子模組說明：
 *   schedule.ts  — mockScheduleAPI + mockKindAPI（通用兩層攔截）+ SHEETS_PATTERN
 *   standings.ts — mockStandingsAPI
 *   boxscore.ts  — mockBoxscoreSheetsAPI + mockBoxscoreAndLeaders
 *   leaders.ts   — mockLeadersAPI
 *   roster.ts    — mockRosterAPI + mockDragonAPI + mockRosterAndDragon
 *   home.ts      — mockHomeAPI（首頁 dashboard）
 */

export { mockScheduleAPI, mockKindAPI, SHEETS_PATTERN } from './schedule';
export type { MockOptions } from './schedule';

export { mockStandingsAPI } from './standings';

export { mockBoxscoreSheetsAPI, mockBoxscoreAndLeaders } from './boxscore';
export type { BoxscoreMockOptions } from './boxscore';

export { mockLeadersAPI } from './leaders';
export type { LeadersMockOptions } from './leaders';

export { mockRosterAPI, mockDragonAPI, mockRosterAndDragon } from './roster';
export type { RosterAndDragonMockOptions } from './roster';

export { mockHomeAPI } from './home';

// re-export types for fixture consumers
export type { BoxscoreData, LeaderData } from './boxscore';
