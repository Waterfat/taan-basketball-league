// tests/unit/api-cache-ttl.test.ts
// Covers: U-1, I-6（單元層）

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('api-cache module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('CACHE_TTL_MS 常數值 = 5 分鐘', async () => {
    const { CACHE_TTL_MS } = await import('../../src/lib/api-cache');
    expect(CACHE_TTL_MS).toBe(5 * 60 * 1000);
  });

  it('setCache + getCached 在 TTL 內回傳同一份資料', async () => {
    const { setCache, getCached } = await import('../../src/lib/api-cache');
    setCache('home', { phase: 'test' });
    expect(getCached('home')).toEqual({ phase: 'test' });

    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(getCached('home')).toEqual({ phase: 'test' });
  });

  it('TTL 過後 getCached 回傳 null', async () => {
    const { setCache, getCached } = await import('../../src/lib/api-cache');
    setCache('standings', { teams: [] });

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(getCached('standings')).toBeNull();
  });

  it('clearCache(key) 清掉單一 key', async () => {
    const { setCache, getCached, clearCache } = await import('../../src/lib/api-cache');
    setCache('a', 1);
    setCache('b', 2);
    clearCache('a');
    expect(getCached('a')).toBeNull();
    expect(getCached('b')).toBe(2);
  });

  it('clearCache() 清掉全部', async () => {
    const { setCache, getCached, clearCache } = await import('../../src/lib/api-cache');
    setCache('a', 1);
    setCache('b', 2);
    clearCache();
    expect(getCached('a')).toBeNull();
    expect(getCached('b')).toBeNull();
  });

  it('不同 key 互不干擾', async () => {
    const { setCache, getCached } = await import('../../src/lib/api-cache');
    setCache('home', 'A');
    setCache('schedule', 'B');
    expect(getCached('home')).toBe('A');
    expect(getCached('schedule')).toBe('B');
  });
});
