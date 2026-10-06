import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(path), 'utf8');

/** Memecah isi _headers menjadi { pola: [[header, nilai], ...] }. */
function parseHeadersFile(text: string) {
  const rules = new Map<string, [string, string][]>();
  let current: [string, string][] | null = null;
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = [];
      rules.set(line.trim(), current);
      continue;
    }
    const index = line.indexOf(':');
    current?.push([line.slice(0, index).trim(), line.slice(index + 1).trim()]);
  }
  return rules;
}

function parseDirectives(csp: string) {
  const directives = new Map<string, string[]>();
  for (const part of csp.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) directives.set(name, values);
  }
  return directives;
}

const headers = parseHeadersFile(read('public/_headers'));
const global = headers.get('/*') ?? [];
const csp = global.find(([name]) => name === 'Content-Security-Policy')?.[1] ?? '';
const directives = parseDirectives(csp);

describe('public/_headers', () => {
  it('memiliki aturan global dan CSP', () => {
    expect(global.length).toBeGreaterThan(0);
    expect(csp).not.toBe('');
  });

  it('memasang header keamanan dasar', () => {
    const names = global.map(([name]) => name);
    for (const required of [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
    ]) {
      expect(names, required).toContain(required);
    }
    expect(global.find(([n]) => n === 'X-Content-Type-Options')?.[1]).toBe('nosniff');
    expect(global.find(([n]) => n === 'X-Frame-Options')?.[1]).toBe('DENY');
  });

  it('HSTS berlaku minimal 1 tahun', () => {
    const hsts = global.find(([n]) => n === 'Strict-Transport-Security')?.[1] ?? '';
    expect(Number(/max-age=(\d+)/.exec(hsts)?.[1])).toBeGreaterThanOrEqual(31536000);
  });

  it('tidak ada header ganda di aturan global (Cloudflare menggabungkannya dengan koma)', () => {
    const names = global.map(([n]) => n.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('Cache-Control hanya di aturan khusus, tidak di aturan global', () => {
    expect(global.some(([n]) => n.toLowerCase() === 'cache-control')).toBe(false);
    expect(headers.get('/assets/*')?.find(([n]) => n === 'Cache-Control')?.[1]).toContain(
      'immutable',
    );
  });

  it('berkas ber-hash saja yang di-cache immutable; /images tidak', () => {
    const images = headers.get('/images/*')?.find(([n]) => n === 'Cache-Control')?.[1] ?? '';
    expect(images).not.toContain('immutable');
  });
});

describe('Content-Security-Policy', () => {
  it('default-src hanya origin sendiri', () => {
    expect(directives.get('default-src')).toEqual(["'self'"]);
  });

  it('script-src dan style-src tidak memakai unsafe-inline/unsafe-eval', () => {
    for (const name of ['script-src', 'style-src']) {
      const values = directives.get(name) ?? [];
      expect(values, name).not.toContain("'unsafe-inline'");
      expect(values, name).not.toContain("'unsafe-eval'");
    }
  });

  it('script-src hanya origin sendiri', () => {
    expect(directives.get('script-src')).toEqual(["'self'"]);
  });

  it('menutup embedding, plugin, dan pembajakan base/form', () => {
    expect(directives.get('frame-ancestors')).toEqual(["'none'"]);
    expect(directives.get('object-src')).toEqual(["'none'"]);
    expect(directives.get('base-uri')).toEqual(["'self'"]);
    expect(directives.get('form-action')).toEqual(["'self'"]);
    expect(directives.has('upgrade-insecure-requests')).toBe(true);
  });

  it('tidak mengizinkan host eksternal mana pun (font, gambar, koneksi)', () => {
    expect(csp).not.toMatch(/https?:\/\//);
    expect(csp).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    expect(directives.get('connect-src')).toEqual(["'self'"]);
    expect(directives.get('font-src')).toEqual(["'self'"]);
  });

  it('hash style IDDS (Skeleton) cocok dengan isi style di @idds/react terpasang', () => {
    // @idds/react menyisipkan <style id="skeleton-shimmer-keyframes"> saat runtime. Bila isinya
    // berubah setelah upgrade, hash di _headers usang dan CSP memblokirnya (konsol: pelanggaran
    // style-src). Perbarui hash di public/_headers dan deploy/nginx.conf.example.
    const bundle = read('node_modules/@idds/react/dist/index.es.js');
    const match = /"skeleton-shimmer-keyframes",\s*\w+\s*=\s*`([^`]*)`/.exec(bundle);
    expect(
      match,
      'IDDS tidak lagi menyisipkan style skeleton: hapus hash dari _headers',
    ).not.toBeNull();

    const hash = createHash('sha256')
      .update(match?.[1] ?? '')
      .digest('base64');
    expect(directives.get('style-src')).toContain(`'sha256-${hash}'`);
  });

  it('@keyframes shimmer juga didefinisikan di CSS sendiri (animasi tetap jalan bila hash usang)', () => {
    expect(read('src/index.css')).toMatch(/@keyframes\s+shimmer/);
  });
});

describe('deploy/nginx.conf.example', () => {
  const nginx = read('deploy/nginx.conf.example');

  it('memakai CSP yang persis sama dengan public/_headers (hindari drift)', () => {
    const nginxCsp = /add_header Content-Security-Policy "([^"]+)"/.exec(nginx)?.[1];
    expect(nginxCsp).toBe(csp);
  });

  it('memuat header keamanan yang sama dengan _headers', () => {
    for (const [name, value] of global) {
      if (name === 'Content-Security-Policy') continue;
      expect(nginx, name).toContain(`add_header ${name} "${value}"`);
    }
  });

  it('menyembunyikan _headers dan memakai fallback SPA', () => {
    expect(nginx).toMatch(/location = \/_headers\s*\{\s*return 404;/);
    expect(nginx).toContain('try_files $uri /index.html;');
  });
});
