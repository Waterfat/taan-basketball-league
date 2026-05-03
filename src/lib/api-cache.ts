/**
 * 5 分鐘 in-memory cache（瀏覽器 tab scope）
 *
 * 行為與舊網站 js/api.js 的 _sheetsCache 一致：
 *   - cache key = DataKind 名稱（home / schedule / standings / ...）
 *   - TTL 5 分鐘，過期 getCached 回 null（強制 refetch）
 *   - clearCache() 可手動 invalidate
 */

export const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T = unknown> {
  data: T;
  ts: number;
}

const _cache = new Map<string, CacheEntry>();

export function getCached<T = unknown>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts >= CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T = unknown>(key: string, data: T): void {
  _cache.set(key, { data, ts: Date.now() });
}

export function clearCache(key?: string): void {
  if (key === undefined) {
    _cache.clear();
  } else {
    _cache.delete(key);
  }
}
