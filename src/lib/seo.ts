import { useEffect } from 'react';
import { siteDescription, siteName } from '../data/siteContent';

const siteUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/+$/, '');

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string | null) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}

interface PageMeta {
  title: string;
  description?: string;
  /** Path kanonis halaman ini (tanpa query), mis. "/portfolio/3". */
  path?: string;
  /** Halaman yang tidak boleh diindeks mesin pencari (mis. 404). */
  noindex?: boolean;
}

/**
 * Memperbarui <title> dan meta SEO sesuai halaman aktif. URL kanonis/og:url
 * hanya diisi bila VITE_SITE_URL diset (harus absolut).
 *
 * Catatan: ini dieksekusi di browser. Mesin pencari yang menjalankan JS membacanya,
 * tetapi pratinjau tautan (WhatsApp, dll.) hanya membaca meta statis di index.html.
 */
export function usePageMeta({
  title,
  description = siteDescription,
  path,
  noindex = false,
}: PageMeta) {
  useEffect(() => {
    const fullTitle = `${title} | ${siteName}`;
    document.title = fullTitle;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'robots', noindex ? 'noindex' : null);

    const url = siteUrl && path !== undefined ? `${siteUrl}${path}` : null;
    setCanonical(url);
    setMeta('property', 'og:url', url);
  }, [title, description, path, noindex]);
}
