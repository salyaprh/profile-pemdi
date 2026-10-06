import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { selfHostFonts, stripGoogleFontsImport } from './selfHostFonts';

describe('stripGoogleFontsImport', () => {
  it('membuang @import Google Fonts persis seperti di CSS @idds/react (tanpa spasi, URL ber-titik-koma)', () => {
    const css =
      '@import"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap";.a{color:red}';
    expect(stripGoogleFontsImport(css)).toBe('.a{color:red}');
  });

  it.each([
    [
      'dengan url() dan petik ganda',
      '@import url("https://fonts.googleapis.com/css2?family=Inter");.a{b:c}',
    ],
    [
      'dengan url() dan petik tunggal',
      "@import url('https://fonts.googleapis.com/css2?family=Inter');.a{b:c}",
    ],
    [
      'dengan spasi dan petik tunggal',
      "@import  'https://fonts.googleapis.com/css2?family=Inter' ;.a{b:c}",
    ],
    [
      'dengan media query',
      '@import "https://fonts.googleapis.com/css2?family=Inter" screen;.a{b:c}',
    ],
  ])('membuang varian %s', (_nama, css) => {
    expect(stripGoogleFontsImport(css)).toBe('.a{b:c}');
  });

  it('tidak menyentuh @import lain', () => {
    const css = '@import "./lokal.css";@import url("https://cdn.example.com/x.css");.a{b:c}';
    expect(stripGoogleFontsImport(css)).toBe(css);
  });

  it('tidak mengubah CSS tanpa @import Google Fonts', () => {
    const css = '.a{font-family:Inter,sans-serif}';
    expect(stripGoogleFontsImport(css)).toBe(css);
  });
});

describe('plugin selfHostFonts', () => {
  const plugin = selfHostFonts();
  const transform = plugin.transform as unknown as (code: string, id: string) => unknown;
  const css = '@import"https://fonts.googleapis.com/css2?family=Inter&display=swap";.a{b:c}';

  it('berjalan sebelum plugin CSS Vite', () => {
    expect(plugin.enforce).toBe('pre');
  });

  it('mengubah CSS milik @idds', () => {
    expect(transform(css, '/x/node_modules/@idds/react/dist/index.css')).toEqual({
      code: '.a{b:c}',
      map: null,
    });
    expect(transform(css, '/x/node_modules/@idds/react/dist/index.css?direct')).toEqual({
      code: '.a{b:c}',
      map: null,
    });
  });

  it('mengabaikan CSS bukan milik @idds dan berkas non-CSS', () => {
    expect(transform(css, '/proyek/src/index.css')).toBeNull();
    expect(transform(css, '/x/node_modules/@idds/react/dist/index.es.js')).toBeNull();
  });

  it('mengabaikan CSS @idds yang tidak mengandung import Google Fonts', () => {
    expect(transform('.a{b:c}', '/x/node_modules/@idds/react/dist/index.css')).toBeNull();
  });
});

describe('CSS @idds/react terpasang', () => {
  it('tidak lagi merujuk Google Fonts setelah dibersihkan plugin', () => {
    const css = readFileSync(resolve('node_modules/@idds/react/dist/index.css'), 'utf8');
    const cleaned = stripGoogleFontsImport(css);
    expect(cleaned).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    // Pembersihan tidak boleh memakan CSS lain: ukuran hanya berkurang sebesar @import itu.
    expect(css.length - cleaned.length).toBeLessThan(200);
  });
});
