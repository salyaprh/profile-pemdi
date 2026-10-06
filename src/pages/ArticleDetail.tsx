import { Avatar, Breadcrumb } from '@idds/react';
import { IconArrowRight } from '@tabler/icons-react';
import ArticleCard from '../components/ArticleCard';
import ButtonLink from '../components/ButtonLink';
import {
  getArticleById,
  getArticleContent,
  getReadingMinutes,
  getRelatedArticles,
} from '../data/articlesData';
import { formatDate } from '../lib/format';
import { navigate, paths, usePageTitle } from '../lib/router';
import NotFound from './NotFound';

interface ArticleDetailProps {
  articleId: string;
}

/** Pola Blog Post IDDS: header artikel, isi, lalu "Artikel terkait". */
export default function ArticleDetail({ articleId }: ArticleDetailProps) {
  const article = getArticleById(articleId);
  usePageTitle(article?.title ?? 'Artikel tidak ditemukan');

  if (!article) {
    return (
      <NotFound
        title="Artikel tidak ditemukan"
        description="Maaf, artikel yang Anda cari tidak tersedia. Artikel tersebut mungkin telah dipindahkan atau dihapus."
      />
    );
  }

  const related = getRelatedArticles(article);
  const categoryUrl = `${paths.portfolio}?kategori=${encodeURIComponent(article.category)}`;

  return (
    <article className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6 lg:gap-8">
        <Breadcrumb
          maxLength={24}
          items={[
            { label: 'Beranda', onClick: () => navigate(paths.home) },
            { label: 'Portofolio', onClick: () => navigate(paths.portfolio) },
            { label: article.title },
          ]}
        />

        <header className="space-y-3 lg:space-y-4">
          <p className="text-caption font-bold text-primary-600">{article.category}</p>
          <div>
            <p className="text-caption-sm text-content-secondary">{getReadingMinutes(article)} menit baca</p>
            <h1 className="mt-1 text-h4 font-semibold text-content-primary lg:text-h2">{article.title}</h1>
          </div>
          <p className="text-body-sm text-content-secondary lg:text-body">{article.excerpt}</p>
          <p className="text-caption-sm text-content-secondary">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          </p>
          <div className="flex items-center gap-2">
            <Avatar initials={article.author.slice(0, 2).toUpperCase()} alt="" />
            <span className="text-body-sm text-content-primary">{article.author}</span>
          </div>
        </header>

        <figure className="space-y-2">
          <img src={article.mediaSrc} alt={article.title} className="h-auto w-full rounded-lg" />
          {article.source && (
            <figcaption className="text-caption-sm text-content-secondary">Sumber: {article.source}</figcaption>
          )}
        </figure>

        <div className="space-y-4">
          {getArticleContent(article).map((paragraph, index) => (
            <p key={index} className="text-body-sm leading-relaxed text-content-primary lg:text-body">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12 space-y-6 border-t border-stroke-primary pt-8 lg:mt-16" aria-labelledby="judul-terkait">
          <div className="flex items-center justify-between gap-4">
            <h2 id="judul-terkait" className="text-body font-semibold text-content-primary">
              Artikel terkait
            </h2>
            <ButtonLink to={categoryUrl} hierarchy="tertiary">
              Lihat semua <IconArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {related.map((item) => (
              <li key={item.id}>
                <ArticleCard article={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
