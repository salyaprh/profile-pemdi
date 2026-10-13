import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Akun demo dari backend/database/seeders/DemoUserSeeder.php (database e2e sementara). */
export const accounts = {
  admin: { email: 'admin@pemdi.test', name: 'Admin Demo' },
  penulis: { email: 'penulis@pemdi.test', name: 'Penulis Demo' },
} as const;

/** Diatur playwright.config.ts dan dipakai e2e/start-backend.mjs untuk seeder. */
export function demoPassword(): string {
  const password = process.env.E2E_DEMO_PASSWORD;
  if (!password) throw new Error('E2E_DEMO_PASSWORD belum diatur (lihat playwright.config.ts)');
  return password;
}

export async function fillLogin(page: Page, email: string, password: string) {
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Kata sandi/).fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

/** Masuk lewat halaman Masuk dan menunggu dasbor tampil. */
export async function loginAs(page: Page, role: keyof typeof accounts) {
  await page.goto('/admin/masuk');
  await fillLogin(page, accounts[role].email, demoPassword());
  await expect(page.getByRole('heading', { name: 'Dasbor', level: 1 })).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL('/admin/masuk');
}

/**
 * Penanda unik per uji. Semua worker dan proyek (desktop/mobile) memakai satu database e2e,
 * jadi judul artikel dan nama kategori yang dibuat uji tidak boleh bertabrakan.
 */
export function uniqueSuffix(): string {
  const info = test.info();
  return `${info.project.name}-${info.workerIndex}-${Date.now().toString(36)}`;
}

/** Gambar contoh untuk uji unggah: WebP 328×202 dari aset situs (backend menerima ≥ 200×200). */
export const sampleImage = fileURLToPath(
  new URL('../public/images/articles/article-2.webp', import.meta.url),
);

/** Memilih berkas lewat tombol unggah, seperti pengguna (dialog berkas dicegat Playwright). */
export async function chooseFile(page: Page, button: Locator, file: string) {
  const chooser = page.waitForEvent('filechooser');
  await button.click();
  await (await chooser).setFiles(file);
}

/**
 * POST ke API dengan sesi halaman ini, termasuk header CSRF yang biasanya dikirim
 * src/services/api.ts. Untuk memastikan backend sendiri menolak aksi yang disembunyikan UI.
 */
export async function apiPost(page: Page, url: string, data: unknown) {
  const cookies = await page.context().cookies();
  const xsrf = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? '';
  return page.request.post(url, {
    data,
    headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(xsrf) },
  });
}
