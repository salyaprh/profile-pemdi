import { audit } from './a11y.helper';
import { fillLogin, login, loginAs, logout, uniqueSuffix } from './admin.helper';
import { expect, test } from './fixtures';

// Siklus akun ujung ke ujung terhadap backend sungguhan: Admin membuat akun, pemilik akun wajib
// mengganti kata sandi sementara, lalu Admin mengatur ulang atau menonaktifkannya.
const TEMPORARY = 'SandiSementara2026';
const PERSONAL = 'SandiPribadiBaru2026';
const RESET = 'SandiDiaturUlang2026';

test('akun baru: kata sandi sementara wajib diganti, lalu panel terbuka', async ({
  page,
  problems,
}) => {
  test.slow();
  // Login dengan kata sandi lama yang ditolak (422) dicatat browser sebagai error konsol.
  problems.allowConsoleErrors.push(/status of 422/);
  const suffix = uniqueSuffix();
  const email = `penulis-${suffix}@pemdi.test`.toLowerCase();

  // --- Admin membuat akun ---
  await loginAs(page, 'admin');
  await page.goto('/admin/pengguna/baru');
  await page.getByLabel(/^Nama lengkap/).fill(`Penulis Uji ${suffix}`);
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Kata sandi sementara/).fill('pendek');
  await page.getByRole('button', { name: 'Buat akun' }).click();
  await expect(page.getByText('Kata sandi minimal 12 karakter')).toBeVisible();
  expect(await audit(page)).toEqual([]);
  await page.getByLabel(/^Kata sandi sementara/).fill(TEMPORARY);
  await page.getByRole('button', { name: 'Buat akun' }).click();
  await expect(page.getByText(`Akun Penulis Uji ${suffix} dibuat`)).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/pengguna\/\d+$/);
  await expect(page.getByText('Pengguna belum mengganti kata sandi sementaranya.')).toBeVisible();
  await logout(page);

  // --- Pemilik akun: dipaksa mengganti kata sandi sebelum memakai panel ---
  await login(page, email, TEMPORARY);
  await expect(page).toHaveURL('/admin/akun');
  await expect(page.getByText('Ganti kata sandi sementara Anda')).toBeVisible();
  await page.goto('/admin/artikel');
  await expect(page).toHaveURL('/admin/akun');
  // Backend menolaknya juga, bukan hanya tampilan.
  const blocked = await page.request.get('/api/admin/articles', {
    headers: { Accept: 'application/json' },
  });
  expect(blocked.status()).toBe(403);
  expect(await audit(page)).toEqual([]);

  await page.getByLabel(/^Kata sandi saat ini/).fill(TEMPORARY);
  await page.getByLabel(/^Kata sandi baru/).fill(PERSONAL);
  await page.getByLabel(/^Ulangi kata sandi baru/).fill(`${PERSONAL}x`);
  await page.getByRole('button', { name: 'Ganti kata sandi' }).click();
  await expect(page.getByText('Konfirmasi tidak sama dengan kata sandi baru')).toBeVisible();
  await page.getByLabel(/^Ulangi kata sandi baru/).fill(PERSONAL);
  await page.getByRole('button', { name: 'Ganti kata sandi' }).click();
  await expect(page.getByText('Kata sandi diganti')).toBeVisible();
  await expect(page.getByText('Ganti kata sandi sementara Anda')).toBeHidden();

  await page.goto('/admin/artikel');
  await expect(page.getByRole('heading', { name: 'Artikel', level: 1 })).toBeVisible();
  // Penulis tidak dapat membuka halaman khusus Admin.
  await page.goto('/admin/pengguna');
  await expect(page.getByText('Halaman ini khusus Admin')).toBeVisible();
  await logout(page);

  // Kata sandi sementara tidak lagi berlaku; yang baru berlaku.
  await page.goto('/admin/masuk');
  await fillLogin(page, email, TEMPORARY);
  await expect(page.getByRole('alert')).toHaveText('Email atau kata sandi salah.');
});

