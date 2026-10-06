import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { selfHostFonts } from './vite-plugins/selfHostFonts';
import { seo } from './vite-plugins/seo';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [
      react(),
      tailwindcss(),
      selfHostFonts(),
      seo({
        siteUrl: env.VITE_SITE_URL,
        articlesFile: fileURLToPath(
          new URL('./src/data/articlesData.ts', import.meta.url),
        ),
      }),
    ],
  };
});
