import { IconLayoutDashboard, type Icon } from '@tabler/icons-react';
import { isAdminPath, paths } from '../lib/router';
import type { AdminRole } from './auth';

export interface AdminNavItem {
  /** Pola Sidebar IDDS: maksimal 2 kata. */
  label: string;
  to: string;
  icon: Icon;
  isActive: (pathname: string) => boolean;
  /** Menu yang hanya tampil untuk peran tertentu; kosong = semua peran. */
  roles?: AdminRole[];
}

// Menu ditambah per fase (Artikel, Kategori, Pesan, Pengguna, Pengaturan, Aktivitas).
export const adminNavItems: AdminNavItem[] = [
  {
    label: 'Dasbor',
    to: paths.admin,
    icon: IconLayoutDashboard,
    isActive: (pathname) => pathname === paths.admin,
  },
];

export function navItemsFor(role: AdminRole): AdminNavItem[] {
  return adminNavItems.filter((item) => !item.roles || item.roles.includes(role));
}

/**
 * Tujuan setelah login dari parameter ?kembali=. Hanya path di dalam panel admin yang diterima,
 * agar tautan login tidak bisa dipakai untuk mengalihkan pengguna ke situs lain (open redirect).
 */
export function safeReturnPath(value: string | null): string {
  if (!value) return paths.admin;
  const pathname = value.split(/[?#]/)[0];
  return isAdminPath(pathname) && pathname !== paths.adminLogin ? value : paths.admin;
}
