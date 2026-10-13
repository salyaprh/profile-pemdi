import type { Page } from '@playwright/test';
import { expect } from './fixtures';

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
