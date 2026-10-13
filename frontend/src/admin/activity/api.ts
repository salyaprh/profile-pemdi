import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import type { Paginated } from '../articles/types';

/** Log aktivitas (khusus Admin, hanya bisa dibaca). Backend: Admin\ActivityController. */
export interface ActivityEntry {
  id: number;
  /** Kode aksi, mis. artikel_dibuat, login_gagal. */
  action: string;
  /** Kelompok untuk filter: lihat ACTIVITY_GROUPS. */
  group: ActivityGroup;
  description: string;
  /** Null untuk aksi tanpa pelaku (mis. percobaan masuk dengan email yang tidak dikenal). */
  user_name: string | null;
  ip_address: string | null;
  created_at: string;
}

export const ACTIVITY_GROUPS = [
  { value: 'semua', label: 'Semua' },
  { value: 'login', label: 'Masuk dan keluar' },
  { value: 'artikel', label: 'Artikel' },
  { value: 'kategori', label: 'Kategori' },
  { value: 'pesan', label: 'Pesan' },
  { value: 'pengguna', label: 'Pengguna' },
  { value: 'pengaturan', label: 'Pengaturan' },
] as const;

export type ActivityGroup = Exclude<(typeof ACTIVITY_GROUPS)[number]['value'], 'semua'>;
export type ActivityFilter = (typeof ACTIVITY_GROUPS)[number]['value'];

export function useActivity(filter: ActivityFilter, page: number) {
  const params = new URLSearchParams();
  if (filter !== 'semua') params.set('kelompok', filter);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();

  return useQuery({
    queryKey: ['admin', 'activity', filter, page],
    queryFn: ({ signal }) =>
      apiRequest<Paginated<ActivityEntry>>(`/api/admin/activity${query ? `?${query}` : ''}`, {
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}
