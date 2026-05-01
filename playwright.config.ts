import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4321/taan-basketball-league';

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
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
