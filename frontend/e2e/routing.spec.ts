import { expect, test } from './fixtures';
import { seeded } from './helpers';

const ARTICLE_URL = /\/portfolio\/[a-z0-9-]+$/;

const pages = [
  { path: '/', title: 'Pemerintah Digital | PEMDI PANRB', h1: /Transformasi digital pemerintah/ },
  { path: '/portfolio', title: 'Portofolio | PEMDI PANRB', h1: 'Portofolio Pemerintah Digital' },
  { path: '/contact', title: 'Hubungi kami | PEMDI PANRB', h1: 'Hubungi kami' },
  { path: '/layanan', title: 'Layanan | PEMDI PANRB', h1: 'Layanan' },
  {
    path: `/portfolio/${seeded.serviceArticle.slug}`,
    title: `${seeded.serviceArticle.title} | PEMDI PANRB`,
    h1: seeded.serviceArticle.title,
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

test('slug artikel yang tidak ada (atau belum terbit) menampilkan 404 khusus artikel', async ({
  page,
  problems,
}) => {
  // Browser mencatat respons 404 API sebagai error konsol; itu memang diharapkan di sini.
  problems.allowConsoleErrors.push(/status of 404/);
  await page.goto('/portfolio/999');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Artikel tidak ditemukan');
  // URL lama berbasis ID tidak lagi berlaku.
  await page.goto('/portfolio/3');
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
  await expect(page).toHaveURL(/\?kategori=panduan-pengguna$/);
  await expect(page.getByRole('button', { name: 'Panduan Pengguna' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const status = page.getByRole('status').filter({ hasText: 'Menampilkan' });
  await expect(status).toContainText(`dari ${seeded.guideCount} artikel`);

  await page.locator('main a[href^="/portfolio/"]').first().click();
  await expect(page).toHaveURL(ARTICLE_URL);
  await expect(page.getByText('Panduan Pengguna').first()).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\?kategori=panduan-pengguna$/);
  await expect(status).toContainText(`dari ${seeded.guideCount} artikel`);
});

test('paginasi memperbarui URL dan konten, dan Back kembali ke halaman sebelumnya', async ({
  page,
}) => {
  await page.goto('/portfolio');
  const status = page.getByRole('status').filter({ hasText: 'Menampilkan' });
  // Uji lain bisa menerbitkan artikel secara paralel, jadi totalnya tidak dipatok.
  await expect(status).toContainText(/Menampilkan 1-12 dari \d+ artikel/);

  await page.getByRole('link', { name: 'Halaman 3' }).click();
  await expect(page).toHaveURL(/\?halaman=3$/);
  await expect(status).toContainText(/Menampilkan 25-36 dari \d+ artikel/);

  await page.goBack();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(status).toContainText(/Menampilkan 1-12 dari \d+ artikel/);

  await page.goForward();
  await expect(status).toContainText(/Menampilkan 25-36 dari \d+ artikel/);
});

test('halaman di luar jangkauan memberi tautan ke halaman pertama', async ({ page }) => {
  await page.goto('/portfolio?halaman=99');
  await expect(page.getByText('Halaman ini kosong')).toBeVisible();
  await page.getByRole('link', { name: 'Ke halaman pertama' }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByRole('status').filter({ hasText: 'Menampilkan' })).toContainText(
    /Menampilkan 1-12/,
  );
});

test('klik kartu di beranda membuka detail, breadcrumb kembali ke portofolio', async ({ page }) => {
  await page.goto('/');
  await page.locator('main a[href^="/portfolio/"]').first().click();
  await expect(page).toHaveURL(ARTICLE_URL);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByText('Portofolio', { exact: true })
    .click();
  await expect(page).toHaveURL(/\/portfolio$/);
});

test('detail artikel menampilkan artikel terkait yang valid', async ({ page }) => {
  await page.goto(`/portfolio/${seeded.policyArticle.slug}`);
  const related = page.getByRole('region', { name: 'Artikel terkait' });
  await expect(related.locator('a[href^="/portfolio/"]')).toHaveCount(3);
  await expect(related.locator(`a[href="/portfolio/${seeded.policyArticle.slug}"]`)).toHaveCount(0);

  await related.getByRole('link', { name: /Lihat semua/ }).click();
  await expect(page).toHaveURL(/\/portfolio\?kategori=kebijakan-regulasi$/);
  await expect(page.getByRole('button', { name: 'Kebijakan & Regulasi' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
