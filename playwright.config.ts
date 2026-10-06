import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'id-ID',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/*.mobile.spec.ts',
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: '**/*.desktop.spec.ts',
    },
  ],

  // Menguji build produksi yang dilayani dengan header dari public/_headers (termasuk CSP ketat).
  webServer: {
    command: 'node e2e/start.mjs',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { PORT: String(PORT) },
  },
});
