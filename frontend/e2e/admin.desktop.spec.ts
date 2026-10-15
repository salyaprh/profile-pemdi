import { audit } from './a11y.helper';
import { loginAs } from './admin.helper';
import { expect, test } from './fixtures';

test('sidebar admin bisa diciutkan, diingat setelah muat ulang, dan tetap lolos axe', async ({
  page,
}) => {
  await loginAs(page, 'penulis');
  const sidebar = page.getByRole('navigation', { name: 'Menu admin' });
  await expect(sidebar.getByRole('link', { name: 'Dasbor' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  // Tombol menu mobile tidak tampil di layar lebar.
  await expect(page.getByRole('button', { name: 'Buka menu admin' })).toBeHidden();

  await page.getByRole('button', { name: 'Ciutkan menu' }).click();
  await expect(page.getByRole('button', { name: 'Lebarkan menu' })).toBeVisible();
  // Label tetap terbaca pembaca layar walau hanya ikon yang tampil.
  await expect(sidebar.getByRole('link', { name: 'Dasbor' })).toBeVisible();
  expect(await audit(page)).toEqual([]);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Lebarkan menu' })).toBeVisible();
});
