/**
 * Tautan yang boleh dipasang di isi artikel: https/http, mailto, atau path di situs sendiri.
 * Sama dengan aturan penyaring di backend (App\Support\ArticleHtmlSanitizer), sehingga yang
 * diterima editor tidak dibuang diam-diam saat disimpan.
 */
export function isSafeHref(value: string): boolean {
  const href = value.trim();
  if (/^[/\\]{2}/.test(href)) return false; // //situs-lain dibaca browser sebagai situs lain
  if (href.startsWith('/')) return true;
  return /^(https?:\/\/[^\s/]+\.[^\s]+|mailto:[^\s@]+@[^\s@]+\.[^\s@]+)$/i.test(href);
}

/** Melengkapi alamat tanpa skema ("www.menpan.go.id") menjadi https://. */
export function normalizeHref(value: string): string {
  const href = value.trim();
  if (/^(https?:|mailto:|\/)/i.test(href)) return href;
  return `https://${href}`;
}
