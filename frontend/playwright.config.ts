import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BACKEND_PORT = 8001;

// Kata sandi akun demo (admin@pemdi.test, penulis@pemdi.test) di database e2e. Dibaca
// e2e/start-backend.mjs untuk seeder dan oleh uji untuk login. Hanya untuk database uji sementara.
process.env.E2E_DEMO_PASSWORD ??= 'UjiE2ePemdi2026';

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

  webServer: [
    // Backend Laravel dengan database SQLite e2e yang baru dan sudah di-seed.
    {
      command: 'node e2e/start-backend.mjs',
      url: `http://127.0.0.1:${BACKEND_PORT}/up`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { BACKEND_PORT: String(BACKEND_PORT) },
    },
    // Build produksi yang dilayani dengan header dari public/_headers (termasuk CSP ketat);
    // /api diteruskan ke backend di atas sehingga satu origin seperti di server produksi.
    {
      command: 'node e2e/start.mjs',
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { PORT: String(PORT), BACKEND_URL: `http://127.0.0.1:${BACKEND_PORT}` },
    },
  ],
});
