import { Button } from '@idds/react';
import ArticleCard, { ArticleGridSkeleton } from '../components/ArticleCard';
import ButtonLink from '../components/ButtonLink';
import EmptyState from '../components/EmptyState';
import FilterChips from '../components/FilterChips';
import PaginationNav from '../components/PaginationNav';
import { navigate, paths, portfolioUrl, useLocation } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import { useArticles, useCategories } from '../services/content';

const PAGE_SIZE = 12;
const ALL = 'semua';

/**
 * Daftar portofolio. Kategori (slug) dan halaman disimpan di URL
 * (?kategori=layanan-publik&halaman=2) agar tombol Back dan tautan langsung berfungsi.
 */
export default function Articles() {
  usePageMeta({
    title: 'Portofolio',
    description: 'Jelajahi kabar, wawasan, dan dokumentasi inisiatif Pemerintah Digital.',
    path: paths.portfolio,
  });
  const { searchParams } = useLocation();
  const category = searchParams.get('kategori') || null;
  const requestedPage = Math.floor(Number(searchParams.get('halaman')));
  const page = requestedPage > 1 ? requestedPage : 1;

  const categories = useCategories();
  const articles = useArticles({ kategori: category, page, perPage: PAGE_SIZE });

  const options = [
    { label: 'Semua', value: ALL },
    ...(categories.data ?? []).map(({ name, slug }) => ({ label: name, value: slug })),
  ];

  const meta = articles.data?.meta;
  const list = articles.data?.data ?? [];
  const first = meta ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const outOfRange = meta !== undefined && list.length === 0 && meta.total > 0;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-h5 font-bold text-content-primary lg:text-h3">
          Portofolio Pemerintah Digital
        </h1>
        <p className="text-body-sm text-content-secondary">
          Jelajahi kabar, wawasan, dan dokumentasi inisiatif Pemerintah Digital.
        </p>
      </div>

      {categories.data && (
        <div className="mb-8">
          <FilterChips
            label="Filter kategori"
            size="medium"
            options={options}
            selected={category ?? ALL}
            onSelect={(value) =>
              navigate(portfolioUrl(value === ALL ? null : value), { scroll: false })
            }
          />
        </div>
      )}

      {articles.isPending ? (
        <ArticleGridSkeleton count={6} />
      ) : articles.isError ? (
        <EmptyState
          title="Artikel gagal dimuat"
          description={articles.error.message}
          action={
            <Button hierarchy="secondary" onClick={() => void articles.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-caption text-content-secondary" role="status">
            {list.length > 0
              ? `Menampilkan ${first}-${first + list.length - 1} dari ${articles.data.meta.total} artikel`
              : 'Tidak ada artikel'}
          </p>

          {list.length > 0 ? (
            <ul
              className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
              aria-busy={articles.isPlaceholderData}
            >
              {list.map((article) => (
                <li key={article.slug}>
                  <ArticleCard article={article} />
                </li>
              ))}
            </ul>
          ) : outOfRange ? (
            <EmptyState
              title="Halaman ini kosong"
              description={`Daftar ini hanya sampai halaman ${articles.data.meta.last_page}.`}
              action={
                <ButtonLink to={portfolioUrl(category)} hierarchy="secondary">
                  Ke halaman pertama
                </ButtonLink>
              }
            />
          ) : (
            <EmptyState
              title={category ? 'Belum ada artikel di kategori ini' : 'Belum ada artikel'}
              description={
                category
                  ? 'Coba pilih kategori lain atau tampilkan semua artikel.'
                  : 'Artikel yang terbit akan tampil di sini.'
              }
              action={
                category ? (
                  <ButtonLink to={paths.portfolio} hierarchy="secondary">
                    Tampilkan semua artikel
                  </ButtonLink>
                ) : undefined
              }
            />
          )}

          {list.length > 0 && (
            <div className="mt-6 md:mt-8">
              <PaginationNav
                currentPage={articles.data.meta.current_page}
                totalPages={articles.data.meta.last_page}
                hrefFor={(target) => portfolioUrl(category, target)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
