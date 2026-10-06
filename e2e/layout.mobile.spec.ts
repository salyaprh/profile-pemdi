import { expect, test } from './fixtures';

test('menu utama tersembunyi dan dibuka lewat hamburger, lalu menutup saat memilih menu', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeHidden();

  const toggle = page.getByRole('button', { name: 'Buka menu' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();

  const mobileNav = page.getByRole('navigation', { name: 'Navigasi mobile' });
  await expect(mobileNav).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tutup menu' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );

  await mobileNav.getByRole('link', { name: 'Hubungi kami' }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('navigation', { name: 'Navigasi mobile' })).toBeHidden();
});

test('menu mobile ditutup dengan Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Buka menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Navigasi mobile' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Navigasi mobile' })).toBeHidden();
});

test('footer memakai accordion yang mengekspos status buka/tutup (aria-expanded)', async ({
  page,
}) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  const trigger = footer.getByRole('button', { name: /Kategori portofolio/ });
  await trigger.scrollIntoViewIfNeeded();

  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(footer.getByRole('link', { name: 'Layanan Publik' })).toBeVisible();

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('Tab tidak mendarat di tautan accordion footer yang sedang tertutup (WCAG 2.4.7)', async ({
  page,
}) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await footer.getByRole('button', { name: /Navigasi/ }).scrollIntoViewIfNeeded();
  await footer.getByRole('link', { name: 'PEMDI PANRB, ke beranda' }).focus();

  const landedOnHidden: string[] = [];
  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press('Tab');
    const hidden = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el.tagName !== 'A' || !el.closest('.ina-accordion__content')) return null;
      return getComputedStyle(el).visibility === 'hidden' ? null : el.textContent;
    });
    // Tautan di dalam konten accordion yang tertutup tidak boleh menerima fokus sama sekali.
    if (hidden) landedOnHidden.push(hidden);
  }
  expect(landedOnHidden).toEqual([]);
});

test('Escape di kolom cari menutup panel hasil dulu, Escape kedua baru menutup menu', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Buka menu' }).click();
  const input = page.getByRole('textbox', { name: 'Cari artikel portofolio' });
  await input.fill('zzzxxx');
  await expect(page.getByText(/Tidak ada hasil untuk/)).toBeVisible();

  await input.press('Escape');
  await expect(page.getByText(/Tidak ada hasil untuk/)).toBeHidden();
  await expect(input).toBeVisible();
  await expect(input).toHaveValue('zzzxxx');

  await input.press('Escape');
  await expect(page.getByRole('button', { name: 'Buka menu' })).toBeVisible();
  await expect(input).toBeHidden();
});
