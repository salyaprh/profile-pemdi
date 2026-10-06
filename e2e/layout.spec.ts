import { expect, test } from './fixtures';

// Uji tata letak untuk SEMUA ukuran layar. Khusus desktop/mobile: layout.desktop.spec.ts, layout.mobile.spec.ts.
const routes = ['/', '/portfolio', '/portfolio/3', '/contact', '/halaman-ngawur'];

test('skip link: Tab pertama memfokuskannya dan Enter memindahkan fokus ke konten utama', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skip = page.getByRole('link', { name: 'Lompat ke konten utama' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.locator('#konten-utama')).toBeFocused();
  expect(new URL(page.url()).hash).toBe('');
});

test('header tetap menempel di atas saat halaman digulir', async ({ page }) => {
  await page.goto('/portfolio');
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );

  const box = await page.getByRole('banner').boundingBox();
  expect(box?.y).toBe(0);
});

for (const path of routes) {
  test(`tidak ada luapan horizontal di ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('logo dan semua gambar kartu termuat (tidak ada gambar rusak)', async ({ page }) => {
  await page.goto('/portfolio');
  const images = page.locator('main img, header img, footer img');
  const count = await images.count();
  expect(count).toBeGreaterThan(10);

  for (let index = 0; index < count; index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded();
  }

  await expect
    .poll(() =>
      images.evaluateAll((elements) =>
        elements
          .filter(
            (img) =>
              !(img as HTMLImageElement).complete || (img as HTMLImageElement).naturalWidth === 0,
          )
          .map((img) => (img as HTMLImageElement).src),
      ),
    )
    .toEqual([]);
});

test('font Inter (400/500/600) dimuat dari origin sendiri', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() =>
    [...document.fonts].map((font) => `${font.family} ${font.weight} ${font.status}`),
  );
  expect(fonts.sort()).toEqual(['Inter 400 loaded', 'Inter 500 loaded', 'Inter 600 loaded']);
});
