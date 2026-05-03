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
  transformStandings,
  transformDragon,
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
 * 本 Issue 完整啟用 Sheets path 的 kind（transformer 完整、單一 range）：
 *   - standings：6 隊戰績
 *   - dragon：龍虎榜
 *
 * 暫走 static fallback 的 kind（後續 Issue 補完整 transformer 後啟用 Sheets）：
 *   - home：HomeData 為多 range composite（meta + standings + dragon + miniStats），
 *           需重組合 + history 計算 + miniStats 從 stats range 取，本 Issue 不處理
 *   - schedule / roster / leaders：transformer 為 stub
 *
 * 純 static 的 kind（無 Sheets path，nothing to do）：
 *   - boxscore：已有獨立模組 src/lib/boxscore-api.ts 處理
 *   - stats / rotation / hof：純靜態資料
 */
const SHEETS_RANGES: Record<DataKind, string[]> = {
  standings: ['datas!P2:T7'],
  dragon: ['datas!D13:L76'],
  home: [], // reason: composite transformer pending（多 range + history + miniStats）→ 後續 issue
  schedule: [], // reason: transformSchedule 為 stub
  roster: [], // reason: transformRoster 為 stub
  leaders: [], // reason: transformLeaders 為 stub
  boxscore: [],
  stats: [],
  rotation: [],
  hof: [],
};

const TRANSFORMERS: Partial<Record<DataKind, (r: SheetsValueRange[]) => unknown>> = {
  standings: transformStandings,
  dragon: transformDragon,
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
 * 統一資料取得入口。優先順序：cache → Sheets API → 靜態 JSON → error。
 */
export async function fetchData<T = unknown>(kind: DataKind): Promise<FetchResult<T>> {
  // 0. cache（5 分鐘 TTL，瀏覽器 tab scope）
  const cached = getCached<T>(kind);
  if (cached !== null) {
    return { data: cached, source: 'sheets' };
  }

  // 1. Google Sheets API（如已設定且 kind 有對應 ranges + transformer）
  if (isSheetsConfigured() && SHEETS_RANGES[kind].length > 0 && TRANSFORMERS[kind]) {
    try {
      const data = await fetchFromSheets<T>(kind);
      if (data !== null) {
        setCache(kind, data);
        return { data, source: 'sheets' };
      }
    } catch (err) {
      console.warn(`[api] Sheets fetch failed for ${kind}, falling back to static`, err);
    }
  }

  // 2. 靜態 JSON fallback
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
