import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

interface SeoOptions {
  /** URL situs produksi tanpa path, mis. https://pemdi.panrb.go.id (VITE_SITE_URL). */
  siteUrl?: string;
  /** Berkas sumber data artikel; ID artikel dibaca darinya untuk sitemap. */
  articlesFile: string;
}

const staticPaths = ['/', '/portfolio', '/contact'];

/** Menghapus garis miring di akhir; hasil kosong/undefined berarti URL situs tidak diset. */
export function normalizeSiteUrl(siteUrl?: string): string | undefined {
  const base = siteUrl?.trim().replace(/\/+$/, '');
  return base || undefined;
}

/**
 * Membaca ID artikel dari teks sumber `articlesData.ts` (entri berindentasi 4 spasi: `    id: '1',`).
 * Diuji terhadap data asli (vite-plugins/seo.test.ts) agar perubahan format tidak diam-diam
 * menghasilkan sitemap yang salah.
 */
export function extractArticleIds(source: string): string[] {
  return [...source.matchAll(/^ {4}id: '([^']+)'/gm)].map((match) => match[1]);
}

export function buildRobotsTxt(base?: string): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (base) lines.push('', `Sitemap: ${base}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
}

export function buildSitemapXml(base: string, articleIds: string[]): string {
  const paths = [...staticPaths, ...articleIds.map((id) => `/portfolio/${encodeURIComponent(id)}`)];
  const urls = paths.map((path) => `  <url><loc>${base}${path}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/**
 * Membuat `robots.txt` (selalu) dan `sitemap.xml` (hanya bila `siteUrl` diisi,
 * karena sitemap mewajibkan URL absolut) saat build produksi.
 */
export function seo({ siteUrl, articlesFile }: SeoOptions): Plugin {
  const base = normalizeSiteUrl(siteUrl);

  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobotsTxt(base) });

      if (!base) {
        this.info('VITE_SITE_URL belum diset: sitemap.xml tidak dibuat.');
        return;
      }

      const ids = extractArticleIds(readFileSync(articlesFile, 'utf8'));
      if (ids.length === 0) {
        this.error(
          `Tidak ada ID artikel yang terbaca dari ${articlesFile}; format data berubah? Perbarui extractArticleIds di vite-plugins/seo.ts.`,
        );
      }

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: buildSitemapXml(base, ids),
      });
    },
  };
}
