import { useState } from 'react';
import { Button, TextField } from '@idds/react';
import { IconArticle, IconPlus, IconSearch } from '@tabler/icons-react';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import PaginationNav from '../../components/PaginationNav';
import { formatDateTime } from '../../lib/format';
import { Link, navigate, paths, useLocation } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import FilterChips from '../../components/FilterChips';
import { useArticles, useCategories } from '../articles/api';
import type { ArticleListFilters, ArticleStatusFilter } from '../articles/types';
import { useAuthenticatedUser } from '../auth';
import StatusBadge from '../components/StatusBadge';
import LoadError from '../components/LoadError';
import { DataTable, HeaderCell } from '../components/Table';
import SelectField from '../components/SelectField';

const statusOptions: {
  label: string;
  value: ArticleStatusFilter | 'semua';
  adminOnly?: boolean;
}[] = [
  { label: 'Semua', value: 'semua' },
  { label: 'Draf', value: 'draf' },
  { label: 'Menunggu tinjauan', value: 'ditinjau' },
  { label: 'Terbit', value: 'terbit' },
  { label: 'Sampah', value: 'sampah', adminOnly: true },
];

const STATUS_VALUES = ['draf', 'ditinjau', 'terbit', 'sampah'];

function readFilters(searchParams: URLSearchParams): ArticleListFilters {
  const status = searchParams.get('status');
  const kategori = Number(searchParams.get('kategori'));
  const halaman = Number(searchParams.get('halaman'));
  return {
    status: status && STATUS_VALUES.includes(status) ? (status as ArticleStatusFilter) : null,
    kategori: Number.isInteger(kategori) && kategori > 0 ? kategori : null,
    cari: searchParams.get('cari') ?? '',
    halaman: Number.isInteger(halaman) && halaman > 1 ? halaman : 1,
  };
}

function listUrl({ status, kategori, cari, halaman }: ArticleListFilters): string {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (kategori) params.set('kategori', String(kategori));
  if (cari.trim()) params.set('cari', cari.trim());
  if (halaman > 1) params.set('halaman', String(halaman));
  const query = params.toString();
  return query ? `${paths.adminArticles}?${query}` : paths.adminArticles;
}

/**
 * Daftar artikel (pola Table IDDS): filter status, kategori, dan pencarian judul tersimpan di URL
 * sehingga bertahan saat membuka artikel lalu kembali. Penulis hanya melihat artikel miliknya.
 */
export default function ArticleListPage() {
  usePageMeta({ title: 'Artikel', noindex: true });

  const user = useAuthenticatedUser();
  const isAdmin = user.role === 'admin';
  const { searchParams } = useLocation();
  const filters = readFilters(searchParams);
  const articles = useArticles(filters);
  const categories = useCategories();
  const [search, setSearch] = useState(filters.cari);

  const applyFilters = (changes: Partial<ArticleListFilters>) => {
    // Filter berubah = kembali ke halaman 1.
    navigate(listUrl({ ...filters, halaman: 1, ...changes }), { replace: true, scroll: false });
  };

  const options = statusOptions.filter((option) => !option.adminOnly || isAdmin);
  const total = articles.data?.meta.total ?? 0;
  const isFiltered = Boolean(filters.status || filters.kategori || filters.cari);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-h5 font-semibold">Artikel</h1>
          <p className="text-caption text-content-secondary">
            {isAdmin
              ? 'Kelola semua artikel portofolio, tinjau pengajuan, dan terbitkan.'
              : 'Tulis artikel lalu ajukan ke Admin untuk ditinjau dan diterbitkan.'}
          </p>
        </div>
        <ButtonLink to={paths.adminArticleNew} className="shrink-0">
          <IconPlus size={18} aria-hidden="true" />
          Tulis artikel
        </ButtonLink>
      </div>

      <div className="space-y-4 rounded-xl border border-stroke-primary bg-background-primary p-4">
        <FilterChips
          label="Filter status"
          options={options}
          selected={filters.status ?? 'semua'}
          onSelect={(value) => applyFilters({ status: value === 'semua' ? null : value })}
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
          <TextField
            id="artikel-cari"
            name="cari"
            label="Cari judul"
            placeholder="Ketik judul artikel"
            value={search}
            onChange={setSearch}
            debounce={350}
            onChangeDebounced={(value) => {
              if (value.trim() !== filters.cari.trim()) applyFilters({ cari: value });
            }}
            prefixIcon={<IconSearch size={16} aria-hidden="true" />}
            inputMode="search"
            autoComplete="off"
          />
          <SelectField
            label="Kategori"
            value={filters.kategori ? String(filters.kategori) : ''}
            onValueChange={(value) => applyFilters({ kategori: value ? Number(value) : null })}
            options={(categories.data ?? []).map(({ id, name }) => ({
              value: String(id),
              label: name,
            }))}
            placeholder="Semua kategori"
          />
        </div>
      </div>

      <p role="status" className="text-caption text-content-secondary">
        {articles.isPending ? 'Memuat artikel…' : `${total} artikel`}
      </p>

      {articles.isError ? (
        <LoadError
          title="Daftar artikel gagal dimuat"
          message={articles.error.message}
          onRetry={() => void articles.refetch()}
        />
      ) : articles.data && articles.data.data.length === 0 ? (
        <EmptyState
          icon={<IconArticle size={32} aria-hidden="true" />}
          title={isFiltered ? 'Tidak ada artikel yang cocok' : 'Belum ada artikel'}
          description={
            isFiltered
              ? 'Ubah atau hapus filter untuk melihat artikel lain.'
              : 'Mulai dengan menulis artikel pertama Anda.'
          }
          action={
            isFiltered ? (
              <Button
                hierarchy="secondary"
                onClick={() => {
                  setSearch('');
                  navigate(paths.adminArticles, { replace: true, scroll: false });
                }}
              >
                Hapus filter
              </Button>
            ) : (
              <ButtonLink to={paths.adminArticleNew}>Tulis artikel</ButtonLink>
            )
          }
        />
      ) : (
        articles.data && (
          <>
            <DataTable
              label="Tabel artikel"
              head={
                <tr>
                  <HeaderCell>Judul</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  {isAdmin && <HeaderCell>Penulis</HeaderCell>}
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Diperbarui</HeaderCell>
                </tr>
              }
            >
              {articles.data.data.map((article) => (
                <tr key={article.id} className="align-top hover:bg-background-secondary">
                  <td className="max-w-md px-4 py-3">
                    <Link
                      to={paths.adminArticle(article.id)}
                      className="font-semibold text-content-primary hover:text-primary-600 hover:underline"
                    >
                      {article.title}
                    </Link>
                    {article.review_note && article.status === 'draf' && (
                      <p className="mt-1 text-caption-sm text-content-secondary">
                        Dikembalikan dengan catatan dari Admin
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-content-secondary">{article.category.name}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-content-secondary">{article.author.name}</td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={article.status}
                      label={article.status_label}
                      trashed={article.deleted_at !== null}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-content-secondary">
                    {article.updated_at ? formatDateTime(article.updated_at) : '–'}
                  </td>
                </tr>
              ))}
            </DataTable>
            <PaginationNav
              currentPage={articles.data.meta.current_page}
              totalPages={articles.data.meta.last_page}
              hrefFor={(page) => listUrl({ ...filters, halaman: page })}
            />
          </>
        )
      )}
    </div>
  );
}
