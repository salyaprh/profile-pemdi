import { expect, test } from './fixtures';

test('menu utama tampil, hamburger tersembunyi, menu aktif ditandai', async ({ page }) => {
  await page.goto('/portfolio');
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });

  await expect(nav.getByRole('button', { name: 'Portofolio' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(nav.getByRole('link', { name: 'Beranda' })).not.toHaveAttribute('aria-current');
  await expect(page.getByRole('button', { name: 'Buka menu' })).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Cari artikel portofolio' })).toBeVisible();
});

test('dropdown Portofolio terbuka saat hover, berisi kategori, dan klik kategori memfilter daftar', async ({
  page,
}) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  const toggle = nav.getByRole('button', { name: 'Portofolio' });

  await toggle.hover();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  // Klik setelah hover tidak menutup panel; kursor bisa turun ke panel tanpa panel tertutup.
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await nav.getByRole('link', { name: 'Semua portofolio' }).hover();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await nav.getByRole('link', { name: 'Panduan Pengguna' }).click();
  await expect(page).toHaveURL(/\/portfolio\?kategori=panduan-pengguna$/);
  await expect(toggle).toHaveAttribute('aria-current', 'true');

  // Kursor keluar dari menu: panel tertutup.
  await page.mouse.move(10, 400);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('dropdown Portofolio bisa dipakai dengan keyboard dan ditutup dengan Escape', async ({
  page,
}) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  const toggle = nav.getByRole('button', { name: 'Portofolio' });

  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Semua portofolio' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('footer menampilkan kolom tautan tanpa accordion', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Layanan Publik' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Hubungi kami' })).toBeVisible();
});
