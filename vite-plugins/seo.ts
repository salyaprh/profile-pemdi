import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

interface SeoOptions {
  /** URL situs produksi tanpa path, mis. https://pemdi.panrb.go.id (VITE_SITE_URL). */
  siteUrl?: string;
  /** Berkas sumber data artikel; ID artikel dibaca darinya untuk sitemap. */
  articlesFile: string;
}

const staticPaths = ['/', '/portfolio', '/contact'];

/**
 * Membuat `robots.txt` (selalu) dan `sitemap.xml` (hanya bila `siteUrl` diisi,
 * karena sitemap mewajibkan URL absolut) saat build produksi.
 */
export function seo({ siteUrl, articlesFile }: SeoOptions): Plugin {
  const base = siteUrl?.trim().replace(/\/+$/, '');

  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /'];
      if (base) robots.push('', `Sitemap: ${base}/sitemap.xml`);
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `${robots.join('\n')}\n`,
      });

      if (!base) {
        this.info('VITE_SITE_URL belum diset: sitemap.xml tidak dibuat.');
        return;
      }

      const source = readFileSync(articlesFile, 'utf8');
      const ids = [...source.matchAll(/^ {4}id: '([^']+)'/gm)].map((m) => m[1]);
      if (ids.length === 0) {
        this.error(
          `Tidak ada ID artikel yang terbaca dari ${articlesFile}; format data berubah? Perbarui regex di vite-plugins/seo.ts.`,
        );
      }

      const paths = [
        ...staticPaths,
        ...ids.map((id) => `/portfolio/${encodeURIComponent(id)}`),
      ];
      const urls = paths.map((path) => `  <url><loc>${base}${path}</loc></url>`);
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      });
    },
  };
}
