/**
 * Sheets v4 valueRanges → typed JSON 的 transformer 集合（Issue #13 Task 2）。
 *
 * 對映關係（從舊 js/api.js sheetsRanges + gas/Code.gs handler 移植）：
 *   home       → datas!D2:M7
 *   standings  → datas!P2:T7
 *   dragon     → datas!D13:L76
 *   schedule   → datas!P13:AG13 (dates), D87:N113 (allSchedule), D117:F206 (allMatchups)
 *   roster     → datas!O19:AH83
 *   leaders    → datas!D212:N224 (leadersTable), D227:K234 (teamOffense),
 *                D237:K244 (teamDefense), D247:K254 (teamNet)
 *
 * 詳細欄位語意參考：
 *   - 舊網站：/Users/waterfat/Documents/github_cc/taan_basketball_league/js/api.js（line 15-30 sheetsRanges）
 *   - GAS 端：gas/Code.gs（doGet handler）
 *
 * ⚠️ 本檔為 Task 2 最小 stub：滿足型別 + 6 個 transformer 函式 export，
 * 通過單元測試 Happy path / 空輸入。完整解析邏輯（schedule weeks zip、
 * roster 6-team 切分、leaders 4 個 range 拼接）在 Task 3（rewrite api.ts）
 * 整合 + integration test 驗收時補強。
 */

import type { HomeData } from '../types/home';
import type { StandingsData } from '../types/standings';
import type { DragonData, RosterData } from '../types/roster';
import type { ScheduleData } from '../types/schedule';
import type { LeaderData } from '../types/leaders';

export interface SheetsValueRange {
  range: string;
  values?: string[][];
}

const SEASON = 25;

/**
 * datas!D2:M7 → HomeData 主資料卡（首頁 hero 區）
 *
 * Reference:
 *   - js/api.js: sheetsRanges.home = 'datas!D2:M7'
 *   - gas/Code.gs: handleHome()（同範圍提取 phase / week / date / venue）
 *
 * 行 0：phase（"季後賽" / "例行賽" 等）
 * 行 1：currentWeek（數字字串）
 * 行 2：「比賽日期」label，跳過
 * 行 3：nextDate（"YYYY/M/D"）
 * 行 4：「比賽地點」label，跳過
 * 行 5：venue（"大安" 等）
 */
export function transformHome(ranges: SheetsValueRange[]): HomeData {
  const values = ranges[0]?.values ?? [];
  const phase = values[0]?.[0] ?? '';
  const currentWeek = parseInt(values[1]?.[0] ?? '0', 10) || 0;
  const nextDate = values[3]?.[0] ?? '';
  const venue = values[5]?.[0] ?? '';

  // 注意：HomeData 的完整 shape 含 standings / dragonTop10 / miniStats，
  // 這些由 fallback static JSON 提供；transformer 只負責 Sheets 取得的 meta 欄位。
  // Task 3 整合時若需從多個 ranges 組裝 standings + dragonTop10，再擴充。
  return {
    season: SEASON,
    phase,
    currentWeek,
    nextDate,
    venue,
  } as unknown as HomeData;
}

/**
 * datas!P2:T7 → StandingsData（6 隊戰績）
 *
 * Reference:
 *   - js/api.js: sheetsRanges.standings = 'datas!P2:T7'
 *   - gas/Code.gs: handleStandings()
 *
 * 每列 5 欄：team / wins / losses / winRate / streak
 */
export function transformStandings(ranges: SheetsValueRange[]): StandingsData {
  const values = ranges[0]?.values ?? [];
  const teams = values.map((row) => ({
    team: row[0] ?? '',
    wins: parseInt(row[1] ?? '0', 10) || 0,
    losses: parseInt(row[2] ?? '0', 10) || 0,
    winRate: row[3] ?? '0%',
    streak: row[4] ?? '',
  }));

  return { teams } as unknown as StandingsData;
}

