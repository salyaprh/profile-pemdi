import { audit } from './a11y.helper';
import { loginAs } from './admin.helper';
import { expect, test } from './fixtures';

test('menu admin mobile dibuka dari tombol, lolos axe, dan ditutup dengan Escape', async ({
  page,
}) => {
  await loginAs(page, 'penulis');
  // Sidebar desktop tersembunyi; menu dibuka dari tombol di header.
  await expect(page.getByRole('button', { name: 'Ciutkan menu' })).toBeHidden();

  const toggle = page.getByRole('button', { name: 'Buka menu admin' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();

  const menu = page.locator('#menu-admin-mobile');
  await expect(menu.getByRole('link', { name: 'Dasbor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tutup menu admin' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(await audit(page)).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

// Halaman admin yang bisa dibuka Admin tanpa data khusus (halaman detail/ubah dicakup spec masing-masing).
const adminPages = [
  '/admin',
  '/admin/artikel',
  '/admin/artikel/baru',
  '/admin/kategori',
  '/admin/pesan',
  '/admin/pengguna',
  '/admin/pengguna/baru',
  '/admin/pengaturan',
  '/admin/aktivitas',
  '/admin/akun',
];

test('semua halaman admin muat di layar sempit tanpa gulir mendatar dan lolos axe', async ({
  page,
}) => {
  test.slow();
  await loginAs(page, 'admin');

  for (const path of adminPages) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // Tabel boleh digulir di dalam wilayahnya sendiri, tetapi halamannya tidak.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} melebar ${overflow}px melewati layar`).toBeLessThanOrEqual(0);
    expect(await audit(page), path).toEqual([]);
  }
});
