import type { BoxscoreData } from '../types/boxscore';
import { transformBoxscore } from './boxscore-utils';

const SHEET_ID = import.meta.env.PUBLIC_SHEET_ID as string | undefined;
const API_KEY = import.meta.env.PUBLIC_SHEETS_API_KEY as string | undefined;

/**
 * boxscore tab 的固定範圍（A1:AO1980 = 90 場 × 22 行 = 1980 列；41 欄）
 */
const RANGE = 'boxscore!A1:AO1980';

interface FetchResult {
  data: BoxscoreData | null;
  source: 'sheets' | 'error';
  error?: string;
}

/**
 * 直打 Google Sheets API（v4 values.get）取得 boxscore tab 原始資料，
 * 套 transformBoxscore 解析為結構化資料。
 *
 * Covers I-5, I-6, I-7
 */
export async function fetchBoxscore(): Promise<FetchResult> {
  if (!SHEET_ID || !API_KEY) {
    return {
      data: null,
      source: 'error',
      error: 'Missing PUBLIC_SHEET_ID or PUBLIC_SHEETS_API_KEY',
    };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(RANGE)}?key=${encodeURIComponent(API_KEY)}`;

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      return { data: null, source: 'error', error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { values?: string[][] };
    const rows = json.values ?? [];
    const weeks = transformBoxscore(rows);

    // currentWeek = 最大週（fallback 1）
    const currentWeek = weeks.length > 0 ? Math.max(...weeks.map((w) => w.week)) : 1;

    return {
      data: {
        season: 25,
        currentWeek,
        weeks,
      },
      source: 'sheets',
    };
  } catch (err) {
    return {
      data: null,
      source: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
