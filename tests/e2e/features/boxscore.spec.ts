/**
 * /boxscore 數據頁 E2E
 *
 * Tag: @boxscore
 * Coverage: AC-1 ~ AC-21（AC-22/23 屬於環境設定，不在 E2E 涵蓋）+ qa-v2 補充
 *
 * 測試資料策略：
 * - boxscore tab：mockBoxscoreSheetsAPI() 攔截 sheets.googleapis.com（直打 Sheets API）
 * - leaders tab：mockLeadersAPI() 攔截 GAS stats endpoint + JSON fallback
 * - 不打 production Google Sheets / GAS
 *
 * Sub-tab Deep Link 規則：
 *   /boxscore                       → leaders tab（預設）
 *   /boxscore?tab=leaders           → leaders tab
 *   /boxscore?tab=boxscore          → boxscore tab
 *   /boxscore?week=N&game=M         → boxscore tab + chip W{N} + scroll 到第 M 場 + highlight
 */

import { test, expect } from '@playwright/test';
import {
  mockBoxscoreWeek,
  mockBoxscoreGame,
} from '../../fixtures/boxscore';
import {
  mockFullLeaders,
  mockEmptyLeaders,
  mockPartialLeaders,
} from '../../fixtures/leaders';
import {
  mockBoxscoreSheetsAPI,
  mockLeadersAPI,
  mockBoxscoreAndLeaders,
} from '../../helpers/mock-api';

const ALL_BOX_GAMES = [
  ...mockBoxscoreWeek(1).games,
  ...mockBoxscoreWeek(5).games,
  ...mockBoxscoreWeek(6).games,
];

test.describe('Boxscore Page — Hero @boxscore', () => {
  // ────── AC-1: Hero header 顯示 + 副標 ──────
  test('AC-1: 訪客打開 /boxscore → Hero header「DATA · 第 25 季」', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore');

    // UI 結構
    const hero = page.locator('[data-testid="data-hero"]');
    await expect(hero).toBeVisible();
    await expect(hero.locator('[data-testid="hero-title"]')).toContainText(/DATA/i);
    await expect(hero.locator('[data-testid="hero-title"]')).toContainText(/第\s*25\s*季|S25/);
  });

  // ────── AC-1 副標動態 ──────
  test('AC-1b: Hero 副標依 active tab 動態變化（leaders → boxscore）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore'); // 預設 leaders

    const subtitle = page.locator('[data-testid="hero-subtitle"]');
    await expect(subtitle).toContainText(/領先榜/);

    // 切到 boxscore tab
    await page.locator('[data-testid="sub-tab"][data-tab="boxscore"]').click();
    await expect(subtitle).toContainText(/逐場\s*Box/);
  });
});

test.describe('Boxscore Sub-tab + Deep Link @boxscore', () => {
  // ────── AC-14: 預設 leaders tab ──────
  test('AC-14: 無 query 進入 → 預設 leaders tab active', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore');

    const leadersTab = page.locator('[data-testid="sub-tab"][data-tab="leaders"]');
    const boxscoreTab = page.locator('[data-testid="sub-tab"][data-tab="boxscore"]');
    await expect(leadersTab).toHaveAttribute('data-active', 'true');
    await expect(boxscoreTab).toHaveAttribute('data-active', 'false');
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
  });

  // ────── AC-13: ?tab=leaders 直接進入 ──────
  test('AC-13: /boxscore?tab=leaders 直接進入 → leaders tab', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="leaders"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
  });

  // ────── AC-13b: ?tab=boxscore 直接進入 ──────
  test('AC-13b: /boxscore?tab=boxscore 直接進入 → boxscore tab', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="boxscore-panel"]')).toBeVisible();
  });

  // ────── AC-11: 切換 tab 更新 URL + reload 仍停留 ──────
  test('AC-11: 切換 tab → URL 變更 + reload 仍停留', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore'); // leaders 預設

    await page.locator('[data-testid="sub-tab"][data-tab="boxscore"]').click();
    await expect(page).toHaveURL(/[?&]tab=boxscore(&|$)/);

    // reload 仍在 boxscore
    await page.reload();
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');
  });

  // ────── AC-12: deep link from /schedule ──────
  test('AC-12: /boxscore?week=5&game=1 → boxscore tab + chip W5 + 第 1 場 highlight + scroll', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?week=5&game=1');

    // 自動切 boxscore tab
    await expect(page.locator('[data-testid="sub-tab"][data-tab="boxscore"]')).toHaveAttribute('data-active', 'true');

    // chip W5 為 active
    const activeChip = page.locator('[data-testid="bs-week-chip"][data-active="true"]');
    await expect(activeChip).toContainText(/5/);

    // 第 1 場卡片 highlight + 在視窗內
    const card = page.locator('[data-testid="bs-game-card"][data-game="1"]');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-highlighted', 'true');
    await expect(card).toBeInViewport({ timeout: 3000 });
  });

  // ────── [qa-v2 補充] 切回 leaders 後 highlight 移除 ──────
  test('[qa-v2 補充] AC-12b: 從 deep link 進入後切回 leaders → URL 移除 week/game query', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?week=5&game=1');

    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();

    await expect(page).toHaveURL(/[?&]tab=leaders/);
    await expect(page).not.toHaveURL(/week=/);
    await expect(page).not.toHaveURL(/game=/);
  });
});

