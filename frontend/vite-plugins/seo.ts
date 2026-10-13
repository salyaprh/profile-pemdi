import type { Plugin } from 'vite';

interface SeoOptions {
  /** URL situs produksi tanpa path, mis. https://pemdi.panrb.go.id (VITE_SITE_URL). */
  siteUrl?: string;
}

/** Menghapus garis miring di akhir; hasil kosong/undefined berarti URL situs tidak diset. */
export function normalizeSiteUrl(siteUrl?: string): string | undefined {
  const base = siteUrl?.trim().replace(/\/+$/, '');
  return base || undefined;
}

export function buildRobotsTxt(base?: string): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (base) lines.push('', `Sitemap: ${base}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
}

/**
 * Membuat `robots.txt` saat build produksi. `sitemap.xml` dibuat backend dari artikel terbit di
 * database (GET /sitemap.xml, lihat backend/app/Http/Controllers/SitemapController.php), jadi baris
 * Sitemap hanya ditambahkan bila `siteUrl` diisi (sitemap mewajibkan URL absolut).
 */
export function seo({ siteUrl }: SeoOptions): Plugin {
  const base = normalizeSiteUrl(siteUrl);

  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobotsTxt(base) });
      if (!base) this.info('VITE_SITE_URL belum diset: robots.txt tanpa baris Sitemap.');
    },
  };
}
