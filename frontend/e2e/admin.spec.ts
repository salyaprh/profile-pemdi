import { accounts, demoPassword, fillLogin, loginAs } from './admin.helper';
import { expect, test } from './fixtures';

// Uji panel admin terhadap backend Laravel sungguhan (lihat e2e/start-backend.mjs): sesi cookie,
// CSRF, dan hak akses diperiksa ujung ke ujung, bukan dengan respons tiruan.

test('tamu yang membuka /admin diarahkan ke halaman Masuk', async ({ page }) => {
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Masuk ke CMS' })).toBeVisible();
  await expect(page).toHaveURL('/admin/masuk?kembali=%2Fadmin');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('kredensial salah ditolak dengan pesan yang sama untuk email apa pun', async ({
  page,
  problems,
}) => {
  // Browser mencatat respons 422 dari backend sebagai error konsol; itu memang diharapkan di sini.
  problems.allowConsoleErrors.push(/status of 422/);
  await page.goto('/admin/masuk');

  await fillLogin(page, 'tidak-terdaftar@pemdi.test', 'BukanKataSandi123');

  await expect(page.getByRole('alert')).toHaveText('Email atau kata sandi salah.');
  await expect(page).toHaveURL('/admin/masuk');
});

test('Admin masuk, melihat dasbor dari database, lalu keluar', async ({ page }) => {
  await loginAs(page, 'admin');

  const metrics = page.getByRole('region', { name: 'Ringkasan artikel' });
  await expect(metrics.getByText('36')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Aktivitas terbaru' })).toContainText(
    'Masuk ke CMS.',
  );
  // Nama dan email disembunyikan di layar sempit; badge peran tampil di semua ukuran.
  await expect(page.getByRole('banner').getByText('Admin', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL('/admin/masuk');

  // Sesi benar-benar berakhir di server, bukan hanya di tampilan.
  const me = await page.request.get('/api/auth/me');
  expect(await me.json()).toEqual({ user: null });
  await page.goto('/admin');
  await expect(page).toHaveURL('/admin/masuk?kembali=%2Fadmin');
});

test('Penulis tidak melihat log aktivitas', async ({ page }) => {
  await loginAs(page, 'penulis');

  await expect(page.getByText('Berikut ringkasan artikel Anda.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Aktivitas terbaru' })).toHaveCount(0);
});

test('setelah login, kembali ke halaman admin yang tadi dibuka', async ({ page }) => {
  await page.goto('/admin/halaman-belum-ada');
  await expect(page).toHaveURL('/admin/masuk?kembali=%2Fadmin%2Fhalaman-belum-ada');

  await fillLogin(page, accounts.admin.email, demoPassword());

  await expect(page).toHaveURL('/admin/halaman-belum-ada');
  await expect(page.getByText('Halaman admin tidak ditemukan')).toBeVisible();
});

test('cookie sesi HttpOnly dan SameSite=Lax; token CSRF terbaca JavaScript', async ({
  page,
  context,
}) => {
  await loginAs(page, 'admin');

  const cookies = await context.cookies();
  const session = cookies.find((cookie) => cookie.name === 'pemdi-panrb-session');
  const xsrf = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN');

  expect(session).toMatchObject({ httpOnly: true, sameSite: 'Lax' });
  expect(xsrf).toMatchObject({ httpOnly: false, sameSite: 'Lax' });
  expect(await page.evaluate(() => document.cookie)).not.toContain('pemdi-panrb-session');
});

test('permintaan yang mengubah data tanpa token CSRF ditolak (419)', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: { email: accounts.admin.email, password: demoPassword() },
    headers: { Accept: 'application/json' },
  });

  expect(response.status()).toBe(419);
});

test('API admin tidak dapat diakses tamu dan responsnya tidak di-cache', async ({ request }) => {
  const response = await request.get('/api/admin/dashboard', {
    headers: { Accept: 'application/json' },
  });

  expect(response.status()).toBe(401);
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
});
