/** Bentuk data dari backend (app/Http/Resources/AdminArticleResource.php dan CategoryResource.php). */

export type ArticleStatus = 'draf' | 'ditinjau' | 'terbit';

/** Filter status di daftar artikel; 'sampah' khusus Admin. */
export type ArticleStatusFilter = ArticleStatus | 'sampah';

export type ArticleAction = 'submit' | 'withdraw' | 'publish' | 'return' | 'unpublish';

export interface ArticleAbilities {
  update: boolean;
  delete: boolean;
  restore: boolean;
  force_delete: boolean;
  submit: boolean;
  withdraw: boolean;
  publish: boolean;
  return: boolean;
  unpublish: boolean;
}

export interface AdminArticleSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string | null;
  source: string | null;
  status: ArticleStatus;
  status_label: string;
  review_note: string | null;
  category: { id: number; name: string };
  author: { id: number; name: string };
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  can: ArticleAbilities;
}

export interface AdminArticle extends AdminArticleSummary {
  body_html: string;
}

/** Isian formulir artikel yang dikirim ke backend. */
export interface ArticleInput {
  title: string;
  slug: string;
  excerpt: string;
  body_html: string;
  category_id: number | null;
  cover_url: string | null;
  source: string;
  /** Penguncian optimistis: `updated_at` artikel saat formulir dibuka. */
  updated_at?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  articles_count: number;
}

export interface UploadedMedia {
  id: number;
  url: string;
  og_url: string;
  width: number;
  height: number;
}

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface ArticleListFilters {
  status: ArticleStatusFilter | null;
  kategori: number | null;
  cari: string;
  halaman: number;
}
