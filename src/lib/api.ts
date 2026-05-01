/**
 * 資料層抽象（從舊 js/api.js 移植）
 *
 * 三層 fallback：
 *   1. Google Apps Script Webapp
 *   2. 靜態 JSON（public/data/*.json）
 *   3. 拋錯（讓呼叫端處理 empty state）
 *
 * 頁面元件 / island 不應直接 fetch，一律走這層
 */

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

const GAS_URL = import.meta.env.PUBLIC_GAS_WEBAPP_URL;
const STATIC_BASE = import.meta.env.BASE_URL ?? '/';

interface FetchResult<T> {
  data: T | null;
  source: 'gas' | 'static' | 'error';
  error?: string;
}

/**
 * 從 GAS webapp 取資料；失敗時 fallback 到靜態 JSON
 */
export async function fetchData<T = unknown>(kind: DataKind): Promise<FetchResult<T>> {
  // 嘗試 GAS
  if (GAS_URL && !GAS_URL.includes('REPLACE_WITH_DEPLOY_ID')) {
    try {
      const url = `${GAS_URL}?type=${encodeURIComponent(kind)}`;
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        const data = (await res.json()) as T;
        return { data, source: 'gas' };
      }
    } catch (err) {
      console.warn(`[api] GAS fetch failed for ${kind}, falling back to static`, err);
    }
  }

  // Fallback 到靜態 JSON
  try {
    const url = `${STATIC_BASE}data/${kind}.json`.replace(/\/+/g, '/');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    return { data, source: 'static' };
  } catch (err) {
    return {
      data: null,
      source: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
