import type { Page, Route } from '@playwright/test';
import { expect, test } from './fixtures';

const API = '**/api/contact';

async function fillValid(page: Page) {
  await page.getByLabel(/Nama lengkap/).fill('Budi Santoso');
  await page.getByLabel(/^Email/).fill('budi@instansi.go.id');
  await page.getByLabel(/Subjek/).fill('Kolaborasi program');
  await page.getByLabel(/^Pesan/).fill('Halo, kami ingin berdiskusi terkait kolaborasi program.');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/contact');
});

test('submit kosong menampilkan error tiap field wajib dan memfokuskan field pertama', async ({
  page,
}) => {
  let requests = 0;
  await page.route(API, async (route) => {
    requests += 1;
    await route.fulfill({ status: 200, body: '{}' });
  });

  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  await expect(page.getByText('Nama lengkap wajib diisi')).toBeVisible();
  await expect(page.getByText('Email wajib diisi')).toBeVisible();
  await expect(page.getByText('Subjek wajib diisi')).toBeVisible();
  await expect(page.getByText('Pesan wajib diisi')).toBeVisible();
  await expect(page.getByLabel(/Nama lengkap/)).toBeFocused();
  expect(requests).toBe(0);
});

test('validasi berjalan langsung setelah submit pertama', async ({ page }) => {
  await page.getByRole('button', { name: 'Kirim pesan' }).click();
  await expect(page.getByText('Email wajib diisi')).toBeVisible();

  await page.getByLabel(/^Email/).fill('budi@instansi');
  await expect(page.getByText('Format email tidak valid')).toBeVisible();

  await page.getByLabel(/^Email/).fill('budi@instansi.go.id');
  await expect(page.getByText('Format email tidak valid')).toBeHidden();
});

test('berhasil: mengirim JSON yang benar, menampilkan toast, dan mengosongkan form', async ({
  page,
}) => {
  let body: unknown;
  await page.route(API, async (route: Route) => {
    body = route.request().postDataJSON();
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await fillValid(page);

  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  await expect(page.getByText('Pesan terkirim')).toBeVisible();
  expect(body).toEqual({
    name: 'Budi Santoso',
    email: 'budi@instansi.go.id',
    phone: '',
    subject: 'Kolaborasi program',
    message: 'Halo, kami ingin berdiskusi terkait kolaborasi program.',
  });
  await expect(page.getByLabel(/Nama lengkap/)).toHaveValue('');
});

test('nomor ponsel dikirim dalam format internasional', async ({ page }) => {
  let body: { phone?: string } = {};
  await page.route(API, async (route) => {
    body = route.request().postDataJSON() as { phone?: string };
    await route.fulfill({ status: 200, body: '{}' });
  });
  await fillValid(page);
  await page.getByPlaceholder('878-8668-3355').fill('81234567890');

  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  await expect(page.getByText('Pesan terkirim')).toBeVisible();
  expect(body.phone).toMatch(/^\+62\d{9,13}$/);
});

test('dropdown negara pada input telepon terbuka dengan banyak pilihan', async ({ page }) => {
  await page.getByRole('button', { name: 'Pilih negara' }).click();
  await expect.poll(() => page.getByRole('option').count()).toBeGreaterThan(200);
});

test('gagal (HTTP 500): menampilkan toast error dan mempertahankan isian', async ({
  page,
  problems,
}) => {
  problems.allowConsoleErrors.push(/status of 500/);
  await page.route(API, (route) => route.fulfill({ status: 500, body: 'error' }));
  await fillValid(page);

  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  await expect(page.getByText('Pesan gagal dikirim')).toBeVisible();
  await expect(page.getByLabel(/Nama lengkap/)).toHaveValue('Budi Santoso');
  await expect(page.getByRole('button', { name: 'Kirim pesan' })).toBeEnabled();
});

test('gagal (jaringan terputus): menampilkan toast error', async ({ page, problems }) => {
  problems.allowConsoleErrors.push(/Failed to load resource|ERR_FAILED/);
  await page.route(API, (route) => route.abort('failed'));
  await fillValid(page);

  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  await expect(page.getByText('Pesan gagal dikirim')).toBeVisible();
  await expect(page.getByLabel(/Subjek/)).toHaveValue('Kolaborasi program');
});

test('klik ganda hanya mengirim satu permintaan', async ({ page }) => {
  let requests = 0;
  await page.route(API, async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({ status: 200, body: '{}' });
  });
  await fillValid(page);

  const button = page.getByRole('button', { name: 'Kirim pesan' });
  await button.dblclick();

  await expect(page.getByText('Pesan terkirim')).toBeVisible();
  expect(requests).toBe(1);
});

test('selama pengiriman tombol menampilkan "Mengirim…" dan dinonaktifkan', async ({ page }) => {
  await page.route(API, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ status: 200, body: '{}' });
  });
  await fillValid(page);

  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  const pending = page.getByRole('button', { name: 'Mengirim…' });
  await expect(pending).toBeVisible();
  await expect(pending).toBeDisabled();
  await expect(page.getByText('Pesan terkirim')).toBeVisible();
});
