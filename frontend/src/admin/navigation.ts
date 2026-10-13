import {
  IconArticle,
  IconCategory,
  IconHistory,
  IconLayoutDashboard,
  IconMail,
  IconSettings,
  IconUserCircle,
  IconUsers,
  type Icon,
} from '@tabler/icons-react';
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

export const adminNavItems: AdminNavItem[] = [
  {
    label: 'Dasbor',
    to: paths.admin,
    icon: IconLayoutDashboard,
    isActive: (pathname) => pathname === paths.admin,
  },
  {
    label: 'Artikel',
    to: paths.adminArticles,
    icon: IconArticle,
    isActive: (pathname) =>
      pathname === paths.adminArticles || pathname.startsWith(`${paths.adminArticles}/`),
  },
  {
    label: 'Kategori',
    to: paths.adminCategories,
    icon: IconCategory,
    isActive: (pathname) => pathname === paths.adminCategories,
    roles: ['admin'],
  },
  {
    label: 'Pesan',
    to: paths.adminMessages,
    icon: IconMail,
    isActive: (pathname) =>
      pathname === paths.adminMessages || pathname.startsWith(`${paths.adminMessages}/`),
    roles: ['admin'],
  },
  {
    label: 'Pengguna',
    to: paths.adminUsers,
    icon: IconUsers,
    isActive: (pathname) =>
      pathname === paths.adminUsers || pathname.startsWith(`${paths.adminUsers}/`),
    roles: ['admin'],
  },
  {
    label: 'Pengaturan',
    to: paths.adminSettings,
    icon: IconSettings,
    isActive: (pathname) => pathname === paths.adminSettings,
    roles: ['admin'],
  },
  {
    label: 'Aktivitas',
    to: paths.adminActivity,
    icon: IconHistory,
    isActive: (pathname) => pathname === paths.adminActivity,
    roles: ['admin'],
  },
  {
    label: 'Akun saya',
    to: paths.adminAccount,
    icon: IconUserCircle,
    isActive: (pathname) => pathname === paths.adminAccount,
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
