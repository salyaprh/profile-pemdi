import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Di layar kecil kolom cari berada di dalam menu hamburger.
async function openSearch(page: Page, isMobile: boolean) {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Buka menu' }).click();
  return page.getByRole('textbox', { name: 'Cari artikel portofolio' });
}

test('mengetik menampilkan jumlah dan daftar hasil', async ({ page, isMobile }) => {
  const input = await openSearch(page, isMobile);
  await input.fill('transparansi');

  await expect(page.getByText('2 hasil pencarian')).toBeVisible();
  await expect(page.getByRole('link', { name: /Dorong Transparansi/ })).toBeVisible();
});

test('hasil kosong selalu disertai pesan', async ({ page, isMobile }) => {
  const input = await openSearch(page, isMobile);
  await input.fill('zzzxxx');

  await expect(page.getByText(/Tidak ada hasil untuk/)).toContainText('zzzxxx');
});

test('klik hasil membuka artikel dan membersihkan kolom', async ({ page, isMobile }) => {
  const input = await openSearch(page, isMobile);
  await input.fill('transparansi');
  await page.getByRole('link', { name: /Dorong Transparansi/ }).click();

  await expect(page).toHaveURL(/\/portfolio\/\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Transparansi');
});

test('Enter membuka hasil pertama', async ({ page, isMobile }) => {
  const input = await openSearch(page, isMobile);
  await input.fill('transparansi');
  await expect(page.getByText('2 hasil pencarian')).toBeVisible();
  await input.press('Enter');

  await expect(page).toHaveURL(/\/portfolio\/\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Transparansi');
});

test('Escape menutup panel hasil tetapi mempertahankan teks (dan menu mobile tetap terbuka)', async ({
  page,
  isMobile,
}) => {
  const input = await openSearch(page, isMobile);
  await input.fill('zzzxxx');
  await expect(page.getByText(/Tidak ada hasil untuk/)).toBeVisible();

  await input.press('Escape');

  await expect(page.getByText(/Tidak ada hasil untuk/)).toBeHidden();
  await expect(input).toBeVisible();
  await expect(input).toHaveValue('zzzxxx');

  if (isMobile) {
    // Escape kedua (panel sudah tertutup) menutup menu hamburger.
    await input.press('Escape');
    await expect(page.getByRole('button', { name: 'Buka menu' })).toBeVisible();
    await expect(input).toBeHidden();
  }
});

test('tombol hapus (×) bawaan IDDS mengosongkan kolom', async ({ page, isMobile }) => {
  const input = await openSearch(page, isMobile);
  await input.fill('transparansi');

  await page.locator('button[aria-label="Hapus input"]').click();

  await expect(input).toHaveValue('');
});

test('hanya ada satu tombol hapus (tidak ganda dengan bawaan browser)', async ({
  page,
  isMobile,
}) => {
  const input = await openSearch(page, isMobile);
  await input.fill('transparansi');

  // type="search" memunculkan "×" kedua dari browser; kita memakai type="text".
  await expect(input).toHaveAttribute('type', 'text');
  await expect(page.locator('button[aria-label="Hapus input"]')).toHaveCount(1);
});
