/**
 * tests/helpers/mock-api — Re-export 統一入口
 *
 * 涵蓋範圍：
 *   集合 schedule / standings / boxscore / leaders 四個 mock 模組，
 *   供所有 E2E spec 以不變的 import path 使用：
 *   `import { ... } from '../../helpers/mock-api'`
 *
 * 子模組說明：
 *   schedule.ts  — mockScheduleAPI + mockKindAPI（通用兩層攔截）
 *   standings.ts — mockStandingsAPI
 *   boxscore.ts  — mockBoxscoreSheetsAPI + mockBoxscoreAndLeaders
 *   leaders.ts   — mockLeadersAPI
 */

export { mockScheduleAPI, mockKindAPI } from './schedule';
export type { MockOptions } from './schedule';

export { mockStandingsAPI } from './standings';

export { mockBoxscoreSheetsAPI, mockBoxscoreAndLeaders } from './boxscore';
export type { BoxscoreMockOptions } from './boxscore';

export { mockLeadersAPI } from './leaders';
export type { LeadersMockOptions } from './leaders';

// re-export types for fixture consumers
export type { BoxscoreData, LeaderData } from './boxscore';
