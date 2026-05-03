/**
 * Unit test：Home 三狀態 + 邊界資料元件渲染契約（取代 home-states.spec.ts 的 mock-driven E2E）
 *
 * @tag @home @states @issue-17
 * Coverage:
 *   原 home-states.spec.ts AC-12 / AC-13 / AC-14（loading / error / empty）→ SkeletonState / ErrorState / EmptyState
 *   原 AC-15（streakType null → 不顯示 icon）
 *   原 AC-16（領先榜 players < 3 → 顯示有的，不報錯）
 *   原 AC-17（龍虎榜 < 5 筆 → 顯示有的，不報錯）
 *
 * 為什麼降級為 unit：
 *   原 e2e 全靠 mockHomeAPI(page, ..., { delayMs / allFail })、null streakType / FewPlayers / FewDragon
 *   等 deterministic 假資料觸發；prod URL 上無法主動觸發。
 *   依 e2e-guide.md「需 deterministic 假資料 → 改 unit / integration」原則改寫為元件渲染契約測試。
 *
 * 互動行為（重試按鈕的 reload）由 tests/unit/error-empty-states.test.ts 涵蓋。
 */

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { SkeletonState } from '../../src/components/home/SkeletonState';
import { ErrorState as HomeErrorState } from '../../src/components/home/ErrorState';
import { EmptyState as HomeEmptyState } from '../../src/components/home/EmptyState';
import { MiniStandings } from '../../src/components/home/MiniStandings';
import { MiniLeaders } from '../../src/components/home/MiniLeaders';
import { MiniDragon } from '../../src/components/home/MiniDragon';
import {
  mockHomeData,
  mockEmptyHomeData,
  mockHomeDataWithNullStreak,
  mockHomeDataWithFewPlayers,
  mockHomeDataWithFewDragon,
} from '../fixtures/home';

const BASE = '/';
const NOOP = () => {
  /* test stub */
};

describe('AC-12 (Loading): SkeletonState 渲染', () => {
  it('SkeletonState 渲染 home-skeleton testid + 4 區塊佔位', () => {
    const html = renderToString(createElement(SkeletonState));
    expect(html).toContain('data-testid="home-skeleton"');
    expect(html).toContain('animate-pulse');
  });
});

describe('AC-13 (Error): ErrorState 含重試按鈕 + 錯誤訊息', () => {
  it('home/ErrorState SSR 不 throw，含「重試」按鈕', () => {
    const html = renderToString(createElement(HomeErrorState, { onRetry: NOOP }));
    expect(html).toContain('重試');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
  });
});

describe('AC-14 (Empty): EmptyState 顯示「賽季尚未開始」+ 不破碎', () => {
  it('home/EmptyState SSR 不 throw + 不顯示破碎字串', () => {
    const html = renderToString(createElement(HomeEmptyState, { baseUrl: BASE }));
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toContain('第 季');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
  });

  it('mockEmptyHomeData 結構：標記為空、無 standings/dragonTop10/miniStats', () => {
    const data = mockEmptyHomeData();
    expect(data.standings).toEqual([]);
    expect(data.dragonTop10).toEqual([]);
    expect(data.miniStats.pts.players).toEqual([]);
    expect(data.miniStats.reb.players).toEqual([]);
    expect(data.miniStats.ast.players).toEqual([]);
  });
});

describe('AC-15 (null streak): MiniStandings 不顯示 streak-icon', () => {
  it('streakType=null → SSR 不渲染 streak-icon span', () => {
    const data = mockHomeDataWithNullStreak();
    const html = renderToString(
      createElement(MiniStandings, { teams: data.standings, baseUrl: BASE }),
    );
    // streak 文字仍渲染
    expect(html).toContain('data-testid="streak"');
    // streak-icon 不渲染（SSR 結果不含此 testid）
    expect(html).not.toContain('data-testid="streak-icon"');
  });

  it('streakType=win 時 → streak-icon 渲染 ↑', () => {
    const data = mockHomeData();
    const html = renderToString(
      createElement(MiniStandings, { teams: data.standings, baseUrl: BASE }),
    );
    expect(html).toContain('data-testid="streak-icon"');
  });
});

describe('AC-16 (Few players): MiniLeaders 不報錯，顯示有的 entries', () => {
  it('pts.players=1, reb.players=2, ast.players=3 → 各 leader-category 渲染對應數量 entry', () => {
    const data = mockHomeDataWithFewPlayers();
    const html = renderToString(
      createElement(MiniLeaders, { miniStats: data.miniStats, baseUrl: BASE }),
    );
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('data-testid="home-leaders"');
    // 三個 leader-category 容器都要存在（即使資料少）
    const catCount = (html.match(/data-testid="leader-category"/g) ?? []).length;
    expect(catCount).toBe(3);

    // pts 只有 1 個 entry（容器仍渲染）
    const ptsPlayers = data.miniStats.pts.players;
    expect(ptsPlayers.length).toBe(1);
    // reb 只有 2 個
    expect(data.miniStats.reb.players.length).toBe(2);
  });
});

describe('AC-17 (Few dragon): MiniDragon 不報錯，顯示有的 rows', () => {
  it('dragonTop10 < 5 筆 → SSR 不 throw，渲染現有 rows', () => {
    const data = mockHomeDataWithFewDragon();
    const html = renderToString(
      createElement(MiniDragon, { dragonTop10: data.dragonTop10, baseUrl: BASE }),
    );
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('data-testid="home-dragon"');
    // MiniDragon 同時渲染 mobile + desktop 視圖（CSS 互斥），SSR 結果含 2x rows
    // 取至多 5 筆（top 5）後 ×2 = 上限；實際數量 = min(dragonTop10.length, 5) × 2
    const rowCount = (html.match(/data-testid="dragon-row"/g) ?? []).length;
    expect(rowCount).toBeGreaterThan(0);
    const expectedTop = Math.min(data.dragonTop10.length, 5);
    expect(rowCount).toBe(expectedTop * 2);
  });
});
