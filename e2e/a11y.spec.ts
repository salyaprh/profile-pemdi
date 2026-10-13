import type { Page } from '@playwright/test';
import { audit } from './a11y.helper';
import { expect, test } from './fixtures';
import { openSearch } from './helpers';

const pages = [
  ['beranda', '/'],
  ['portofolio', '/portfolio'],
  ['portofolio terfilter', '/portfolio?kategori=Layanan+Publik&halaman=2'],
  ['detail artikel', '/portfolio/3'],
  ['kontak', '/contact'],
  ['404', '/halaman-ngawur'],
  ['artikel tidak ditemukan', '/portfolio/999'],
] as const;

async function ready(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const [name, path] of pages) {
  test(`axe WCAG 2.2 AA: ${name}`, async ({ page }) => {
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
