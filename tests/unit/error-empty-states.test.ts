/**
 * Unit smoke test：跨模組 ErrorState + EmptyState 渲染（home / schedule / roster；standings 已在 standings-components.test.ts 涵蓋）
 *
 * Tag: @ui-states @issue-17 @ac-e1 @ac-e2
 * Coverage:
 *   U-3（Issue #17 B-29, B-30）：四個模組（home / schedule / roster / standings）的 ErrorState 與 EmptyState 元件
 *     - SSR 不 throw
 *     - ErrorState 顯示重試按鈕 + 預設訊息
 *     - EmptyState 顯示預設訊息（不出現「第 季」/「undefined」/「NaN」字串，避免 AC-E2 的資料缺失字串渲染）
 *
 * 互動行為（click retry → reload state）由各 page 的 e2e spec 覆蓋。
 *
 * 對應 AC：
 *   AC-E1：Sheets 失效時頁面顯示 ErrorState（含重試按鈕）
 *   AC-E2：賽季初空資料時顯示 EmptyState（不顯示破碎字串）
 */

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

// home
import { ErrorState as HomeErrorState } from '../../src/components/home/ErrorState';
import { EmptyState as HomeEmptyState } from '../../src/components/home/EmptyState';
// schedule
import { ErrorState as ScheduleErrorState } from '../../src/components/schedule/ErrorState';
import { EmptyState as ScheduleEmptyState } from '../../src/components/schedule/EmptyState';
// roster
import { ErrorState as RosterErrorState } from '../../src/components/roster/ErrorState';
import { EmptyState as RosterEmptyState } from '../../src/components/roster/EmptyState';

const BASE_URL = '/';
const NOOP = () => {
  /* test stub */
};

const FORBIDDEN_BROKEN_STRINGS = [
  '第  季',
  '第 季',
  'undefined',
  'NaN',
  'null',
];

describe('AC-E1：ErrorState 跨模組渲染（含重試按鈕）', () => {
  it('home/ErrorState：SSR 不 throw + 含重試按鈕', () => {
    const html = renderToString(createElement(HomeErrorState, { onRetry: NOOP }));
    expect(html).toContain('重試');
    for (const broken of FORBIDDEN_BROKEN_STRINGS) {
      expect(html).not.toContain(broken);
    }
  });

  it('schedule/ErrorState：SSR 不 throw + 含重試按鈕', () => {
    const html = renderToString(createElement(ScheduleErrorState, { onRetry: NOOP }));
    expect(html).toContain('重試');
    for (const broken of FORBIDDEN_BROKEN_STRINGS) {
      expect(html).not.toContain(broken);
    }
  });

  it('roster/ErrorState：SSR 不 throw + 含重試按鈕', () => {
    const html = renderToString(createElement(RosterErrorState, { onRetry: NOOP }));
    expect(html).toContain('重試');
    for (const broken of FORBIDDEN_BROKEN_STRINGS) {
      expect(html).not.toContain(broken);
    }
  });
});

describe('AC-E2：EmptyState 跨模組渲染（不出現破碎字串）', () => {
  it('home/EmptyState：SSR 不 throw + 不顯示破碎字串', () => {
    const html = renderToString(createElement(HomeEmptyState, { baseUrl: BASE_URL }));
    expect(html.length).toBeGreaterThan(0);
    for (const broken of FORBIDDEN_BROKEN_STRINGS) {
      expect(html).not.toContain(broken);
    }
  });

  it('schedule/EmptyState：SSR 不 throw + 不顯示破碎字串', () => {
    const html = renderToString(createElement(ScheduleEmptyState, { baseUrl: BASE_URL }));
    expect(html.length).toBeGreaterThan(0);
    for (const broken of FORBIDDEN_BROKEN_STRINGS) {
      expect(html).not.toContain(broken);
    }
  });

  it('roster/EmptyState：SSR 不 throw + 不顯示破碎字串', () => {
    const html = renderToString(createElement(RosterEmptyState, { baseUrl: BASE_URL }));
    expect(html.length).toBeGreaterThan(0);
    for (const broken of FORBIDDEN_BROKEN_STRINGS) {
      expect(html).not.toContain(broken);
    }
  });
});
