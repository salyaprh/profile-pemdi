import type { Page } from '@playwright/test';

/**
 * Membuka beranda dan mengembalikan kolom cari. Di layar kecil kolom cari berada di dalam
 * menu hamburger, jadi menu dibuka dulu. Percabangan ada di sini (bukan di badan uji).
 */
export async function openSearch(page: Page, isMobile: boolean) {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Buka menu' }).click();
  return page.getByRole('textbox', { name: 'Cari artikel portofolio' });
}
