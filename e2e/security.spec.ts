import { expect, test } from './fixtures';

const SITE = 'https://pemdi.example.go.id';

test('dokumen dilayani dengan seluruh header keamanan', async ({ page }) => {
  const response = await page.goto('/');
  const headers = await response?.allHeaders();

  expect(headers?.['content-security-policy']).toContain("default-src 'self'");
  expect(headers?.['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers?.['strict-transport-security']).toMatch(/max-age=\d{8,}/);
  expect(headers?.['x-content-type-options']).toBe('nosniff');
  expect(headers?.['x-frame-options']).toBe('DENY');
  expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers?.['permissions-policy']).toContain('camera=()');
  expect(headers?.['cross-origin-opener-policy']).toBe('same-origin');
});

test('rute SPA (fallback) juga membawa header keamanan, bukan hanya "/"', async ({ request }) => {
  for (const path of ['/portfolio/3', '/contact', '/halaman-ngawur']) {
    const response = await request.get(path);
    expect(response.headers()['content-security-policy'], path).toContain("default-src 'self'");
  }
});

test('berkas build ber-hash di-cache immutable; gambar konten tidak', async ({ page, request }) => {
  await page.goto('/');
  const script = await page.locator('script[type="module"]').first().getAttribute('src');
  expect(script).toMatch(/^\/assets\/index-.+\.js$/);

  const asset = await request.get(script ?? '');
  expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  expect(asset.headers()['x-content-type-options']).toBe('nosniff');

  const image = await request.get('/images/articles/article-1.webp');
  expect(image.headers()['cache-control']).toBe('public, max-age=86400');
  expect(image.headers()['cache-control']).not.toContain('immutable');
});

test('CSP benar-benar ditegakkan: skrip inline dan sumber dari host luar diblokir', async ({
  page,
  problems,
}) => {
  problems.allowConsoleErrors.push(/Content Security Policy/);
  await page.goto('/');

  const result = await page.evaluate(() => {
    // Catatan: eval tidak dipakai sebagai probe karena evaluasi via CDP dikecualikan dari CSP.
    const inline = document.createElement('script');
    inline.textContent = 'window.__inlineRan = true';
    document.head.appendChild(inline);

    const external = document.createElement('script');
    external.src = 'https://evil.example/x.js';
    document.head.appendChild(external);

    new Image().src = 'https://evil.example/pixel.png';

    return (window as unknown as { __inlineRan?: boolean }).__inlineRan === true;
  });

  expect(result, 'skrip inline tidak boleh berjalan').toBe(false);
  await expect.poll(() => problems.cspViolations.length).toBeGreaterThanOrEqual(3);
  const directives = problems.cspViolations.map((v) => v.split(' ->')[0]);
  expect(directives).toEqual(expect.arrayContaining(['script-src', 'script-src-elem', 'img-src']));
  // Pelanggaran ini disengaja sebagai bukti CSP aktif; kosongkan agar tidak menggagalkan fixture.
  problems.cspViolations.length = 0;
});

test('situs tidak dapat disematkan di iframe (frame-ancestors / X-Frame-Options)', async ({
  page,
  problems,
}) => {
  problems.allowConsoleErrors.push(/Refused to (display|frame)/);
  await page.route('http://embedder.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<iframe src="http://localhost:4173/" width="600" height="400"></iframe>',
    }),
  );

  await page.goto('http://embedder.test/');
  await page.waitForLoadState('load');

  const embedded = page.frames().filter((frame) => frame.url().startsWith('http://localhost:4173'));
  for (const frame of embedded) {
    expect(await frame.locator('h1').count()).toBe(0);
  }
  // Bukan pelanggaran kita: embedder.test hanyalah situs penyerang rekaan.
  problems.externalRequests.length = 0;
});

test('tidak ada permintaan ke origin lain di seluruh halaman dan interaksi utama', async ({
  page,
  isMobile,
  problems,
}) => {
  for (const path of ['/', '/portfolio', '/portfolio/3', '/contact', '/halaman-ngawur']) {
    await page.goto(path);
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState('networkidle');
  }
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Pilih negara' }).click();
  await page.keyboard.press('Escape');
  if (isMobile) await page.getByRole('button', { name: 'Buka menu' }).click();
  await page.getByRole('textbox', { name: 'Cari artikel portofolio' }).fill('transparansi');
  await expect(page.getByText('2 hasil pencarian')).toBeVisible();

  expect(problems.externalRequests).toEqual([]);
});

test('_headers tidak ikut dilayani ke publik', async ({ request }) => {
  const response = await request.get('/_headers');
  expect(response.status()).toBe(404);
});

test('robots.txt menunjuk ke sitemap absolut', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('User-agent: *');
  expect(text).toContain('Allow: /');
  expect(text).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});

test('sitemap.xml memuat semua halaman (3 statis + 36 artikel) dengan URL absolut', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const locs = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  expect(locs).toHaveLength(39);
  expect(locs.every((loc) => loc.startsWith(`${SITE}/`))).toBe(true);
  expect(locs).toContain(`${SITE}/`);
  expect(locs).toContain(`${SITE}/portfolio/36`);
  expect(new Set(locs).size).toBe(locs.length);
});
