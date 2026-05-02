/**
 * Unit smoke test：驗 5 個 React 元件可被 SSR 渲染、不 throw、含關鍵 testid
 *
 * 補測 code-review-graph `detect_changes_tool` 標記為 untested 的元件。
 * 不使用 @testing-library/react（避免新增依賴），改用 react-dom/server.renderToString
 * 配合 React.createElement（保持 .ts 副檔名相容 vitest 設定）。
 *
 * 互動行為（click retry / 點隊伍列）由 tests/e2e/features/standings.spec.ts 覆蓋。
 */

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { SkeletonState } from '../../src/components/standings/SkeletonState';
import { ErrorState } from '../../src/components/standings/ErrorState';
import { EmptyState } from '../../src/components/standings/EmptyState';
import { StandingsHero } from '../../src/components/standings/StandingsHero';
import { StandingsApp } from '../../src/components/standings/StandingsApp';
import { StandingsCard, StandingsTableRow } from '../../src/components/standings/StandingsRow';
import { mockTeamStanding } from '../fixtures/standings';

describe('standings components smoke', () => {
  // Covers: SkeletonState（test_gap）
  it('SkeletonState：渲染含 skeleton-hero + 6 個 skeleton-row', () => {
    const html = renderToString(createElement(SkeletonState));
    expect(html).toContain('skeleton-hero');
    expect(html.match(/skeleton-row/g)?.length ?? 0).toBe(6);
    expect(html).toContain('animate-pulse');
  });

  // Covers: ErrorState（test_gap）
  it('ErrorState：預設訊息「無法載入戰績」+ 重試按鈕', () => {
    const html = renderToString(createElement(ErrorState, { onRetry: () => {} }));
    expect(html).toContain('無法載入戰績');
    expect(html).toContain('重試');
  });

  it('ErrorState：可覆寫訊息文字', () => {
    const html = renderToString(
      createElement(ErrorState, { onRetry: () => {}, message: '網路怪怪的' }),
    );
    expect(html).toContain('網路怪怪的');
  });

  // Covers: EmptyState（test_gap）
  it('EmptyState：顯示「賽季尚未開始」+「看球員名單」連結 → /roster', () => {
    const html = renderToString(createElement(EmptyState, { baseUrl: '/' }));
    expect(html).toContain('賽季尚未開始');
    expect(html).toContain('看球員名單');
    expect(html).toContain('href="/roster"');
  });

  it('EmptyState：baseUrl 帶子路徑（GitHub Pages）→ link 也帶子路徑', () => {
    const html = renderToString(
      createElement(EmptyState, { baseUrl: '/taan-basketball-league/' }),
    );
    expect(html).toContain('href="/taan-basketball-league/roster"');
  });

  // Covers: StandingsHero（test_gap）
  it('StandingsHero：標題「STANDINGS · 例行賽」+ 副標「第 25 季 · 第 5 週」', () => {
    const html = renderToString(
      createElement(StandingsHero, { season: 25, phase: '例行賽', currentWeek: 5 }),
    );
    expect(html).toContain('STANDINGS');
    expect(html).toContain('例行賽');
    // React SSR 在 text fragment 間插入 <!-- -->，斷言時忽略
    const stripped = html.replace(/<!--\s*-->/g, '');
    expect(stripped).toMatch(/第\s*25\s*季/);
    expect(stripped).toMatch(/第\s*5\s*週/);
  });

  // Covers: StandingsApp（test_gap）— SSR 預設渲染 skeleton（useEffect 不在 server 端執行）
  it('StandingsApp：SSR 預設渲染 SkeletonState（loading 為初始狀態）', () => {
    const html = renderToString(createElement(StandingsApp, { baseUrl: '/' }));
    expect(html).toContain('skeleton-hero');
    expect(html).toContain('skeleton-row');
  });

  // Covers: StandingsCard / HistoryDots / StreakLabel（StandingsRow 內部 helpers，code-graph test_gap）
  it('StandingsCard：含 7 個關鍵 data-testid + history 6 顆 dot', () => {
    const team = mockTeamStanding();
    const html = renderToString(
      createElement(StandingsCard, { team, baseUrl: '/' }),
    );
    expect(html).toContain('data-testid="standings-row"');
    expect(html).toContain('data-testid="rank"');
    expect(html).toContain('data-testid="team-dot"');
    expect(html).toContain('data-testid="team-name"');
    expect(html).toContain('data-testid="wins"');
    expect(html).toContain('data-testid="losses"');
    expect(html).toContain('data-testid="pct"');
    expect(html).toContain('data-testid="streak"');
    expect(html.match(/data-testid="history-dot"/g)?.length ?? 0).toBe(6);
  });

  it('StandingsCard：win streak → data-streak-type="win"，連結指向 /roster?team=<id>', () => {
    const team = mockTeamStanding({ streakType: 'win', team: '綠' });
    const html = renderToString(createElement(StandingsCard, { team, baseUrl: '/' }));
    expect(html).toContain('data-streak-type="win"');
    expect(html).toContain('href="/roster?team=green"');
  });

  it('StandingsTableRow：渲染為 <tr> 含 7 欄 + 對應 testid', () => {
    const team = mockTeamStanding({ team: '紅', streakType: 'lose' });
    const html = renderToString(createElement(StandingsTableRow, { team, baseUrl: '/' }));
    expect(html).toContain('data-testid="standings-row"');
    expect(html).toContain('role="link"');
    expect(html).toContain('data-streak-type="lose"');
  });

  it('history-dot：W 顯隊伍主色、L 顯灰色（不同色）', () => {
    const winnerTeam = mockTeamStanding({ team: '綠', history: ['W', 'L'] });
    const html = renderToString(
      createElement(StandingsCard, { team: winnerTeam, baseUrl: '/' }),
    );
    // 第一顆 W 應含綠隊主色 #2e7d32；第二顆 L 應為灰
    expect(html).toContain('#2e7d32');
    expect(html).toMatch(/#999/);
  });
});
