import { useMemo } from 'react';
import { Chip } from '@idds/react';
import ArticleCard from '../components/ArticleCard';
import ButtonLink from '../components/ButtonLink';
import EmptyState from '../components/EmptyState';
import PaginationNav from '../components/PaginationNav';
import {
  articles,
  categoryOptions,
  isCategoryFilter,
  type CategoryFilter,
} from '../data/articlesData';
import { navigate, paths, useLocation } from '../lib/router';
import { usePageMeta } from '../lib/seo';

const PAGE_SIZE = 12;

function buildUrl(category: CategoryFilter, page: number) {
  const params = new URLSearchParams();
  if (category !== 'Semua') params.set('kategori', category);
  if (page > 1) params.set('halaman', String(page));
  const query = params.toString();
  return query ? `${paths.portfolio}?${query}` : paths.portfolio;
}

/**
 * Daftar portofolio. Kategori dan halaman disimpan di URL
 * (?kategori=...&halaman=...) agar tombol Back dan tautan langsung berfungsi.
 */
export default function Articles() {
  usePageMeta({
    title: 'Portofolio',
    description: 'Jelajahi kabar, wawasan, dan dokumentasi inisiatif Pemerintah Digital.',
    path: paths.portfolio,
  });
  const { searchParams } = useLocation();

  const categoryParam = searchParams.get('kategori');
  const selectedCategory: CategoryFilter = isCategoryFilter(categoryParam)
    ? categoryParam
    : 'Semua';

  const filteredArticles = useMemo(
    () =>
      selectedCategory === 'Semua'
        ? articles
        : articles.filter((article) => article.category === selectedCategory),
    [selectedCategory],
  );

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const requestedPage = Math.floor(Number(searchParams.get('halaman'))) || 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentArticles = filteredArticles.slice(startIndex, startIndex + PAGE_SIZE);

  const handleCategoryChange = (value: string | string[]) => {
    const next = Array.isArray(value) ? value[0] : value;
    navigate(buildUrl(isCategoryFilter(next) ? next : 'Semua', 1), { scroll: false });
  };

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

      <div className="mb-8">
        <Chip
          options={categoryOptions}
          selected={selectedCategory}
          onSelect={handleCategoryChange}
          showCustomization={false}
          variant="outline"
          size="medium"
          className="[&_.ina-chip__list]:flex-wrap [&_.ina-chip__list]:gap-2"
          selectedColor="var(--color-primary-600)"
          selectedChipClassName="!bg-primary-50"
        />
      </div>

      <p className="mb-4 text-caption text-content-secondary" role="status">
        {filteredArticles.length > 0
          ? `Menampilkan ${startIndex + 1}-${startIndex + currentArticles.length} dari ${filteredArticles.length} artikel`
          : 'Tidak ada artikel'}
      </p>

      {currentArticles.length > 0 ? (
        <ul className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {currentArticles.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Belum ada artikel di kategori ini"
          description="Coba pilih kategori lain atau tampilkan semua artikel."
          action={
            <ButtonLink to={paths.portfolio} hierarchy="secondary">
              Tampilkan semua artikel
            </ButtonLink>
          }
        />
      )}

      <div className="mt-6 md:mt-8">
        <PaginationNav
          currentPage={currentPage}
          totalPages={totalPages}
          hrefFor={(page) => buildUrl(selectedCategory, page)}
        />
      </div>
    </div>
  );
}