/**
 * datas!D13:L76 → DragonData（積分龍虎榜）
 *
 * Reference:
 *   - js/api.js: sheetsRanges.dragon = 'datas!D13:L76'
 *   - gas/Code.gs: handleDragon()
 *
 * 每列 9 欄：name / team / att / duty / mop / playoff / total / (rsv) / (rsv)
 *   - playoff '—' → null
 */
export function transformDragon(ranges: SheetsValueRange[]): DragonData {
  const values = ranges[0]?.values ?? [];
  const players = values
    .filter((row) => row[0])
    .map((row) => ({
      name: row[0] ?? '',
      team: row[1] ?? '',
      attendance: parseInt(row[2] ?? '0', 10) || 0,
      rotation: parseInt(row[3] ?? '0', 10) || 0,
      mop: parseInt(row[4] ?? '0', 10) || 0,
      playoff: row[5] === '—' ? null : parseInt(row[5] ?? '0', 10) || 0,
      total: parseInt(row[6] ?? '0', 10) || 0,
    }));

  return { players, civilianThreshold: 36 } as unknown as DragonData;
}

/**
 * datas!P13:AG13 (dates) + D87:N113 (allSchedule) + D117:F206 (allMatchups) → ScheduleData
 *
 * Reference:
 *   - js/api.js: sheetsRanges.dates / allSchedule / allMatchups
 *   - gas/Code.gs: handleSchedule()（zip 三組資料組成 weeks[]）
 *
 * Task 2 stub：先回傳結構化空容器；
 * Task 3 整合時補完整 zip 邏輯（每週對應 dates[i] + allSchedule.slice(i*N, ...) + allMatchups.slice(...)）
 */
export function transformSchedule(ranges: SheetsValueRange[]): ScheduleData {
  if (ranges.length === 0) {
    return { season: SEASON, currentWeek: 1, weeks: [] } as unknown as ScheduleData;
  }
  // [Task 3 待實作：對 dates + allSchedule + allMatchups 三組做 zip → weeks[]]
  return { season: SEASON, currentWeek: 1, weeks: [] } as unknown as ScheduleData;
}

/**
 * datas!O19:AH83 → RosterData（六隊 roster + 出席紀錄）
 *
 * Reference:
 *   - js/api.js: sheetsRanges.roster = 'datas!O19:AH83'
 *   - gas/Code.gs: handleRoster()（依固定列高切 6 個隊伍 block）
 *
 * Task 2 stub：先回傳空 teams[]；Task 3 整合時補 6-team 切分邏輯。
 */
export function transformRoster(ranges: SheetsValueRange[]): RosterData {
  if (ranges.length === 0) {
    return { season: SEASON, teams: [] } as unknown as RosterData;
  }
  // [Task 3 待實作：對 datas!O19:AH83 做 6-team 切分，每隊 N 個球員]
  return { season: SEASON, teams: [] } as unknown as RosterData;
}

/**
 * datas!D212:N224 + D227:K234 + D237:K244 + D247:K254 → LeaderData
 *
 * Reference:
 *   - js/api.js: sheetsRanges.leadersTable / teamOffense / teamDefense / teamNet
 *   - gas/Code.gs: handleLeaders()（4 個 range 各對應一塊統計表）
 *
 * Task 2 stub：先回傳空容器；Task 3 整合時補 4-block 拼接邏輯。
 */
export function transformLeaders(ranges: SheetsValueRange[]): LeaderData {
  if (ranges.length === 0) {
    return {
      season: SEASON,
      leaders: [],
      teamOffense: [],
      teamDefense: [],
      teamNet: [],
    } as unknown as LeaderData;
  }
  // [Task 3 待實作：分別解析 leadersTable / teamOffense / teamDefense / teamNet]
  return {
    season: SEASON,
    leaders: [],
    teamOffense: [],
    teamDefense: [],
    teamNet: [],
  } as unknown as LeaderData;
}
