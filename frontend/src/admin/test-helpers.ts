import { http, HttpResponse } from 'msw';
import { server, setXsrfCookie } from '../test/server';
import type { AdminArticle, Category } from './articles/types';
import type { AdminUser } from './auth';

/** Data dan backend tiruan untuk uji halaman admin (bentuk sama dengan resource Laravel). */

export const adminUser: AdminUser = {
  id: 1,
  name: 'Admin Utama',
  email: 'admin@pemdi.test',
  role: 'admin',
  role_label: 'Admin',
};

export const penulisUser: AdminUser = {
  id: 2,
  name: 'Siti Penulis',
  email: 'siti@pemdi.test',
  role: 'penulis',
  role_label: 'Penulis',
};

export const categories: Category[] = [
  { id: 1, name: 'Layanan Publik', slug: 'layanan-publik', articles_count: 13 },
  { id: 2, name: 'Panduan Pengguna', slug: 'panduan-pengguna', articles_count: 0 },
];

const noAbilities = {
  update: false,
  delete: false,
  restore: false,
  force_delete: false,
  submit: false,
  withdraw: false,
  publish: false,
  return: false,
  unpublish: false,
};

export function makeArticle(overrides: Partial<AdminArticle> = {}): AdminArticle {
  return {
    id: 7,
    title: 'Integrasi Layanan Digital ASN',
    slug: 'integrasi-layanan-digital-asn',
    excerpt: 'Ringkasan tentang integrasi layanan digital bagi ASN.',
    body_html: '<p>Isi awal artikel.</p>',
    cover_url: null,
    source: null,
    status: 'draf',
    status_label: 'Draf',
    review_note: null,
    category: { id: 1, name: 'Layanan Publik' },
    author: { id: 2, name: 'Siti Penulis' },
    published_at: null,
    created_at: '2026-10-13T03:00:00+00:00',
    updated_at: '2026-10-13T03:00:00+00:00',
    deleted_at: null,
    ...overrides,
    can: { ...noAbilities, ...overrides.can },
  };
}

/** Sesi login + kategori; handler lain dipasang per uji. */
export function mockSession(user: AdminUser) {
  server.use(
    http.get('/api/csrf', () => {
      setXsrfCookie('token-uji');
      return new HttpResponse(null, { status: 204 });
    }),
    http.get('/api/auth/me', () => HttpResponse.json({ user })),
    http.get('/api/admin/categories', () => HttpResponse.json({ data: categories })),
  );
}
