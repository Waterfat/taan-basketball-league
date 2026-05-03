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
import {
  mockFullDragonboard,
  mockDragonboardWithThreshold,
  mockEmptyDragonboard,
  mockDragonPlayer,
  mockDragonGroupingShowcase,
} from '../fixtures/dragon';

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

/**
 * Issue #17 Task 2 擴充：分組標題的 N 必須等於平民區實際渲染人數（civilians.length），
 * 而不是 civilianThreshold 數值本身。
 *
 * Covers: U-1（B-7）— DragonTabPanel 分組標題對齊實際 civilians.length
 *
 * 驗證情境：
 *   threshold = 10，players[0..4] total >= 10 → civilians.length = 5
 *   標題應顯示「前 5 名」+「第 6 名起」（不是「前 10 名」+「第 11 名起」）
 *   civilian-divider 文案保留「{civilianThreshold} 分」（仍是分數線，與分組標題的 N 解耦）
 */
describe('DragonTabPanel — group title N === civilians.length (Issue #17, Covers: U-1)', () => {
  it('group title 顯示「前 N 名」N 等於平民區實際渲染人數', () => {
    const data = mockDragonGroupingShowcase(); // threshold=10, players[0..4].total >= 10 → 5 civilians
    const html = renderToString(createElement(DragonTabPanel, { data }));

    const civiliansCount = data.players.filter((p) => p.total >= data.civilianThreshold).length;
    expect(civiliansCount).toBe(5);

    // 平民區標題：N = civilians.length
    expect(html).toContain(`前 ${civiliansCount} 名`);
    // 奴隸區標題：起始名次 = civilians.length + 1
    expect(html).toContain(`第 ${civiliansCount + 1} 名起`);

    // 分數線（civilian-divider）保留以 civilianThreshold 為文案
    expect(html).toContain(`平民線（${data.civilianThreshold} 分）`);
  });
});
