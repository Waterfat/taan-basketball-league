/**
 * tests/unit/mock-api-pattern.test.ts
 *
 * Covers: U-2（Issue #13）
 *   驗 tests/helpers/mock-api/ 已從 GAS_PATTERN（script.google.com）切換到
 *   SHEETS_PATTERN（sheets.googleapis.com/v4/spreadsheets），並清掉
 *   index.ts 第 5 行殘留的 merge conflict marker。
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('mock-api SHEETS_PATTERN regex', () => {
  it('schedule.ts 不再用 script.google.com 作為 GAS pattern', () => {
    const content = readFileSync(
      resolve(__dirname, '../../tests/helpers/mock-api/schedule.ts'),
      'utf8',
    );
    // 涵蓋 regex literal（script\.google\.com）與一般字串（script.google.com）
    expect(content).not.toMatch(/script\\?\.google\\?\.com/);
  });

  it('schedule.ts 改用 sheets.googleapis.com 作為 SHEETS_PATTERN', () => {
    const content = readFileSync(
      resolve(__dirname, '../../tests/helpers/mock-api/schedule.ts'),
      'utf8',
    );
    expect(content).toMatch(/sheets\.googleapis\.com/);
    expect(content).toMatch(/SHEETS_PATTERN|SHEETS_URL_PATTERN/i);
  });

  it('SHEETS_PATTERN 能匹配實際的 v4 batchGet URL', async () => {
    const mod = await import('../../tests/helpers/mock-api/schedule');
    const url =
      'https://sheets.googleapis.com/v4/spreadsheets/abc123/values:batchGet?ranges=datas%21D2%3AM7&key=KEY';
    const pattern = (mod as { SHEETS_PATTERN?: RegExp }).SHEETS_PATTERN;
    expect(pattern).toBeDefined();
    if (pattern) {
      expect(pattern.test(url)).toBe(true);
    }
  });

  it('mock-api/index.ts 不再含 merge conflict marker', () => {
    const content = readFileSync(
      resolve(__dirname, '../../tests/helpers/mock-api/index.ts'),
      'utf8',
    );
    expect(content).not.toMatch(/^<<<<<<< /m);
    expect(content).not.toMatch(/^=======$/m);
    expect(content).not.toMatch(/^>>>>>>> /m);
  });
});
