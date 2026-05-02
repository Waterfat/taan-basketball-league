import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
    ],
    environment: 'jsdom',
    globals: true,
  },
  define: {
    'import.meta.env.PUBLIC_SHEET_ID': JSON.stringify('test-sheet-id'),
    'import.meta.env.PUBLIC_SHEETS_API_KEY': JSON.stringify('test-api-key'),
  },
});
