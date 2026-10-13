import { describe, expect, it } from 'vitest';
import { isSafeHref, normalizeHref } from './links';

describe('isSafeHref', () => {
  it.each([
    'https://www.menpan.go.id/',
    'http://contoh.go.id/halaman?a=1',
    'mailto:humas@menpan.go.id',
    '/portfolio',
    '/portfolio/integrasi-layanan?x=1#bagian',
  ])('menerima %s', (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//situs-lain.example',
    '/\\situs-lain.example',
    '\\\\situs-lain.example',
    'ftp://berkas.example',
    'https://',
    'mailto:bukan-email',
  ])('menolak %s', (href) => {
    expect(isSafeHref(href)).toBe(false);
  });
});

describe('normalizeHref', () => {
  it('melengkapi alamat tanpa skema menjadi https://', () => {
    expect(normalizeHref(' www.menpan.go.id ')).toBe('https://www.menpan.go.id');
    expect(normalizeHref('https://a.go.id')).toBe('https://a.go.id');
    expect(normalizeHref('mailto:a@b.go.id')).toBe('mailto:a@b.go.id');
    expect(normalizeHref('/portfolio')).toBe('/portfolio');
  });
});
