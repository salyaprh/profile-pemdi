import type { Page } from '@playwright/test';
import { audit } from './a11y.helper';
import { fillLogin, loginAs } from './admin.helper';
import { expect, test } from './fixtures';
import { openPortfolioSubmenu, openSearch, seeded } from './helpers';

const pages = [
  ['beranda', '/'],
  ['portofolio', '/portfolio'],
  ['portofolio terfilter', '/portfolio?kategori=layanan-publik&halaman=2'],
  ['detail artikel', `/portfolio/${seeded.serviceArticle.slug}`],
  ['kontak', '/contact'],
  ['404', '/halaman-ngawur'],
  ['artikel tidak ditemukan', '/portfolio/999'],
] as const;

async function ready(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Data dari API sudah tampil (kerangka kartu/artikel sudah hilang).
  await expect(page.getByText(/^Memuat artikel/)).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

for (const [name, path] of pages) {
  test(`axe WCAG 2.2 AA: ${name}`, async ({ page, problems }) => {
    // Artikel tidak ditemukan = respons 404 dari API, yang dicatat browser sebagai error konsol.
    problems.allowConsoleErrors.push(/status of 404/);
    await ready(page, path);
    expect(await audit(page)).toEqual([]);
  });
}

test('axe: formulir kontak dengan pesan error validasi', async ({ page }) => {
  await ready(page, '/contact');
  await page.getByRole('button', { name: 'Kirim pesan' }).click();
  await expect(page.getByText('Nama lengkap wajib diisi')).toBeVisible();

  expect(await audit(page)).toEqual([]);
});

test('axe: formulir kontak setelah berhasil (toast tampil)', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ status: 200, body: '{}' }));
  await ready(page, '/contact');
  await page.getByLabel(/Nama lengkap/).fill('Budi Santoso');
  await page.getByLabel(/^Email/).fill('budi@instansi.go.id');
  await page.getByLabel(/Subjek/).fill('Kolaborasi program');
  await page.getByLabel(/^Pesan/).fill('Halo, kami ingin berdiskusi terkait kolaborasi program.');
  await page.getByRole('button', { name: 'Kirim pesan' }).click();
  await expect(page.getByText('Pesan terkirim')).toBeVisible();
  // Tunggu animasi fade-in toast selesai: pada opacity < 1 axe membaca warna campuran
  // (rasio 1,15) yang bukan warna sebenarnya.
  await expect(page.locator('.ina-toast').first()).toHaveCSS('opacity', '1');

  expect(await audit(page)).toEqual([]);
});

test('axe: dropdown negara pada input telepon terbuka', async ({ page }) => {
  await ready(page, '/contact');
  await page.getByRole('button', { name: 'Pilih negara' }).click();
  await expect(page.getByRole('option').first()).toBeVisible();

  // Pengecualian terdokumentasi: daftar negara milik PhoneInput IDDS berperan sebagai input ARIA
  // tetapi tidak menyediakan prop untuk memberinya nama (axe: aria-input-field-name). Hanya
  // selector ini yang dikecualikan; pelanggaran lain di halaman tetap dilaporkan. Perlu
  // dilaporkan ke tim IDDS (ux@inadigital.co.id).
  expect(await audit(page, { exclude: ['.ina-phone-input__country-list'] })).toEqual([]);
});

test('axe: submenu Portofolio terbuka', async ({ page, isMobile }) => {
  await ready(page, '/portfolio');
  await openPortfolioSubmenu(page, isMobile);
  await expect(page.getByRole('link', { name: 'Panduan Pengguna' }).first()).toBeVisible();

  expect(await audit(page)).toEqual([]);
});

test('axe: panel hasil pencarian terbuka', async ({ page, isMobile }) => {
  const input = await openSearch(page, isMobile);
  await input.fill('transparansi');
  await expect(page.getByText('2 hasil pencarian')).toBeVisible();

  expect(await audit(page)).toEqual([]);
});

test('axe: panel pencarian tanpa hasil', async ({ page, isMobile }) => {
  const input = await openSearch(page, isMobile);
  await input.fill('zzzxxx');
  await expect(page.getByText(/Tidak ada hasil untuk/)).toBeVisible();

  expect(await audit(page)).toEqual([]);
});

test.describe('panel admin', () => {
  test('axe: halaman Masuk', async ({ page }) => {
    await ready(page, '/admin/masuk');
    expect(await audit(page)).toEqual([]);
  });

  test('axe: halaman Masuk dengan pesan error', async ({ page, problems }) => {
    problems.allowConsoleErrors.push(/status of 422/);
    await ready(page, '/admin/masuk');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByText('Email wajib diisi')).toBeVisible();
    expect(await audit(page)).toEqual([]);

    // Email berbeda dari admin.spec.ts agar batas percobaan login per akun tidak saling memengaruhi.
    await fillLogin(page, 'akun-uji-a11y@pemdi.test', 'BukanKataSandi123');
    await expect(page.getByRole('alert')).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test('axe: dasbor Admin', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page.getByRole('region', { name: 'Aktivitas terbaru' })).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test('axe: halaman admin tidak ditemukan', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/tidak-ada');
    await expect(page.getByText('Halaman admin tidak ditemukan')).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });
});