test('pengaturan ulang dan penonaktifan mengakhiri sesi yang sedang berjalan', async ({
  page,
  browser,
  problems,
}) => {
  test.slow();
  // Login ditolak dan sesi yang berakhir menghasilkan respons 401/422 yang dicatat browser.
  problems.allowConsoleErrors.push(/status of (401|422)/);
  const suffix = uniqueSuffix();
  const email = `sesi-${suffix}@pemdi.test`.toLowerCase();

  await loginAs(page, 'admin');
  await page.goto('/admin/pengguna/baru');
  await page.getByLabel(/^Nama lengkap/).fill(`Pemilik Sesi ${suffix}`);
  await page.getByLabel(/^Email/).fill(email);
  await page.getByRole('button', { name: 'Buat kata sandi acak' }).click();
  await expect(page.getByLabel(/^Kata sandi sementara/)).not.toHaveValue('');
  const generated = await page.getByLabel(/^Kata sandi sementara/).inputValue();
  expect(generated).toHaveLength(16);
  await page.getByRole('button', { name: 'Buat akun' }).click();
  await expect(page).toHaveURL(/\/admin\/pengguna\/\d+$/);
  const userUrl = page.url();

  // Pemilik akun masuk di browser lain dan mengganti kata sandi sementaranya.
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  await login(owner, email, generated);
  await owner.getByLabel(/^Kata sandi saat ini/).fill(generated);
  await owner.getByLabel(/^Kata sandi baru/).fill(PERSONAL);
  await owner.getByLabel(/^Ulangi kata sandi baru/).fill(PERSONAL);
  await owner.getByRole('button', { name: 'Ganti kata sandi' }).click();
  await expect(owner.getByText('Kata sandi diganti')).toBeVisible();
  await owner.goto('/admin/artikel');
  await expect(owner.getByRole('heading', { name: 'Artikel', level: 1 })).toBeVisible();

  // Admin mengatur ulang kata sandinya: sesi pemilik berakhir pada permintaan berikutnya.
  await page.goto(userUrl);
  await page.getByRole('button', { name: 'Atur ulang kata sandi' }).click();
  const dialog = page.getByRole('dialog', { name: 'Atur ulang kata sandi?' });
  const field = dialog.getByLabel(/^Kata sandi sementara baru/);
  await expect(field).toBeFocused();
  expect(await audit(page)).toEqual([]);
  await field.fill(RESET);
  await dialog.getByRole('button', { name: 'Atur ulang' }).click();
  await expect(page.getByText('Kata sandi diatur ulang')).toBeVisible();

  await owner.goto('/admin/artikel');
  await expect(owner).toHaveURL(/\/admin\/masuk\?kembali=/);
  await login(owner, email, RESET);
  await expect(owner).toHaveURL('/admin/akun');

  // Admin menonaktifkan akun: sesi pemilik berakhir dan login ditolak dengan pesan yang jelas.
  await page.goto(userUrl);
  await page.getByLabel('Status akun').selectOption('nonaktif');
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByText('Perubahan tersimpan')).toBeVisible();

  await owner.goto('/admin/artikel');
  await expect(owner).toHaveURL(/\/admin\/masuk\?kembali=/);
  await fillLogin(owner, email, RESET);
  await expect(owner.getByRole('alert')).toContainText('Akun ini dinonaktifkan');
  await ownerContext.close();
});

test('daftar pengguna: filter, pencarian, dan akun sendiri terkunci', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/pengguna?status=aktif');
  await expect(page.getByRole('region', { name: 'Tabel pengguna' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aktif', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Cari nama atau email').fill('admin@pemdi');
  await expect(page).toHaveURL(/cari=admin%40pemdi/);
  await expect(page.getByRole('link', { name: 'Admin Demo' })).toBeVisible();
  expect(await audit(page)).toEqual([]);

  await page.getByRole('link', { name: 'Admin Demo' }).click();
  await expect(page.getByLabel('Peran')).toBeDisabled();
  await expect(page.getByLabel('Status akun')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Atur ulang kata sandi' })).toBeDisabled();
  expect(await audit(page)).toEqual([]);
});
