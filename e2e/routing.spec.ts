import { expect, test } from './fixtures';

const pages = [
  { path: '/', title: 'Pemerintah Digital | PEMDI PANRB', h1: /Transformasi digital pemerintah/ },
  { path: '/portfolio', title: 'Portofolio | PEMDI PANRB', h1: 'Portofolio Pemerintah Digital' },
  { path: '/contact', title: 'Hubungi kami | PEMDI PANRB', h1: 'Hubungi kami' },
  {
    path: '/portfolio/3',
    title: 'Mulai 2025, Informasi Layanan Publik Terpusat di INAgov | PEMDI PANRB',
    h1: 'Mulai 2025, Informasi Layanan Publik Terpusat di INAgov',
  },
];

for (const { path, title, h1 } of pages) {
  test(`deep link ${path} tampil langsung dan tetap benar setelah refresh`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    await expect(page).toHaveTitle(title);

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    await expect(page).toHaveTitle(title);
  });
}

test('path tidak dikenal menampilkan halaman 404 yang noindex', async ({ page }) => {
  await page.goto('/halaman-ngawur');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404: Halaman tidak ditemukan');
  await expect(page.getByRole('link', { name: 'Kembali ke beranda' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('ID artikel yang tidak ada menampilkan 404 khusus artikel', async ({ page }) => {
  await page.goto('/portfolio/999');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Artikel tidak ditemukan');
});

test('URL rusak (percent-encoding tidak valid) tidak membuat aplikasi error', async ({ page }) => {
  await page.goto('/portfolio/%E0%A4%A');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404: Halaman tidak ditemukan');
});

test('garis miring di akhir dinormalkan', async ({ page }) => {
  await page.goto('/portfolio/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portofolio Pemerintah Digital');
});

test('berkas statis yang tidak ada mengembalikan 404 sungguhan, bukan index.html', async ({
  request,
}) => {
  const response = await request.get('/assets/tidak-ada.js');
  expect(response.status()).toBe(404);
  expect(await response.text()).not.toContain('<div id="root">');
});

test('filter kategori bertahan saat membuka artikel lalu menekan Back', async ({ page }) => {
  await page.goto('/portfolio');
  await page.getByRole('button', { name: 'Panduan Pengguna' }).click();
  await expect(page).toHaveURL(/\?kategori=Panduan\+Pengguna$/);
  const status = page.getByRole('status').filter({ hasText: 'Menampilkan' });
  await expect(status).toContainText('dari 11 artikel');

  await page.locator('main a[href^="/portfolio/"]').first().click();
  await expect(page).toHaveURL(/\/portfolio\/\d+$/);
  await expect(page.getByText('Panduan Pengguna').first()).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\?kategori=Panduan\+Pengguna$/);
  await expect(status).toContainText('dari 11 artikel');
});

test('paginasi memperbarui URL dan konten, dan Back kembali ke halaman sebelumnya', async ({
  page,
}) => {
  await page.goto('/portfolio');
  const status = page.getByRole('status').filter({ hasText: 'Menampilkan' });
  await expect(status).toContainText('Menampilkan 1-12 dari 36 artikel');

  await page.getByRole('link', { name: 'Halaman 3' }).click();
  await expect(page).toHaveURL(/\?halaman=3$/);
  await expect(status).toContainText('Menampilkan 25-36 dari 36 artikel');

  await page.goBack();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(status).toContainText('Menampilkan 1-12 dari 36 artikel');

  await page.goForward();
  await expect(status).toContainText('Menampilkan 25-36 dari 36 artikel');
});

test('halaman di luar jangkauan dibatasi ke halaman terakhir', async ({ page }) => {
  await page.goto('/portfolio?halaman=99');
  await expect(page.getByRole('status').filter({ hasText: 'Menampilkan' })).toContainText(
    'Menampilkan 25-36 dari 36 artikel',
  );
});

test('klik kartu di beranda membuka detail, breadcrumb kembali ke portofolio', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href^="/portfolio/"]').first().click();
  await expect(page).toHaveURL(/\/portfolio\/\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByText('Portofolio', { exact: true })
    .click();
  await expect(page).toHaveURL(/\/portfolio$/);
});

test('detail artikel menampilkan artikel terkait yang valid', async ({ page }) => {
  await page.goto('/portfolio/1');
  const related = page.getByRole('region', { name: 'Artikel terkait' });
  await expect(related.locator('a[href^="/portfolio/"]')).toHaveCount(3);
  await expect(related.locator('a[href="/portfolio/1"]')).toHaveCount(0);

  await related.getByRole('link', { name: /Lihat semua/ }).click();
  await expect(page).toHaveURL(/\/portfolio\?kategori=Kebijakan/);
});
