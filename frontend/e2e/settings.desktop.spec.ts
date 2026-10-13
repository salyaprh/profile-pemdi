import { audit } from './a11y.helper';
import { apiSend, loginAs, logout, uniqueSuffix } from './admin.helper';
import { expect, test } from './fixtures';

// Pengaturan adalah satu data global untuk seluruh situs, jadi uji ini hanya berjalan di satu
// proyek (desktop) dan mengembalikan nilai semula di akhir.
const DEFAULTS = {
  description:
    'PEMDI merangkum karya dan inisiatif TDP dalam membangun layanan pemerintah yang terintegrasi, berdampak, dan berpusat pada kebutuhan masyarakat.',
  hero_stats: [
    { value: '12+', label: 'Inisiatif transformasi' },
    { value: '28', label: 'Layanan terdigitalisasi' },
    { value: '100%', label: 'Berorientasi dampak' },
  ],
  contact: { email: null, phone: null, address: null },
  social: { facebook: null, instagram: null, x: null, youtube: null },
};

test('Admin mengubah pengaturan dan situs publik langsung memperlihatkannya', async ({ page }) => {
  test.slow();
  const stat = `${(Date.now() % 900) + 100}`;
  const description = `Deskripsi uji ${uniqueSuffix()} untuk memeriksa pengaturan situs.`;

  await loginAs(page, 'admin');
  try {
    await page.goto('/admin/pengaturan');
    await expect(page.getByRole('heading', { name: 'Pengaturan situs', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Simpan pengaturan' })).toBeDisabled();
    expect(await audit(page)).toEqual([]);

    // Validasi di browser.
    await page.getByLabel(/^Deskripsi situs/).fill('pendek');
    await page.getByLabel('Instagram').fill('http://tidak-aman.example');
    await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
    await expect(page.getByText('Deskripsi minimal 20 karakter')).toBeVisible();
    await expect(page.getByText('Gunakan alamat lengkap yang diawali https://')).toBeVisible();
    await expect(page.getByLabel(/^Deskripsi situs/)).toBeFocused();
    expect(await audit(page)).toEqual([]);

    await page.getByLabel(/^Deskripsi situs/).fill(description);
    await page.getByLabel(/^Angka 2/).fill(stat);
    await page.getByLabel('Email').fill('humas@panrb.example.go.id');
    await page.getByLabel('Telepon').fill('(021) 555-1234');
    await page.getByLabel('Instagram').fill('https://www.instagram.com/panrb');
    await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
    await expect(page.getByText('Pengaturan tersimpan')).toBeVisible();

    // Situs publik: angka beranda, deskripsi, kontak, dan tautan media sosial di footer.
    await page.goto('/');
    await expect(page.getByText(stat, { exact: true })).toBeVisible();
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByText(description)).toBeVisible();
    await expect(footer.getByRole('link', { name: 'humas@panrb.example.go.id' })).toHaveAttribute(
      'href',
      'mailto:humas%40panrb.example.go.id',
    );
    await expect(footer.getByRole('link', { name: '(021) 555-1234' })).toHaveAttribute(
      'href',
      'tel:0215551234',
    );
    const instagram = footer.getByRole('link', { name: /^Instagram PEMDI PANRB/ });
    await expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/panrb');
    await expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(footer.getByRole('link', { name: /^Facebook/ })).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    expect(await audit(page)).toEqual([]);
  } finally {
    // Kembalikan nilai semula agar uji lain melihat situs seperti biasa.
    const restored = await apiSend(page, 'PUT', '/api/admin/settings', DEFAULTS);
    expect(restored.ok()).toBe(true);
  }
});

test('Penulis tidak dapat membuka atau mengubah pengaturan', async ({ page }) => {
  await loginAs(page, 'penulis');
  await page.goto('/admin/pengaturan');
  await expect(page.getByText('Halaman ini khusus Admin')).toBeVisible();

  const response = await apiSend(page, 'PUT', '/api/admin/settings', DEFAULTS);
  expect(response.status()).toBe(403);
  await logout(page);
});
