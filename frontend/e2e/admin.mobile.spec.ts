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
