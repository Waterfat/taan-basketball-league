/**
 * Unit smoke test：DragonTabPanel 及子元件 SSR 渲染驗收
 *
 * 補測 code-review-graph detect_changes_tool 標記為 untested 的元件：
 *   JudgeIcon, DragonTableRow, CivilianDividerRow, DragonCard, DragonTabPanel
 *
 * 互動行為（金色背景、分隔線位置）由 tests/e2e/features/roster/dragon-tab.spec.ts 覆蓋。
 * 業務邏輯（isAboveThreshold, formatPlayoff）由 tests/unit/roster-utils.test.ts 覆蓋。
 */

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { DragonTabPanel } from '../../src/components/roster/DragonTabPanel';
import { mockFullDragonboard, mockDragonboardWithThreshold, mockEmptyDragonboard, mockDragonPlayer } from '../fixtures/dragon';

describe('DragonTabPanel', () => {
  it('renders without throwing', () => {
    const html = renderToString(createElement(DragonTabPanel, { data: mockFullDragonboard() }));
    expect(html).toContain('data-testid="dragon-tab-panel"');
  });

  it('empty players → dragon-empty message', () => {
    const html = renderToString(createElement(DragonTabPanel, { data: mockEmptyDragonboard() }));
    expect(html).toContain('data-testid="dragon-empty"');
    expect(html).toContain('龍虎榜資料尚未產生');
  });

  it('players present → dragon-table visible', () => {
    const html = renderToString(createElement(DragonTabPanel, { data: mockFullDragonboard() }));
    expect(html).toContain('data-testid="dragon-table"');
  });

  it('tag="裁" → judge-icon present in output', () => {
    const data = mockFullDragonboard();
    const html = renderToString(createElement(DragonTabPanel, { data }));
    // 韋承志 rank=1 有 tag="裁"
    expect(html).toContain('data-testid="judge-icon"');
  });

  it('tag=null → judge-icon not rendered for that player row', () => {
    const data = {
      ...mockEmptyDragonboard(),
      players: [mockDragonPlayer({ rank: 1, name: '無裁判', team: '綠', tag: null, total: 5 })],
    };
    const html = renderToString(createElement(DragonTabPanel, { data }));
    expect(html).not.toContain('data-testid="judge-icon"');
  });

  it('playoff=null → renders "—"', () => {
    const data = mockFullDragonboard();
    const html = renderToString(createElement(DragonTabPanel, { data }));
    expect(html).toContain('—');
  });

  it('above-threshold player → data-above-threshold="true"', () => {
    const data = mockDragonboardWithThreshold(); // threshold=10, rank1 total=12
    const html = renderToString(createElement(DragonTabPanel, { data }));
    expect(html).toContain('data-above-threshold="true"');
  });

  it('divider rendered when some players above threshold', () => {
    const data = mockDragonboardWithThreshold(); // rank1+2 above, rank3+ below
    const html = renderToString(createElement(DragonTabPanel, { data }));
    expect(html).toContain('data-testid="civilian-divider"');
    expect(html).toContain('平民線');
  });

  it('no divider when all players above threshold', () => {
    const allAbove = {
      ...mockDragonboardWithThreshold(),
      players: [
        mockDragonPlayer({ rank: 1, name: 'A', team: '紅', tag: null, total: 20 }),
        mockDragonPlayer({ rank: 2, name: 'B', team: '黑', tag: null, total: 15 }),
      ],
    };
    const html = renderToString(createElement(DragonTabPanel, { data: allAbove }));
    // divider 只在從 above → below 的轉折點插入，全超過則 dividerIdx=-1
    expect(html).not.toContain('data-testid="civilian-divider"');
  });

  it('dragon-player-row present for each player', () => {
    const data = mockFullDragonboard();
    const html = renderToString(createElement(DragonTabPanel, { data }));
    const count = (html.match(/data-testid="dragon-player-row"/g) ?? []).length;
    expect(count).toBe(data.players.length);
  });
});
