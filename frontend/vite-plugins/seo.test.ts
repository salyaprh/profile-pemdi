import { describe, expect, it, vi } from 'vitest';
import { buildRobotsTxt, normalizeSiteUrl, seo } from './seo';

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

describe('plugin seo (generateBundle)', () => {
  type Hook = (this: unknown) => void;

  function run(siteUrl: string | undefined) {
    const emitted: { fileName: string; source: string }[] = [];
    const info = vi.fn();
    const plugin = seo({ siteUrl });
    (plugin.generateBundle as unknown as Hook).call({
      emitFile: (f: { fileName: string; source: string }) => emitted.push(f),
      info,
    });
    return { emitted, info };
  }

  it('hanya menghasilkan robots.txt (sitemap.xml dibuat backend dari database)', () => {
    const { emitted, info } = run('https://pemdi.go.id/');
    expect(emitted.map((f) => f.fileName)).toEqual(['robots.txt']);
    expect(emitted[0].source).toContain('Sitemap: https://pemdi.go.id/sitemap.xml');
    expect(info).not.toHaveBeenCalled();
  });

  it('tanpa URL situs: robots.txt tanpa Sitemap dan memberi tahu saat build', () => {
    const { emitted, info } = run(undefined);
    expect(emitted[0].source).not.toContain('Sitemap');
    expect(info).toHaveBeenCalledWith(expect.stringContaining('VITE_SITE_URL'));
  });

  it('hanya aktif pada build produksi', () => {
    expect(seo({}).apply).toBe('build');
  });
});
