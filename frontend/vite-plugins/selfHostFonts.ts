import type { Plugin } from 'vite';

/**
 * CSS `@idds/react` memuat Inter lewat `@import` ke fonts.googleapis.com. Itu
 * mengirim IP setiap pengunjung ke pihak ketiga, menambah rantai render-blocking,
 * dan memaksa CSP melonggarkan `style-src`/`font-src`.
 *
 * Font di-self-host lewat `@fontsource/inter` (diimpor di `src/main.tsx`),
 * sehingga `@import` eksternal tersebut dibuang saat transformasi CSS.
 */
const googleFontsImport =
  /@import\s*(?:url\(\s*)?(["'])https:\/\/fonts\.googleapis\.com[^"']*\1\s*\)?[^;]*;/g;

export function stripGoogleFontsImport(css: string): string {
  return css.replace(googleFontsImport, '');
}

export function selfHostFonts(): Plugin {
  return {
    name: 'self-host-fonts',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0];
      if (!file.includes('/@idds/') || !file.endsWith('.css')) return null;

      const stripped = stripGoogleFontsImport(code);
      return stripped === code ? null : { code: stripped, map: null };
    },
  };
}
