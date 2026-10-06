import { useState, useMemo } from 'react';
import { Card, Pagination, Chip } from '@idds/react';
import {
  articles,
  categoryOptions,
  type ArticleCategory,
} from '../data/articlesData';
import ArticleDetail from './ArticleDetail';

export default function Articles() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // Fixed 12 items per page
  const [selectedCategory, setSelectedCategory] =
    useState<ArticleCategory>('Semua');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
  );

  // Filter articles by category
  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'Semua') {
      return articles;
    }
    return articles.filter((article) => article.category === selectedCategory);
  }, [selectedCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentArticles = useMemo(
    () => filteredArticles.slice(startIndex, endIndex),
    [filteredArticles, startIndex, endIndex],
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category: string | string[]) => {
    const selectedCategory = Array.isArray(category) ? category[0] : category;
    setSelectedCategory(selectedCategory as ArticleCategory);
    setCurrentPage(1); // Reset to first page when category changes
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleArticleClick = (articleId: string) => {
    setSelectedArticleId(articleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedArticleId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (selectedArticleId) {
    return <ArticleDetail articleId={selectedArticleId} onBack={handleBack} />;
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#002A69] md:text-3xl">
          Portofolio Pemerintah Digital
        </h1>
        <p className="mb-6 mt-2 text-sm text-[#0B2148]/75 md:text-base">
          Jelajahi kabar, wawasan, dan dokumentasi inisiatif Pemerintah Digital.
        </p>

        {/* Category Filter */}
        <div className="mb-8">
          <Chip
            options={categoryOptions}
            selected={selectedCategory}
            onSelect={handleCategoryChange}
            showCustomization={false}
            variant="outline"
            size="medium"
            className="[&_.ina-chip__list]:flex-wrap [&_.ina-chip__list]:gap-2"
            selectedColor="#0968F6"
            selectedChipClassName="!bg-[#D4E5FE]"
          />
        </div>
      </div>

      {/* Articles Grid - 3 columns on desktop */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {currentArticles.map((article) => (
          <div
            key={article.id}
            onClick={() => handleArticleClick(article.id)}
            className="h-[330px] w-full cursor-pointer [&_.ina-card]:h-full [&_.ina-card]:w-full"
          >
            <Card
              variant="basic"
              mediaPosition="top"
              title={
                <span className="line-clamp-1 text-base font-semibold text-[#0B2148] md:text-lg">
                  {article.title}
                </span>
              }
              description={
                <span className="line-clamp-2 text-sm text-[#0B2148]/75 md:text-base">
                  {article.excerpt}
                </span>
              }
              mediaSrc={article.mediaSrc}
              mediaAlt={article.title}
              clickable={true}
              hoverable={true}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="mt-6 md:mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={[12]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            fullWidth={true}
          />
        </div>
      )}
    </div>
  );
}
