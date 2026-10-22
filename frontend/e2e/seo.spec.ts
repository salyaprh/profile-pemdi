import { expect, test } from './fixtures';
import { seeded } from './helpers';

const SITE = 'https://pemdi.example.go.id';

test.describe('HTML statis (yang dilihat crawler tanpa JavaScript)', () => {
  test('halaman umum memuat meta tingkat situs, bahasa Indonesia, dan TIDAK memuat canonical/og:url', async ({
    request,
  }) => {
    const html = await (await request.get('/portfolio')).text();

    expect(html).toMatch(/<html[^>]*\blang="id"/);
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('property="og:site_name" content="PEMDI PANRB"');
    expect(html).toContain('property="og:locale" content="id_ID"');
    expect(html).toContain('name="description"');
    // HTML yang sama dilayani untuk semua halaman umum, jadi canonical statis akan salah.
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('property="og:url"');
  });

  test('halaman artikel membawa judul, deskripsi, dan URL kanonis artikel itu sendiri (pratinjau tautan)', async ({
    request,
  }) => {
    const { slug, title } = seeded.serviceArticle;
    const response = await request.get(`/portfolio/${slug}`);
    const html = await response.text();

    expect(response.status()).toBe(200);
    expect(html).toContain(`<title>${title} | PEMDI PANRB</title>`);
    expect(html).toContain(`property="og:title" content="${title} | PEMDI PANRB"`);
    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain(`<link rel="canonical" href="${SITE}/portfolio/${slug}" />`);
    expect(html).toContain(`property="og:url" content="${SITE}/portfolio/${slug}"`);
    // Aplikasi tetap dimuat, dan header keamanan (CSP) ikut diterapkan.
    expect(html).toContain('<div id="root">');
    expect(response.headers()['content-security-policy']).toContain("default-src 'self'");
  });

  test('artikel yang tidak ada dijawab 404 dengan halaman aplikasi, bukan error server', async ({
    request,
  }) => {
    const response = await request.get('/portfolio/artikel-yang-tidak-ada');

    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('<div id="root">');
  });
});

test.describe('meta per halaman (setelah JavaScript berjalan)', () => {
  const pages = [
    { path: '/', canonical: `${SITE}/`, title: 'Pemerintah Digital | PEMDI PANRB' },
    { path: '/portfolio', canonical: `${SITE}/portfolio`, title: 'Portofolio | PEMDI PANRB' },
    { path: '/contact', canonical: `${SITE}/contact`, title: 'Hubungi kami | PEMDI PANRB' },
    { path: '/layanan', canonical: `${SITE}/layanan`, title: 'Layanan | PEMDI PANRB' },
    {
      path: `/portfolio/${seeded.serviceArticle.slug}`,
      canonical: `${SITE}/portfolio/${seeded.serviceArticle.slug}`,
      title: /Terpusat di INAgov/,
    },
  ];

  for (const { path, canonical, title } of pages) {
    test(`${path}: canonical, og:url, og:title, deskripsi, dan tanpa noindex`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        /PEMDI PANRB/,
      );
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    });
  }

  test('canonical tidak memuat query string (filter dan halaman)', async ({ page }) => {
    await page.goto('/portfolio?kategori=layanan-publik&halaman=2');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${SITE}/portfolio`,
    );
  });

  test('garis miring di akhir tidak masuk ke canonical', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/contact`);
  });

  for (const path of ['/halaman-ngawur', '/portfolio/999']) {
    test(`${path}: noindex dan tanpa canonical`, async ({ page, problems }) => {
      // Artikel tidak ditemukan = respons 404 dari API, yang dicatat browser sebagai error konsol.
      problems.allowConsoleErrors.push(/status of 404/);
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    });
  }

  test('berpindah dari halaman 404 ke beranda mencabut noindex dan mengembalikan canonical', async ({
    page,
  }) => {
    await page.goto('/halaman-ngawur');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

    await page.getByRole('link', { name: 'Kembali ke beranda' }).click();
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/`);
  });

  test('navigasi SPA tidak menggandakan tag meta', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Lihat portofolio' }).click();
    await page.locator('a[href^="/portfolio/"]').first().click();
    await page.goBack();

    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });
});
