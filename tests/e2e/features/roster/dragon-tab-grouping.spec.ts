/**
 * E-3：/roster?tab=dragon — 平民區 / 奴隸區 分組標題 E2E（對 prod 真實鏈路）
 *
 * @coverage E-3
 * @issue #17
 * @tag @roster @dragon @issue-17
 *
 * 不再 mock Roster + Dragon API；對 prod URL 跑真實鏈路：
 *  - 平民區 wrapper 可見 + 標題含「🧑 平民區」+「可優先自由選擇加入隊伍」
 *  - 奴隸區 wrapper 可見 + 標題含「⛓️ 奴隸區」+「為聯盟貢獻過低淪為奴隸」
 *
 * 不寫死「前 10 名 / 第 11 名起」具體數字（threshold 由 prod Sheets 真實資料決定，
 * Issue #17 AC-3 確保 threshold 不再寫死 36）；改驗結構性 invariant：
 *  - 平民區標題含「前 N 名」格式
 *  - 奴隸區標題含「第 N+1 名起」格式（N 由 prod data 決定）
 *
 * 平民區 / 奴隸區 分組演算法（依 rank vs threshold 切分）由 unit test 涵蓋
 * （tests/unit/dragon-components.test.ts U-1）。
 */

import { test, expect } from '@playwright/test';

test.describe('Dragon tab — 平民區 / 奴隸區 分組標題', () => {
  test('E-801: 🧑 平民區 wrapper + 標題可見', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const civilianGroup = page.locator('[data-testid="dragon-group-civilian"]');
    await expect(civilianGroup).toBeVisible();
    await expect(civilianGroup).toHaveAttribute('data-group', 'civilian');

    const civilianTitle = page.locator('[data-testid="dragon-group-civilian-title"]');
    await expect(civilianTitle).toBeVisible();
    await expect(civilianTitle).toContainText('🧑 平民區');
    // 含「前 N 名」格式（N 為實際 threshold，prod 真實值）
    await expect(civilianTitle).toContainText(/前\s*\d+\s*名/);
    await expect(civilianTitle).toContainText('可優先自由選擇加入隊伍');
  });

  test('E-802: ⛓️ 奴隸區 wrapper + 標題可見（如該賽季有奴隸區成員）', async ({ page }) => {
    await page.goto('roster?tab=dragon');

    const slaveGroup = page.locator('[data-testid="dragon-group-slave"]');
    const count = await slaveGroup.count();

    test.skip(
      count === 0,
      'prod 該賽季所有球員均在平民區（無奴隸區）→ 跳過奴隸區結構驗證',
    );

    await expect(slaveGroup).toBeVisible();
    await expect(slaveGroup).toHaveAttribute('data-group', 'slave');

    const slaveTitle = page.locator('[data-testid="dragon-group-slave-title"]');
    await expect(slaveTitle).toBeVisible();
    await expect(slaveTitle).toContainText('⛓️ 奴隸區');
    // 含「第 N+1 名起」格式
    await expect(slaveTitle).toContainText(/第\s*\d+\s*名起/);
    await expect(slaveTitle).toContainText('為聯盟貢獻過低淪為奴隸');
  });
});