test.describe('Boxscore Tab — chip + game cards @boxscore', () => {
  // ────── AC-2: chip timeline 切週 + 預設當前週 ──────
  test('AC-2: 進入 boxscore tab → chip timeline 顯示，預設當前週 active', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const activeChip = page.locator('[data-testid="bs-week-chip"][data-active="true"]');
    await expect(activeChip).toContainText(/5/); // mockFullBoxscore.currentWeek = 5
  });

  // ────── AC-3: 切換 chip → 該週 6 場 ──────
  test('AC-3: 點另一週 chip → 顯示該週 6 場比賽', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    await page.locator('[data-testid="bs-week-chip"][data-week="1"]').click();
    const cards = page.locator('[data-testid="bs-game-card"]');
    await expect(cards).toHaveCount(6);
  });

  // ────── AC-4: 每場顯示標題 + 雙隊表格 + 工作人員 collapsible ──────
  test('AC-4: 每場標題 + 雙隊表格 + 工作人員 collapsible（預設摺疊）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstCard = page.locator('[data-testid="bs-game-card"]').first();
    await expect(firstCard.locator('[data-testid="bs-game-title"]')).toBeVisible();

    // 雙隊表格
    await expect(firstCard.locator('[data-testid="bs-team-table"]')).toHaveCount(2);

    // 工作人員預設摺疊
    const staffPanel = firstCard.locator('[data-testid="bs-staff-panel"]');
    await expect(staffPanel).toBeHidden();
    const toggle = firstCard.locator('[data-testid="bs-staff-toggle"]');
    await expect(toggle).toBeVisible();
  });

  // ────── AC-4b: 點 toggle 展開工作人員 ──────
  test('AC-4b: 點工作人員箭頭 → 展開/收起', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const card = page.locator('[data-testid="bs-game-card"]').first();
    const toggle = card.locator('[data-testid="bs-staff-toggle"]');
    const panel = card.locator('[data-testid="bs-staff-panel"]');

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/裁判/);

    await toggle.click();
    await expect(panel).toBeHidden();
  });

  // ────── AC-5: 球員表格 11 欄 ──────
  test('AC-5: 球員表格含 11 欄（name/pts/fg2/fg3/ft/treb/ast/stl/blk/tov/pf）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstTable = page.locator('[data-testid="bs-team-table"]').first();
    const headers = firstTable.locator('thead th');
    await expect(headers).toHaveCount(11);
  });

  // ────── AC-6: 表格末尾合計 row ──────
  test('AC-6: 球員表格末尾顯示合計 row', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const firstTable = page.locator('[data-testid="bs-team-table"]').first();
    const totalsRow = firstTable.locator('[data-testid="bs-totals-row"]');
    await expect(totalsRow).toBeVisible();
    await expect(totalsRow).toContainText(/合計/);
  });

  // ────── AC-7: DNP 球員視覺處理 ──────
  test('AC-7: DNP 球員顯示灰色 + 「(未出賽)」標籤', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const dnpRow = page.locator('[data-testid="bs-player-row"][data-dnp="true"]').first();
    await expect(dnpRow).toBeVisible();
    await expect(dnpRow).toContainText(/未出賽|DNP/);
  });

  // ────── AC-8: 球員不可點 ──────
  test('AC-8: 球員 row 不可點擊（無連結，cursor 非 pointer）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const playerRow = page.locator('[data-testid="bs-player-row"][data-dnp="false"]').first();
    const cursor = await playerRow.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).not.toBe('pointer');

    // 不應該是 anchor
    const tagName = await playerRow.evaluate((el) => el.tagName);
    expect(tagName.toLowerCase()).not.toBe('a');
  });

  // ────── [qa-v2 補充] DNP 球員不計入合計 ──────
  test('[qa-v2 補充] AC-6b: DNP 球員不計入合計 row', async ({ page }) => {
    // 使用單場 with DNP，確保合計只算出賽 5 名球員
    const game = mockBoxscoreGame(5, 1, { homeTeam: '紅', awayTeam: '白', homeScore: 34, awayScore: 22, withDnp: true });
    await mockBoxscoreSheetsAPI(page, [game]);
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore&week=5&game=1');

    const card = page.locator('[data-testid="bs-game-card"][data-game="1"]');
    const homeTable = card.locator('[data-testid="bs-team-table"][data-team="紅"]');
    const totalsRow = homeTable.locator('[data-testid="bs-totals-row"]');

    // 合計 pts 應等於 fixture 中 home.totals.pts
    await expect(totalsRow).toContainText(String(game.home.totals.pts));
  });
});

