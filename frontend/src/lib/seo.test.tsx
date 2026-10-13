import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { siteDescription } from '../data/siteContent';

async function loadHook(siteUrl: string) {
  // seo.ts membaca VITE_SITE_URL saat modul dimuat, jadi modul dimuat ulang per skenario.
  vi.resetModules();
  vi.stubEnv('VITE_SITE_URL', siteUrl);
  return (await import('./seo')).usePageMeta;
}

const meta = (selector: string) =>
  document.head.querySelector<HTMLMetaElement>(selector)?.getAttribute('content') ?? null;
const canonical = () =>
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href') ??
  null;

describe('usePageMeta', () => {
  it('mengatur title, deskripsi, og:*, dan twitter:*', async () => {
    const usePageMeta = await loadHook('');
    renderHook(() => usePageMeta({ title: 'Portofolio', description: 'Deskripsi khusus' }));

    expect(document.title).toBe('Portofolio | PEMDI PANRB');
    expect(meta('meta[name="description"]')).toBe('Deskripsi khusus');
    expect(meta('meta[property="og:title"]')).toBe('Portofolio | PEMDI PANRB');
    expect(meta('meta[property="og:description"]')).toBe('Deskripsi khusus');
    expect(meta('meta[name="twitter:title"]')).toBe('Portofolio | PEMDI PANRB');
    expect(meta('meta[name="twitter:description"]')).toBe('Deskripsi khusus');
  });

  it('memakai deskripsi situs bila tidak diberikan', async () => {
    const usePageMeta = await loadHook('');
    renderHook(() => usePageMeta({ title: 'Beranda' }));
    expect(meta('meta[name="description"]')).toBe(siteDescription);
  });

  it('mengisi canonical dan og:url absolut bila VITE_SITE_URL diset (garis miring akhir diabaikan)', async () => {
    const usePageMeta = await loadHook('https://pemdi.go.id/');
    renderHook(() => usePageMeta({ title: 'Artikel', path: '/portfolio/3' }));

    expect(canonical()).toBe('https://pemdi.go.id/portfolio/3');
    expect(meta('meta[property="og:url"]')).toBe('https://pemdi.go.id/portfolio/3');
  });

  it('tidak membuat canonical/og:url bila VITE_SITE_URL tidak diset', async () => {
    const usePageMeta = await loadHook('');
    renderHook(() => usePageMeta({ title: 'Artikel', path: '/portfolio/3' }));

    expect(canonical()).toBeNull();
    expect(meta('meta[property="og:url"]')).toBeNull();
  });

  it('tidak membuat canonical bila path tidak diberikan (mis. halaman 404)', async () => {
    const usePageMeta = await loadHook('https://pemdi.go.id');
    renderHook(() => usePageMeta({ title: 'Tidak ditemukan' }));
    expect(canonical()).toBeNull();
  });

  it('noindex menambah robots dan dicabut saat tidak lagi noindex', async () => {
    const usePageMeta = await loadHook('');
    const { rerender } = renderHook(
      (props: { noindex: boolean }) => usePageMeta({ title: 'X', noindex: props.noindex }),
      { initialProps: { noindex: true } },
    );

    expect(meta('meta[name="robots"]')).toBe('noindex');
    rerender({ noindex: false });
    expect(meta('meta[name="robots"]')).toBeNull();
  });

  it('memperbarui canonical saat path berubah dan menghapusnya bila path hilang', async () => {
    const usePageMeta = await loadHook('https://pemdi.go.id');
    const { rerender } = renderHook<void, { path?: string }>(
      (props) => usePageMeta({ title: 'X', path: props.path }),
      { initialProps: { path: '/portfolio' } },
    );

    expect(canonical()).toBe('https://pemdi.go.id/portfolio');
    rerender({ path: '/contact' });
    expect(canonical()).toBe('https://pemdi.go.id/contact');
    rerender({ path: undefined });
    expect(canonical()).toBeNull();
  });

  it('tidak menggandakan tag meta pada pembaruan berulang', async () => {
    const usePageMeta = await loadHook('https://pemdi.go.id');
    const { rerender } = renderHook(
      (props: { title: string }) => usePageMeta({ title: props.title, path: '/' }),
      { initialProps: { title: 'A' } },
    );
    rerender({ title: 'B' });
    rerender({ title: 'C' });

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.title).toBe('C | PEMDI PANRB');
  });
});
