/**
 * Integration: src/lib/api.ts 與相關設定不再 reference GAS Webapp
 *
 * Tag: @api-cleanup @issue-13
 * Coverage:
 *   Issue #13 I-9: api.ts 不再 import / reference PUBLIC_GAS_WEBAPP_URL（B-17）
 *   附帶驗 .env.example、env.d.ts、environments.yml 同步清理
 *
 * 註：本檔以 file system 讀取做靜態檢查，目的是擋住未來不小心把 GAS_URL 加回來。
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..', '..');

function readFile(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('Issue #13 cleanup verification (integration)', () => {
  it('src/lib/api.ts 不再 reference PUBLIC_GAS_WEBAPP_URL', () => {
    const content = readFile('src/lib/api.ts');
    expect(content).not.toMatch(/PUBLIC_GAS_WEBAPP_URL/);
    expect(content).not.toMatch(/GAS_URL/);
    expect(content).not.toMatch(/script\.google\.com/);
  });

  it('src/lib/api.ts 改用 PUBLIC_SHEET_ID + PUBLIC_SHEETS_API_KEY', () => {
    const content = readFile('src/lib/api.ts');
    expect(content).toMatch(/PUBLIC_SHEET_ID/);
    expect(content).toMatch(/PUBLIC_SHEETS_API_KEY/);
    expect(content).toMatch(/sheets\.googleapis\.com/);
  });

  it('src/env.d.ts 移除 PUBLIC_GAS_WEBAPP_URL 型別宣告', () => {
    const content = readFile('src/env.d.ts');
    expect(content).not.toMatch(/PUBLIC_GAS_WEBAPP_URL/);
  });

  it('.env.example 移除 PUBLIC_GAS_WEBAPP_URL 區塊', () => {
    const content = readFile('.env.example');
    expect(content).not.toMatch(/PUBLIC_GAS_WEBAPP_URL/);
  });

  it('tests/environments.yml 移除 env_vars.PUBLIC_GAS_WEBAPP_URL', () => {
    const content = readFile('tests/environments.yml');
    expect(content).not.toMatch(/PUBLIC_GAS_WEBAPP_URL/);
  });

  it('tests/environments.yml 含 PUBLIC_SHEET_ID + PUBLIC_SHEETS_API_KEY 設定', () => {
    const content = readFile('tests/environments.yml');
    expect(content).toMatch(/PUBLIC_SHEET_ID/);
    expect(content).toMatch(/PUBLIC_SHEETS_API_KEY/);
  });

  it('tests/helpers/mock-api/index.ts 不含 merge conflict marker [qa-v2 補充]', () => {
    const content = readFile('tests/helpers/mock-api/index.ts');
    expect(content).not.toMatch(/^<<<<<<< /m);
    expect(content).not.toMatch(/^>>>>>>> /m);
    expect(content).not.toMatch(/^=======$/m);
  });

  it('tests/helpers/mock-api/schedule.ts 不再以 script.google.com 為 GAS_PATTERN [qa-v2 補充]', () => {
    const content = readFile('tests/helpers/mock-api/schedule.ts');
    expect(content).not.toMatch(/script\.google\.com/);
  });

  it('gas/Code.gs 保留當歷史參考（檔案未刪）', () => {
    expect(() => readFile('gas/Code.gs')).not.toThrow();
  });
});
