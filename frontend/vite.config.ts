import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { selfHostFonts } from './vite-plugins/selfHostFonts';
import { seo } from './vite-plugins/seo';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';
  const backendProxy = Object.fromEntries(
    ['/api', '/storage', '/sitemap.xml'].map((prefix) => [prefix, { target: backendUrl }]),
  );

  return {
    plugins: [react(), tailwindcss(), selfHostFonts(), seo({ siteUrl: env.VITE_SITE_URL })],
    // Backend Laravel (composer dev) di-proxy agar satu origin seperti di produksi: cookie sesi dan
    // CSRF berlaku tanpa CORS. Atur BACKEND_URL bila server API tidak di port 8000.
    server: { proxy: backendProxy },
    preview: { proxy: backendProxy },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'vite-plugins/**/*.test.ts'],
      // Node >= 25 memasang localStorage bawaan yang menutupi milik jsdom (bernilai undefined tanpa
      // --localstorage-file). Matikan agar uji memakai localStorage jsdom seperti di browser.
      execArgv: ['--no-experimental-webstorage'],
      restoreMocks: true,
      mockReset: true,
      unstubEnvs: true,
      unstubGlobals: true,
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'html'],
        include: ['src/**/*.{ts,tsx}', 'vite-plugins/**/*.ts'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      },
    },
  };
});
