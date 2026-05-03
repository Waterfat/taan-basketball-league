/**
 * 資料層抽象（直接打 Google Sheets API v4）
 *
 * 三層 fallback：
 *   1. Google Sheets API（含 5 分鐘 in-memory cache）
 *   2. 靜態 JSON（public/data/*.json）
 *   3. source: 'error'（讓呼叫端處理 empty state）
 *
 * 行為與舊網站 js/api.js 一致。GAS Webapp 中介層已於 Issue #13 移除。
 *
 * 頁面元件 / island 不應直接 fetch，一律走這層。
 */

import {
  transformHome,
  transformStandings,
  transformDragon,
  transformSchedule,
  transformLeaders,
  type SheetsValueRange,
} from './api-transforms';
import { getCached, setCache } from './api-cache';

export type DataKind =
  | 'home'
  | 'schedule'
  | 'standings'
  | 'roster'
  | 'dragon'
  | 'leaders'
  | 'boxscore'
  | 'stats'
  | 'rotation'
  | 'hof';

const SHEET_ID = import.meta.env.PUBLIC_SHEET_ID as string | undefined;
const API_KEY = import.meta.env.PUBLIC_SHEETS_API_KEY as string | undefined;
const RAW_BASE = import.meta.env.BASE_URL ?? '/';
const STATIC_BASE = RAW_BASE.replace(/\/$/, ''); // 去掉尾斜線，串接時統一補

interface FetchResult<T> {
  data: T | null;
  source: 'sheets' | 'static' | 'error';
  error?: string;
}

/**
 * 各 DataKind 對應的 Sheets ranges（從舊 js/api.js sheetsRanges 移植）
 *
 * 本 Issue 完整啟用 Sheets path 的 kind（transformer 完整）：
 *   - standings：6 隊戰績 + meta（season / phase / currentWeek）
 *   - dragon：龍虎榜
 *   - home：composite shape（meta + standings + dragon top10 + miniStats）（Issue #17 Task 4）
 *   - schedule：dates + allSchedule + allMatchups 三 range zip → weeks[]（Issue #17 Task 5）
 *   - leaders / stats：個人類別表 + offense / defense / net 三張隊伍表（Issue #17 Task 6）
 *
 * 暫走 static fallback 的 kind（後續 Issue 補完整 transformer 後啟用 Sheets）：
 *   - roster：transformer 為 stub
 *
 * 純 static 的 kind（無 Sheets path，nothing to do）：
 *   - boxscore：已有獨立模組 src/lib/boxscore-api.ts 處理
 *   - rotation / hof：純靜態資料
 */
const SHEETS_RANGES: Record<DataKind, string[]> = {
  // Issue #17 Task 1: standings 補 meta range（datas!D2:M7）讓 transformStandings
  // 取得真實 phase / currentWeek（與 transformHome 共用同一 range；matrix 仍由 static JSON 補）
  standings: ['datas!P2:T7', 'datas!D2:M7'],
  dragon: ['datas!D13:L76'],
  // Issue #17 Task 4: home 啟用 composite Sheets path
  // ranges 順序與 transformHome 對應：meta / standings / dragon / leaders mini
  home: ['datas!D2:M7', 'datas!P2:T7', 'datas!D13:L76', 'datas!D212:N224'],
  // Issue #17 Task 5: schedule 啟用 multi-range Sheets path
  // ranges 順序與 transformSchedule 對應：dates / allSchedule / allMatchups
  schedule: ['datas!P13:AG13', 'datas!D87:N113', 'datas!D117:F206'],
  roster: [], // reason: transformRoster 為 stub
  // Issue #17 Task 6: leaders / stats 啟用 4-block Sheets path
  // ranges 順序與 transformLeaders 對應：leadersTable / teamOffense / teamDefense / teamNet
  // leaders 與 stats 共用同一資料源（GAS handleStats），前端走 Sheets v4 batchGet
  leaders: ['datas!D212:N224', 'datas!D227:K234', 'datas!D237:K244', 'datas!D247:K254'],
  stats: ['datas!D212:N224', 'datas!D227:K234', 'datas!D237:K244', 'datas!D247:K254'],
  boxscore: [],
  rotation: [],
  hof: [],
};

