import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiRequest } from './api';

/**
 * Kontrak API publik (backend: routes/public.php). Tanpa sesi dan tanpa cookie; hanya artikel
 * berstatus terbit yang pernah keluar dari endpoint ini. Bentuk respons dijaga sama dengan uji
 * backend (tests/Feature/PublicContentTest.php) dan data tiruan MSW (src/test/publicApi.ts).
 */

export interface CategoryRef {
  name: string;
  slug: string;
}

/** Kategori yang punya minimal satu artikel terbit. */
export interface PublicCategory extends CategoryRef {
  articles_count: number;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt: string;
  /** Path se-origin (/storage/... atau /images/...), atau null bila tanpa gambar sampul. */
  cover_url: string | null;
  /** ISO 8601 (UTC). */
  published_at: string;
  category: CategoryRef;
  author: { name: string };
}

export interface PublicArticle extends ArticleSummary {
  /** HTML yang sudah disaring server (App\Support\ArticleHtmlSanitizer); aman dirender apa adanya. */
  body_html: string;
  source: string | null;
  reading_minutes: number;
}

export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ArticlePage {
  data: ArticleSummary[];
  meta: PageMeta;
}

export interface ArticleWithRelated {
  data: PublicArticle;
  /** Maksimal 3 artikel terbit lain dari kategori yang sama, terbaru lebih dulu. */
  related: ArticleSummary[];
}

export interface ArticleQuery {
  /** Slug kategori. */
  kategori?: string | null;
  cari?: string;
  page?: number;
  /** 1–24; bawaan server 12. */
  perPage?: number;
}

export function articlesUrl({ kategori, cari, page, perPage }: ArticleQuery = {}): string {
  const params = new URLSearchParams();
  if (kategori) params.set('kategori', kategori);
  if (cari?.trim()) params.set('cari', cari.trim());
  if (page && page > 1) params.set('page', String(page));
  if (perPage) params.set('per_page', String(perPage));
  const query = params.toString();
  return query ? `/api/articles?${query}` : '/api/articles';
}

export const contentKeys = {
  articles: (query: ArticleQuery) => ['public', 'articles', query] as const,
  article: (slug: string) => ['public', 'article', slug] as const,
  categories: ['public', 'categories'] as const,
};

export function useArticles(query: ArticleQuery, { enabled = true } = {}) {
  return useQuery({
    queryKey: contentKeys.articles(query),
    queryFn: ({ signal }) => apiRequest<ArticlePage>(articlesUrl(query), { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: contentKeys.article(slug),
    queryFn: ({ signal }) =>
      apiRequest<ArticleWithRelated>(`/api/articles/${encodeURIComponent(slug)}`, { signal }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: contentKeys.categories,
    queryFn: async ({ signal }) =>
      (await apiRequest<{ data: PublicCategory[] }>('/api/categories', { signal })).data,
    // Kategori jarang berubah dan dipakai di footer setiap halaman.
    staleTime: 5 * 60_000,
  });
}
