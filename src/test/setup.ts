import '@testing-library/jest-dom/vitest';
// Vitest tanpa `globals: true` tidak mendaftarkan cleanup otomatis RTL; tanpa ini DOM menumpuk
// antar uji (98 uji gagal saat dicoba). Karena itu aturan no-manual-cleanup dinonaktifkan di sini.
// eslint-disable-next-line testing-library/no-manual-cleanup
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  // jsdom tidak mengimplementasikan scrollTo; router memanggilnya saat berpindah halaman.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  document.head
    .querySelectorAll('meta[name], meta[property], link[rel="canonical"]')
    .forEach((el) => {
      // Hanya hapus tag yang dibuat tes/hook SEO; meta statis lain tidak ada di lingkungan jsdom.
      el.remove();
    });
});