const TRANSFORMERS: Partial<Record<DataKind, (r: SheetsValueRange[]) => unknown>> = {
  standings: transformStandings,
  dragon: transformDragon,
  // Issue #17 Task 4: home 啟用 composite transformer
  home: transformHome,
  schedule: transformSchedule,
  // Issue #17 Task 6: leaders / stats 共用 transformLeaders（4-block 解析）
  leaders: transformLeaders,
  stats: transformLeaders,
};

/**
 * 驗證 Sheets API 環境變數已設定且非 placeholder。
 */
function isSheetsConfigured(): boolean {
  if (!SHEET_ID || !API_KEY) return false;
  if (SHEET_ID.includes('REPLACE_WITH_')) return false;
  if (API_KEY.includes('REPLACE_WITH_')) return false;
  return true;
}

/**
 * 建立 Sheets v4 batchGet URL（多個 ranges 一次取回）
 */
function buildBatchUrl(ranges: string[]): string {
  const params = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID!)}/values:batchGet?${params}&key=${encodeURIComponent(API_KEY!)}`;
}

/**
 * 從 Google Sheets API 取資料並 transform 為 typed JSON。
 */
async function fetchFromSheets<T>(kind: DataKind): Promise<T | null> {
  const ranges = SHEETS_RANGES[kind];
  const transformer = TRANSFORMERS[kind];
  if (ranges.length === 0 || !transformer) return null;

  const res = await fetch(buildBatchUrl(ranges));
  if (!res.ok) throw new Error(`Sheets HTTP ${res.status}`);
  const json = (await res.json()) as { valueRanges?: SheetsValueRange[] };
  return transformer(json.valueRanges ?? []) as T;
}

/**
 * 從 public/data/<kind>.json fallback 取資料。
 */
async function fetchFromStatic<T>(kind: DataKind): Promise<T | null> {
  const url = `${STATIC_BASE}/data/${kind}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/**
 * 統一資料取得入口。
 *
 * Issue #17 AC-E1 後行為：
 *   優先順序：cache → Sheets API（配置正確時）→ static JSON（合法例外）→ error。
 *
 *   - 配置正確（isSheetsConfigured() && kind 有 transformer + ranges）且 Sheets 失敗
 *     → 直接回 source: 'error'，**不**再 fallback static JSON。
 *     理由：static JSON 是賽季初範例，Sheets 失敗時 fallback 等於假裝成功，
 *     使用者應看到「資料載入失敗 + 重試」而非過期範例資料。
 *
 *   - 合法走 static fallback 的情境：
 *     1. SHEET_ID / API_KEY 未設定或為 placeholder（dev 本機未設定 .env.local）
 *     2. 該 kind 的 SHEETS_RANGES 為空 [] 或 TRANSFORMERS 未註冊（如 roster / boxscore / rotation / hof）
 */
export async function fetchData<T = unknown>(kind: DataKind): Promise<FetchResult<T>> {
  // 0. cache（5 分鐘 TTL，瀏覽器 tab scope）
  const cached = getCached<T>(kind);
  if (cached !== null) {
    return { data: cached, source: 'sheets' };
  }

  const sheetsConfigured = isSheetsConfigured();
  const hasSheetsPath = SHEETS_RANGES[kind].length > 0 && !!TRANSFORMERS[kind];

  // 1. Sheets path（配置正確 + kind 有 transformer + ranges）
  if (sheetsConfigured && hasSheetsPath) {
    try {
      const data = await fetchFromSheets<T>(kind);
      if (data !== null) {
        setCache(kind, data);
        return { data, source: 'sheets' };
      }
      // fetchFromSheets 回 null（理論上不該發生，因為 hasSheetsPath 已成立）→ 視同 error
      return { data: null, source: 'error', error: 'Sheets returned null' };
    } catch (err) {
      // ⚠️ Issue #17 AC-E1：Sheets 配置正確但失敗 → 不 fallback，直接 error
      console.error(`[api] Sheets fetch failed for ${kind} (configured)`, err);
      return {
        data: null,
        source: 'error',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 2. Static fallback（合法情境：placeholder / 未設定 / kind 無 transformer）
  try {
    const data = await fetchFromStatic<T>(kind);
    return { data, source: 'static' };
  } catch (err) {
    return {
      data: null,
      source: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
