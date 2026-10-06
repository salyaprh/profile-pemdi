import { expect, test } from './fixtures';

test('menu utama tampil, hamburger tersembunyi, menu aktif ditandai', async ({ page }) => {
  await page.goto('/portfolio');
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });

  await expect(nav.getByRole('link', { name: 'Portofolio' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(nav.getByRole('link', { name: 'Beranda' })).not.toHaveAttribute('aria-current');
  await expect(page.getByRole('button', { name: 'Buka menu' })).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Cari artikel portofolio' })).toBeVisible();
});

test('footer menampilkan kolom tautan tanpa accordion', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Layanan Publik' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Hubungi kami' })).toBeVisible();
});
