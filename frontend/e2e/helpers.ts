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

/**
 * Membuka submenu Portofolio: dropdown header di layar lebar, atau menu hamburger di layar kecil
 * (submenu sudah terbuka di halaman portofolio).
 */
export async function openPortfolioSubmenu(page: Page, isMobile: boolean) {
  const toggle = isMobile
    ? page.getByRole('button', { name: 'Buka menu' })
    : page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', {
        name: 'Portofolio',
      });
  await toggle.click();
}

/**
 * Artikel placeholder dari seeder backend (database e2e). Uji lain bisa menerbitkan artikel baru
 * di kategori Layanan Publik secara paralel, jadi uji yang menghitung jumlah artikel memakai
 * kategori Panduan Pengguna (11 artikel) atau pola angka.
 */
export const seeded = {
  /** Kategori Layanan Publik. */
  serviceArticle: {
    slug: 'mulai-2025-informasi-layanan-publik-terpusat-di-inagov',
    title: 'Mulai 2025, Informasi Layanan Publik Terpusat di INAgov',
  },
  /** Kategori Kebijakan & Regulasi. */
  policyArticle: {
    slug: 'pemerintah-perkuat-layanan-digital-asn-melalui-integrasi-inagov',
    title: 'Pemerintah Perkuat Layanan Digital ASN Melalui Integrasi INAgov',
  },
  guideCount: 11,
} as const;
