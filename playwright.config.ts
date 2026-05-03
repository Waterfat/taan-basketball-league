import { defineConfig, devices } from '@playwright/test';

// baseURL 結尾必須有 /，否則 page.goto('/path') 的 leading 斜線會覆蓋 path component（→ 404）
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4321/taan-basketball-league/';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/.auth/**', '**/setup/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      // reason: Sheets API key 有 referrer 限制（白名單 waterfat.github.io）；CI runner / dev 環境 referer 為 localhost 會被擋
      Referer: 'https://waterfat.github.io/',
    },
  },
  projects: [
    {
      name: 'regression',
      testMatch: /.*\.regression\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'regression-mobile',
      testMatch: /.*\.regression\.spec\.ts/,
      use: { ...devices['Pixel 7'] }, // Chromium-based 手機 profile（避免 webkit 依賴）
    },
    {
      name: 'features',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*\.regression\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'features-mobile',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*\.regression\.spec\.ts/,
      use: { ...devices['Pixel 7'] }, // 手機 viewport 測 RWD
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
