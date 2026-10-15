import type { Page } from '@playwright/test';
import { audit } from './a11y.helper';
import { loginAs, uniqueSuffix } from './admin.helper';
import { expect, test } from './fixtures';

// Formulir kontak terhadap backend Laravel sungguhan (POST /api/contact tanpa sesi). Kegagalan
// server dan jaringan disimulasikan dengan page.route.
const API = '**/api/contact';

async function fillValid(page: Page, subject = 'Kolaborasi program') {
  await page.getByLabel(/Nama lengkap/).fill('Budi Santoso');
  await page.getByLabel(/^Email/).fill('budi@instansi.go.id');
  await page.getByLabel(/Subjek/).fill(subject);
  await page.getByLabel(/^Pesan/).fill('Halo, kami ingin berdiskusi terkait kolaborasi program.');
}

const accepted = {
  status: 202,
  contentType: 'application/json',
  body: '{"message":"Pesan diterima."}',
};

test.beforeEach(async ({ page }) => {
  await page.goto('/contact');
});

test('submit kosong menampilkan error tiap field wajib dan memfokuskan field pertama', async ({
  page,
}) => {
  let requests = 0;
  await page.route(API, async (route) => {
    requests += 1;
    await route.fulfill(accepted);
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

test('pesan tersimpan di server lalu tampil di kotak masuk Admin', async ({ page, context }) => {
  const subject = `Kolaborasi program ${uniqueSuffix()}`;
  await fillValid(page, subject);
  await page.getByPlaceholder('878-8668-3355').fill('81234567890');

  const request = page.waitForRequest((req) => req.url().endsWith('/api/contact'));
  const response = page.waitForResponse((res) => res.url().endsWith('/api/contact'));
  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  await expect(page.getByText('Pesan terkirim')).toBeVisible();
  expect((await response).status()).toBe(202);
  const sent = await request;
  expect(sent.postDataJSON()).toMatchObject({
    name: 'Budi Santoso',
    email: 'budi@instansi.go.id',
    subject,
    phone: expect.stringMatching(/^\+62\d{9,13}$/),
    token: expect.any(String),
    kolom_khusus: '',
  });
  // Tanpa sesi: tidak ada token CSRF dan tidak ada cookie yang dibuat untuk pengunjung.
  expect(await sent.headerValue('x-xsrf-token')).toBeNull();
  expect(await context.cookies()).toEqual([]);
  await expect(page.getByLabel(/Nama lengkap/)).toHaveValue('');

  await loginAs(page, 'admin');
  await page.goto('/admin/pesan?status=belum-dibaca');
  await page.getByRole('link', { name: subject }).click();
  await expect(page.getByRole('heading', { name: subject, level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'budi@instansi.go.id' })).toBeVisible();
  await expect(
    page.getByText('Halo, kami ingin berdiskusi terkait kolaborasi program.'),
  ).toBeVisible();
  // Dibuka = ditandai dibaca, sehingga tidak lagi muncul di filter "Belum dibaca".
  await expect(page.getByRole('button', { name: 'Tandai belum dibaca' })).toBeVisible();
  expect(await audit(page)).toEqual([]);

  await page.goto('/admin/pesan?status=belum-dibaca');
  await expect(page.getByRole('status').filter({ hasText: /pesan$/ })).toBeVisible();
  await expect(page.getByRole('link', { name: subject })).toHaveCount(0);
  expect(await audit(page)).toEqual([]);
});

test('Admin menghapus pesan setelah konfirmasi', async ({ page }) => {
  const subject = `Pesan untuk dihapus ${uniqueSuffix()}`;
  await fillValid(page, subject);
  await page.getByRole('button', { name: 'Kirim pesan' }).click();
  await expect(page.getByText('Pesan terkirim')).toBeVisible();

  await loginAs(page, 'admin');
  await page.goto('/admin/pesan');
  await page.getByRole('link', { name: subject }).click();
  await page.getByRole('button', { name: 'Hapus pesan' }).click();
  const dialog = page.getByRole('dialog', { name: 'Hapus pesan?' });
  await expect(dialog.getByRole('button', { name: 'Batal' })).toBeFocused();
  expect(await audit(page)).toEqual([]);
  await dialog.getByRole('button', { name: 'Hapus pesan' }).click();

  await expect(page.getByText('Pesan dihapus')).toBeVisible();
  await expect(page).toHaveURL('/admin/pesan');
  await expect(page.getByRole('link', { name: subject })).toHaveCount(0);
});

test('Penulis tidak dapat membuka kotak masuk', async ({ page }) => {
  await loginAs(page, 'penulis');
  await page.goto('/admin/pesan');
  await expect(page.getByText('Halaman ini khusus Admin')).toBeVisible();

  const response = await page.request.get('/api/admin/messages', {
    headers: { Accept: 'application/json' },
  });
  expect(response.status()).toBe(403);
});

test('galat validasi dari server tampil di kolomnya', async ({ page, problems }) => {
  problems.allowConsoleErrors.push(/status of 422/);
  await page.route(API, (route) =>
    route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Data tidak valid.',
        errors: { subject: ['Subjek maksimal 150 karakter'] },
      }),
    }),
  );
  await fillValid(page);

  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  await expect(page.getByText('Subjek maksimal 150 karakter')).toBeVisible();
  await expect(page.getByLabel(/Subjek/)).toBeFocused();
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
    await route.fulfill(accepted);
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
    await route.fulfill(accepted);
  });
  await fillValid(page);

  await page.getByRole('button', { name: 'Kirim pesan' }).click();

  const pending = page.getByRole('button', { name: 'Mengirim…' });
  await expect(pending).toBeVisible();
  await expect(pending).toBeDisabled();
  await expect(page.getByText('Pesan terkirim')).toBeVisible();
});
