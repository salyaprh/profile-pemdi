import { audit } from './a11y.helper';
import { loginAs } from './admin.helper';
import { expect, test } from './fixtures';

test('Admin membaca log aktivitas dan menyaringnya per jenis', async ({ page }) => {
  await loginAs(page, 'admin'); // login ini sendiri tercatat sebagai "Masuk ke CMS."

  await page.goto('/admin/aktivitas');
  const table = page.getByRole('region', { name: 'Tabel aktivitas' });
  await expect(table).toBeVisible();
  await expect(
    table
      .getByRole('row')
      .filter({ hasText: 'Admin Demo' })
      .filter({ hasText: 'Masuk ke CMS' })
      .first(),
  ).toBeVisible();
  // Hanya bisa dibaca: tidak ada aksi pada baris.
  await expect(table.getByRole('button')).toHaveCount(0);
  expect(await audit(page)).toEqual([]);

  await page.getByRole('button', { name: 'Pengguna', exact: true }).click();
  await expect(page).toHaveURL('/admin/aktivitas?kelompok=pengguna');
  await expect(page.getByRole('button', { name: 'Pengguna', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(table.getByText('Masuk ke CMS.')).toHaveCount(0);
  expect(await audit(page)).toEqual([]);
});

test('Penulis tidak dapat membaca log aktivitas', async ({ page }) => {
  await loginAs(page, 'penulis');
  await page.goto('/admin/aktivitas');
  await expect(page.getByText('Halaman ini khusus Admin')).toBeVisible();

  const response = await page.request.get('/api/admin/activity', {
    headers: { Accept: 'application/json' },
  });
  expect(response.status()).toBe(403);
});
