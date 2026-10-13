import { audit } from './a11y.helper';
import { apiSend, loginAs, uniqueSuffix } from './admin.helper';
import { expect, test } from './fixtures';

test('Admin menambah, mengganti nama, dan menghapus kategori', async ({ page, problems }) => {
  // Nama ganda sengaja dikirim: browser mencatat respons 422 sebagai error konsol.
  problems.allowConsoleErrors.push(/status of 422/);
  const suffix = uniqueSuffix();
  const name = `Kategori Uji ${suffix}`;
  const renamed = `Kategori Ganti ${suffix}`;
  const slug = `kategori-uji-${suffix}`.toLowerCase();

  await loginAs(page, 'admin');
  await page.goto('/admin/kategori');
  await expect(page.getByRole('heading', { name: 'Kategori', level: 1 })).toBeVisible();
  // Kategori yang masih dipakai artikel tidak bisa dihapus.
  await expect(page.getByRole('button', { name: 'Hapus kategori Layanan Publik' })).toBeDisabled();

  await page.getByRole('textbox', { name: 'Kategori baru' }).fill(name);
  await page.getByRole('button', { name: 'Tambah kategori' }).click();
  await expect(page.getByText(`Kategori “${name}” ditambahkan`)).toBeVisible();
  await expect(page.getByText(`0 artikel · /${slug}`)).toBeVisible();
  expect(await audit(page)).toEqual([]);

  // Nama yang sama ditolak backend dan pesannya tampil di kolom.
  await page.getByRole('textbox', { name: 'Kategori baru' }).fill(name);
  await page.getByRole('button', { name: 'Tambah kategori' }).click();
  await expect(page.getByText('Kategori dengan nama ini sudah ada.')).toBeVisible();

  await page.getByRole('button', { name: `Ubah nama kategori ${name}` }).click();
  const input = page.getByRole('textbox', { name: `Nama baru untuk ${name}` });
  await expect(input).toBeFocused();
  await input.fill(renamed);
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByText('Nama kategori diperbarui')).toBeVisible();
  // Slug tetap, agar tautan filter yang sudah dibagikan tidak mati.
  await expect(page.getByText(renamed, { exact: true })).toBeVisible();
  await expect(page.getByText(`0 artikel · /${slug}`)).toBeVisible();

  await page.getByRole('button', { name: `Hapus kategori ${renamed}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Hapus kategori?' });
  await expect(dialog.getByRole('button', { name: 'Batal' })).toBeFocused();
  expect(await audit(page)).toEqual([]);
  await dialog.getByRole('button', { name: 'Hapus kategori' }).click();
  await expect(page.getByText(`Kategori “${renamed}” dihapus`)).toBeVisible();
  await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
});

test('Penulis tidak dapat membuka atau mengubah kategori', async ({ page }) => {
  await loginAs(page, 'penulis');
  await page.goto('/admin/kategori');

  await expect(page.getByText('Halaman ini khusus Admin')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kategori' })).toHaveCount(0);
  expect(await audit(page)).toEqual([]);

  // Backend menolak sendiri, bukan hanya UI yang menyembunyikan.
  const response = await apiSend(page, 'POST', '/api/admin/categories', {
    name: 'Kategori Penulis',
  });
  expect(response.status()).toBe(403);
});