test.describe('Leaders Tab @boxscore', () => {
  // ────── AC-9: 6 類別獨立卡片 ──────
  test('AC-9: leaders tab 顯示 6 類別獨立卡片', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const cards = page.locator('[data-testid="leaders-card"]');
    await expect(cards).toHaveCount(6);

    for (const cat of ['scoring', 'rebound', 'assist', 'steal', 'block', 'eff']) {
      await expect(page.locator(`[data-testid="leaders-card"][data-category="${cat}"]`)).toBeVisible();
    }
  });

  // ────── AC-9b: 每類 top 10 ──────
  test('AC-9b: 每個類別卡片含 top 10', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const scoringCard = page.locator('[data-testid="leaders-card"][data-category="scoring"]');
    const rows = scoringCard.locator('[data-testid="leader-row"]');
    await expect(rows).toHaveCount(10);
  });

  // ────── AC-10: 球員顯示 rank/名字/隊色點/數值 ──────
  test('AC-10: 每位球員顯示 rank、名字、隊色點、數值', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstRow = page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"][data-rank="1"]');
    await expect(firstRow).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-name"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-team-dot"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="leader-val"]')).toContainText(/\d/);
  });

  // ────── AC-10b: scoring 進階指標 2P%/3P%/FT% ──────
  test('AC-10b: scoring 卡片顯示進階指標 2P%/3P%/FT%', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstScoring = page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"]').first();
    const advanced = firstScoring.locator('[data-testid="leader-advanced"]');
    await expect(advanced).toContainText(/%/);
  });

  // ────── AC-10c: rebound 進階指標 進攻/防守籃板 ──────
  test('AC-10c: rebound 卡片顯示進階指標（進攻/防守籃板）', async ({ page }) => {
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=leaders');

    const firstRebound = page.locator('[data-testid="leaders-card"][data-category="rebound"] [data-testid="leader-row"]').first();
    const advanced = firstRebound.locator('[data-testid="leader-advanced"]');
    await expect(advanced).toContainText(/\d/);
  });
});

