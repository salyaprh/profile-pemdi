import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import type { Paginated } from '../articles/types';
import type { AdminRole } from '../auth';

/**
 * Kontrak API pengelolaan pengguna (khusus Admin). Backend: Admin\UserController. Akun tidak
 * pernah dihapus (riwayat penulis artikel harus utuh); akses dicabut dengan menonaktifkannya.
 */
export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  role_label: string;
  is_active: boolean;
  /** ISO 8601, atau null bila belum pernah masuk. */
  last_login_at: string | null;
  /** Wajib mengganti kata sandi pada login berikutnya (akun baru atau kata sandi baru dari Admin). */
  must_change_password: boolean;
  articles_count: number;
}

export type UserStatusFilter = 'semua' | 'aktif' | 'nonaktif';

export interface UserListFilters {
  status: UserStatusFilter;
  cari: string;
  halaman: number;
}

interface UserInput {
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
}

const userKeys = {
  all: ['admin', 'users'] as const,
  list: (filters: UserListFilters) => ['admin', 'users', 'list', filters] as const,
  detail: (id: number) => ['admin', 'users', 'detail', id] as const,
};

function listQuery({ status, cari, halaman }: UserListFilters): string {
  const params = new URLSearchParams();
  if (status !== 'semua') params.set('status', status);
  if (cari.trim()) params.set('cari', cari.trim());
  if (halaman > 1) params.set('page', String(halaman));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useUsers(filters: UserListFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<Paginated<ManagedUser>>(`/api/admin/users${listQuery(filters)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

/** `id` null (halaman Tambah pengguna) tidak mengambil apa pun. */
export function useUser(id: number | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? 0),
    queryFn: async ({ signal }) =>
      (await apiRequest<{ data: ManagedUser }>(`/api/admin/users/${id}`, { signal })).data,
    enabled: id !== null,
  });
}

function useStoreUserResult() {
  const queryClient = useQueryClient();
  return (user: ManagedUser) => {
    queryClient.setQueryData(userKeys.detail(user.id), user);
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'list'] });
  };
}

export function useCreateUser() {
  const store = useStoreUserResult();
  return useMutation({
    mutationFn: async (input: Omit<UserInput, 'is_active'> & { password: string }) =>
      (
        await apiRequest<{ data: ManagedUser }>('/api/admin/users', {
          method: 'POST',
          body: input,
        })
      ).data,
    onSuccess: store,
  });
}

export function useUpdateUser(id: number) {
  const store = useStoreUserResult();
  return useMutation({
    mutationFn: async (input: UserInput) =>
      (
        await apiRequest<{ data: ManagedUser }>(`/api/admin/users/${id}`, {
          method: 'PUT',
          body: input,
        })
      ).data,
    onSuccess: store,
  });
}

export function useResetPassword(id: number) {
  const store = useStoreUserResult();
  return useMutation({
    mutationFn: async (password: string) =>
      (
        await apiRequest<{ data: ManagedUser }>(`/api/admin/users/${id}/password`, {
          method: 'POST',
          body: { password },
        })
      ).data,
    onSuccess: store,
  });
}
