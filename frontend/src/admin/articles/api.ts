import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import type {
  AdminArticle,
  AdminArticleSummary,
  ArticleAction,
  ArticleInput,
  ArticleListFilters,
  Category,
  Paginated,
  UploadedMedia,
} from './types';

export const articleKeys = {
  all: ['admin', 'articles'] as const,
  list: (filters: ArticleListFilters) => ['admin', 'articles', 'list', filters] as const,
  detail: (id: number) => ['admin', 'articles', 'detail', id] as const,
};

export const categoryKeys = { all: ['admin', 'categories'] as const };

function listQuery({ status, kategori, cari, halaman }: ArticleListFilters): string {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (kategori) params.set('kategori', String(kategori));
  if (cari.trim()) params.set('cari', cari.trim());
  if (halaman > 1) params.set('page', String(halaman));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useArticles(filters: ArticleListFilters) {
  return useQuery({
    queryKey: articleKeys.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<Paginated<AdminArticleSummary>>(`/api/admin/articles${listQuery(filters)}`, {
        signal,
      }),
    // Saat berpindah filter/halaman, daftar lama tetap tampil sampai data baru siap.
    placeholderData: keepPreviousData,
  });
}

export function useArticle(id: number | null) {
  return useQuery({
    queryKey: articleKeys.detail(id ?? 0),
    queryFn: async ({ signal }) =>
      (await apiRequest<{ data: AdminArticle }>(`/api/admin/articles/${id}`, { signal })).data,
    enabled: id !== null,
  });
}

/** Memperbarui cache detail lalu menandai daftar & dasbor usang. */
function useStoreArticleResult() {
  const queryClient = useQueryClient();
  return (article: AdminArticle) => {
    queryClient.setQueryData(articleKeys.detail(article.id), article);
    void queryClient.invalidateQueries({ queryKey: ['admin', 'articles', 'list'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };
}

export function useSaveArticle(id: number | null) {
  const store = useStoreArticleResult();
  return useMutation({
    mutationFn: async (input: ArticleInput) => {
      const path = id === null ? '/api/admin/articles' : `/api/admin/articles/${id}`;
      const body = {
        ...input,
        slug: input.slug.trim() || null,
        source: input.source.trim() || null,
      };
      return (
        await apiRequest<{ data: AdminArticle }>(path, {
          method: id === null ? 'POST' : 'PUT',
          body,
        })
      ).data;
    },
    onSuccess: store,
  });
}

export function useArticleAction(id: number) {
  const store = useStoreArticleResult();
  return useMutation({
    mutationFn: async ({ action, note }: { action: ArticleAction | 'restore'; note?: string }) =>
      (
        await apiRequest<{ data: AdminArticle }>(`/api/admin/articles/${id}/${action}`, {
          method: 'POST',
          body: note === undefined ? undefined : { note },
        })
      ).data,
    onSuccess: store,
  });
}

export function useDeleteArticle(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ permanent }: { permanent: boolean }) =>
      apiRequest<void>(`/api/admin/articles/${id}${permanent ? '/permanent' : ''}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: articleKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'articles', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: async ({ signal }) =>
      (await apiRequest<{ data: Category[] }>('/api/admin/categories', { signal })).data,
    staleTime: 5 * 60_000,
  });
}

export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number | null; name: string }) =>
      (
        await apiRequest<{ data: Category }>(
          id === null ? '/api/admin/categories' : `/api/admin/categories/${id}`,
          { method: id === null ? 'POST' : 'PUT', body: { name } },
        )
      ).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/api/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

/** Batas yang sama dengan backend (MediaUploadRequest): diperiksa di browser agar cepat ditolak. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Pesan galat bila berkas tidak memenuhi syarat, atau null bila boleh diunggah. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return 'Berkas harus berupa gambar JPG, PNG, atau WebP.';
  if (file.size > MAX_IMAGE_BYTES) return 'Ukuran gambar maksimal 5 MB.';
  return null;
}

export async function uploadImage(file: File): Promise<UploadedMedia> {
  const body = new FormData();
  body.append('file', file);
  return (await apiRequest<{ data: UploadedMedia }>('/api/admin/media', { method: 'POST', body }))
    .data;
}
