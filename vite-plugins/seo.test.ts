import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { articles } from '../src/data/articlesData';
import { buildRobotsTxt, buildSitemapXml, extractArticleIds, normalizeSiteUrl, seo } from './seo';

const articlesFile = resolve('src/data/articlesData.ts');

describe('extractArticleIds', () => {
  it('membaca ID persis sama dengan data artikel asli (menjaga regex tetap sinkron)', () => {
    expect(extractArticleIds(readFileSync(articlesFile, 'utf8'))).toEqual(
      articles.map((a) => a.id),
    );
  });

  it('hanya mengambil entri berindentasi 4 spasi', () => {
    const source =
      "  {\n    id: '1',\n    title: 'x',\n  },\n  const nested = { id: 'abaikan' };\n";
    expect(extractArticleIds(source)).toEqual(['1']);
  });

  it('mengembalikan array kosong bila format tak dikenali', () => {
    expect(extractArticleIds('export const articles = [];')).toEqual([]);
  });
});

describe('normalizeSiteUrl', () => {
  it.each([
    ['https://pemdi.go.id', 'https://pemdi.go.id'],
    ['https://pemdi.go.id/', 'https://pemdi.go.id'],
    ['  https://pemdi.go.id///  ', 'https://pemdi.go.id'],
    ['', undefined],
    ['   ', undefined],
    [undefined, undefined],
  ])('%j -> %j', (input, expected) => {
    expect(normalizeSiteUrl(input)).toBe(expected);
  });
});

describe('buildRobotsTxt', () => {
  it('mengizinkan semua tanpa baris Sitemap bila URL situs tidak ada', () => {
    expect(buildRobotsTxt()).toBe('User-agent: *\nAllow: /\n');
  });

  it('menambahkan baris Sitemap absolut bila URL situs ada', () => {
    expect(buildRobotsTxt('https://pemdi.go.id')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://pemdi.go.id/sitemap.xml\n',
    );
  });
});

describe('buildSitemapXml', () => {
  const xml = buildSitemapXml('https://pemdi.go.id', ['1', '2', 'a b']);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it('memuat halaman statis dan artikel, semuanya URL absolut', () => {
    expect(locs).toEqual([
      'https://pemdi.go.id/',
      'https://pemdi.go.id/portfolio',
      'https://pemdi.go.id/contact',
      'https://pemdi.go.id/portfolio/1',
      'https://pemdi.go.id/portfolio/2',
      'https://pemdi.go.id/portfolio/a%20b',
    ]);
  });

  it('berformat XML sitemap yang benar', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns=')).toBe(true);
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });

  it('untuk data asli menghasilkan 3 halaman statis + semua artikel', () => {
    const real = buildSitemapXml(
      'https://pemdi.go.id',
      articles.map((a) => a.id),
    );
    expect(real.match(/<loc>/g)).toHaveLength(3 + articles.length);
  });
});

describe('plugin seo (generateBundle)', () => {
  type Hook = (this: unknown) => void;

  function run(siteUrl: string | undefined, file = articlesFile) {
    const emitted: { fileName: string; source: string }[] = [];
    const info = vi.fn();
    const context = {
      emitFile: (f: { fileName: string; source: string }) => emitted.push(f),
      info,
      error: (message: string) => {
        throw new Error(message);
      },
    };
    const plugin = seo({ siteUrl, articlesFile: file });
    (plugin.generateBundle as unknown as Hook).call(context);
    return { emitted, info };
  }

  it('menghasilkan robots.txt dan sitemap.xml saat URL situs diset', () => {
    const { emitted } = run('https://pemdi.go.id/');
    expect(emitted.map((f) => f.fileName)).toEqual(['robots.txt', 'sitemap.xml']);
    expect(emitted[0].source).toContain('Sitemap: https://pemdi.go.id/sitemap.xml');
    expect(emitted[1].source.match(/<loc>/g)).toHaveLength(3 + articles.length);
  });

  it('hanya menghasilkan robots.txt (tanpa Sitemap) saat URL situs tidak diset', () => {
    const { emitted, info } = run(undefined);
    expect(emitted.map((f) => f.fileName)).toEqual(['robots.txt']);
    expect(emitted[0].source).not.toContain('Sitemap');
    expect(info).toHaveBeenCalledWith(expect.stringContaining('VITE_SITE_URL'));
  });

  it('gagal dengan pesan jelas bila ID artikel tidak terbaca (format data berubah)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'seo-test-'));
    const broken = join(dir, 'articlesData.ts');
    writeFileSync(broken, 'export const articles = [];');
    expect(() => run('https://pemdi.go.id', broken)).toThrow(/extractArticleIds/);
  });

  it('hanya aktif pada build produksi', () => {
    expect(seo({ articlesFile }).apply).toBe('build');
  });
});