test.describe('Boxscore Three-State (Loading / Error / Empty) @boxscore', () => {
  // ────── AC-17: skeleton 載入中 ──────
  test('AC-17: 資料載入中 → 看到 skeleton', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES, { delayMs: 1500 });
    await mockLeadersAPI(page, mockFullLeaders(), { delayMs: 1500 });
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-skeleton"]')).toBeVisible();
    // 載入後 skeleton 消失
    await expect(page.locator('[data-testid="bs-game-card"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="bs-skeleton"]')).toHaveCount(0);
  });

  // ────── AC-18: boxscore Sheets API 失敗 → 限縮錯誤 ──────
  test('AC-18: Sheets API 失敗（boxscore） → 「無法載入逐場數據」+ 重試（限縮 boxscore 區塊）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    const error = page.locator('[data-testid="bs-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/無法載入逐場數據|無法載入Box/);
    await expect(error.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ────── AC-18b: 切到 leaders tab 仍正常 ──────
  test('AC-18b: boxscore 失敗時切到 leaders tab → leaders 仍正常顯示（錯誤限縮）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, [], { sheetsFails: true });
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-error"]')).toBeVisible();
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    await expect(page.locator('[data-testid="leaders-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-error"]')).toHaveCount(0);
  });

  // ────── AC-19: leaders endpoint 失敗 → 限縮錯誤 ──────
  test('AC-19: leaders stats endpoint 失敗 → 「無法載入領先榜」+ 重試（限縮 leaders 區塊）', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, null, { allFail: true });
    await page.goto('boxscore?tab=leaders');

    const error = page.locator('[data-testid="leaders-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/無法載入領先榜|無法載入排行/);
    await expect(error.getByRole('button', { name: /重試/ })).toBeVisible();
  });

  // ────── AC-19b: 重試按鈕觸發再次 fetch ──────
  test('AC-19b: 點重試按鈕 → 重新 fetch leaders', async ({ page }) => {
    let callCount = 0;
    await page.route(/script\.google\.com\/macros\/s\/.+\/exec\?type=stats/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });
    await page.route(/\/data\/(leaders|stats)\.json$/, async (route) => {
      callCount++;
      await route.fulfill({ status: 500, body: 'fail' });
    });
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await page.goto('boxscore?tab=leaders');

    const retry = page.locator('[data-testid="leaders-error"]').getByRole('button', { name: /重試/ });
    await expect(retry).toBeVisible();

    const initial = callCount;
    await retry.click();
    await expect.poll(() => callCount).toBeGreaterThan(initial);
  });

  // ────── AC-20: 該週 boxscore 為空 ──────
  test('AC-20: 該週 boxscore 為空 → 「該週尚無 Box Score」', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, []); // 完全沒有 games
    await mockLeadersAPI(page, mockFullLeaders());
    await page.goto('boxscore?tab=boxscore');

    await expect(page.locator('[data-testid="bs-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="bs-empty"]')).toContainText(/尚無\s*Box\s*Score/i);
  });

  // ────── AC-21: leaders 全空 ──────
  test('AC-21: leaders 全空（賽季初）→ 「賽季初尚無球員數據」', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, mockEmptyLeaders());
    await page.goto('boxscore?tab=leaders');

    await expect(page.locator('[data-testid="leaders-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaders-empty"]')).toContainText(/賽季初|尚無球員數據/);
  });

  // ────── [qa-v2 補充] 部分類別空 ──────
  test('[qa-v2 補充] AC-21b: leaders 部分類別空 → 個別卡片顯示 empty，其他正常', async ({ page }) => {
    await mockBoxscoreSheetsAPI(page, ALL_BOX_GAMES);
    await mockLeadersAPI(page, mockPartialLeaders());
    await page.goto('boxscore?tab=leaders');

    // scoring 有資料
    await expect(page.locator('[data-testid="leaders-card"][data-category="scoring"] [data-testid="leader-row"]')).toHaveCount(10);
    // rebound 空（fixture 設定）
    const reboundCard = page.locator('[data-testid="leaders-card"][data-category="rebound"]');
    await expect(reboundCard).toBeVisible();
    await expect(reboundCard.locator('[data-testid="leader-row"]')).toHaveCount(0);
  });
});

test.describe('Boxscore Page RWD @boxscore', () => {
  // ────── AC-15 desktop ──────
  test('AC-15 (regression desktop): 桌機 ≥768 → boxscore 11 欄完整 + leaders 兩欄並排', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width < 768, 'desktop project only');
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    const headers = page.locator('[data-testid="bs-team-table"]').first().locator('thead th');
    await expect(headers).toHaveCount(11);

    // leaders tab 兩欄並排：scoring 和第二張卡 Y 接近
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    const cards = page.locator('[data-testid="leaders-card"]');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    expect(Math.abs((box1?.y ?? 0) - (box2?.y ?? 0))).toBeLessThan(20);
    expect((box2?.x ?? 0)).toBeGreaterThan(box1?.x ?? 0);
  });

  // ────── AC-16 mobile ──────
  test('AC-16 (regression-mobile): 手機 <768 → boxscore 表格橫向捲動 + leaders 垂直堆疊', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= 768, 'mobile project only');
    await mockBoxscoreAndLeaders(page, { boxscore: ALL_BOX_GAMES, leaders: mockFullLeaders() });
    await page.goto('boxscore?tab=boxscore');

    // 表格容器應 overflow-x scrollable
    const tableContainer = page.locator('[data-testid="bs-team-table"]').first().locator('..');
    const overflowX = await tableContainer.evaluate((el) => getComputedStyle(el).overflowX);
    expect(['auto', 'scroll']).toContain(overflowX);

    // leaders 垂直堆疊：兩張卡 X 接近
    await page.locator('[data-testid="sub-tab"][data-tab="leaders"]').click();
    const cards = page.locator('[data-testid="leaders-card"]');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    expect(Math.abs((box1?.x ?? 0) - (box2?.x ?? 0))).toBeLessThan(20);
    expect((box2?.y ?? 0)).toBeGreaterThan(box1?.y ?? 0);
  });
});
