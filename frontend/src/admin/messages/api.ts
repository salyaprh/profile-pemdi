import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import type { Paginated } from '../articles/types';

/**
 * Pesan dari formulir "Hubungi kami" (khusus Admin). Isinya disimpan terenkripsi di database
 * dan dihapus otomatis 12 bulan setelah diterima (backend: App\Models\ContactMessage).
 */
export interface ContactMessageSummary {
  id: number;
  name: string;
  email: string;
  subject: string;
  /** Potongan awal isi pesan untuk daftar. */
  preview: string;
  received_at: string;
  read_at: string | null;
}

export interface ContactMessageDetail extends ContactMessageSummary {
  phone: string | null;
  message: string;
}

export type MessageFilter = 'semua' | 'belum-dibaca';

export const messageKeys = {
  list: (filter: MessageFilter, page: number) =>
    ['admin', 'messages', 'list', filter, page] as const,
  detail: (id: number) => ['admin', 'messages', 'detail', id] as const,
};

export function useMessages(filter: MessageFilter, page: number) {
  const params = new URLSearchParams();
  if (filter === 'belum-dibaca') params.set('status', 'belum-dibaca');
  if (page > 1) params.set('page', String(page));
  const query = params.toString();

  return useQuery({
    queryKey: messageKeys.list(filter, page),
    queryFn: ({ signal }) =>
      apiRequest<Paginated<ContactMessageSummary>>(
        `/api/admin/messages${query ? `?${query}` : ''}`,
        { signal },
      ),
    placeholderData: keepPreviousData,
  });
}

export function useMessage(id: number) {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: async ({ signal }) =>
      (await apiRequest<{ data: ContactMessageDetail }>(`/api/admin/messages/${id}`, { signal }))
        .data,
  });
}

function useInvalidateMessageLists() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'messages', 'list'] });
    // Dasbor menampilkan jumlah pesan belum dibaca.
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };
}

export function useMarkMessage(id: number) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateMessageLists();
  return useMutation({
    mutationFn: async (read: boolean) =>
      (
        await apiRequest<{ data: ContactMessageDetail }>(`/api/admin/messages/${id}`, {
          method: 'PATCH',
          body: { read },
        })
      ).data,
    onSuccess: (message) => {
      queryClient.setQueryData(messageKeys.detail(id), message);
      invalidateLists();
    },
  });
}

export function useDeleteMessage(id: number) {
  const queryClient = useQueryClient();
  const invalidateLists = useInvalidateMessageLists();
  return useMutation({
    mutationFn: () => apiRequest<void>(`/api/admin/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: messageKeys.detail(id) });
      invalidateLists();
    },
  });
}
