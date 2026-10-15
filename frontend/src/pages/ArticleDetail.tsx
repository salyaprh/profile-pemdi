import { Avatar, Breadcrumb, Button, Skeleton } from '@idds/react';
import { IconArrowRight } from '@tabler/icons-react';
import ArticleCard from '../components/ArticleCard';
import ButtonLink from '../components/ButtonLink';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../lib/format';
import { navigate, paths, portfolioUrl } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import { ApiError } from '../services/api';
import { useArticle } from '../services/content';
import NotFound from './NotFound';

interface ArticleDetailProps {
  slug: string;
}

const container = 'mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-6 lg:px-8 lg:py-12';

/** Pola Blog Post IDDS: header artikel, isi, lalu "Artikel terkait". */
export default function ArticleDetail({ slug }: ArticleDetailProps) {
  const query = useArticle(slug);
  const article = query.data?.data;
  const notFound = query.error instanceof ApiError && query.error.status === 404;

  usePageMeta(
    article
      ? { title: article.title, description: article.excerpt, path: paths.article(article.slug) }
      : notFound
        ? { title: 'Artikel tidak ditemukan', noindex: true }
        : { title: 'Portofolio', noindex: true },
  );

  if (notFound) {
    return (
      <NotFound
        title="Artikel tidak ditemukan"
        description="Maaf, artikel yang Anda cari tidak tersedia. Artikel tersebut mungkin telah dipindahkan atau dihapus."
      />
    );
  }

  if (query.isError) {
    return (
      <div className={container}>
        <h1 className="sr-only">Artikel gagal dimuat</h1>
        <EmptyState
          title="Artikel gagal dimuat"
          description={query.error.message}
          action={
            <Button hierarchy="secondary" onClick={() => void query.refetch()}>
              Coba lagi
            </Button>
          }
        />
      </div>
    );
  }

  if (!article) {
    return (
      <div className={container}>
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <p role="status" className="sr-only">
            Memuat artikel
          </p>
          <Skeleton width="30%" height="1rem" rounded="md" />
          <Skeleton width="100%" height="2.5rem" rounded="md" />
          <Skeleton width="100%" height="14rem" rounded="lg" />
          <Skeleton width="90%" height="1rem" rounded="md" />
          <Skeleton width="80%" height="1rem" rounded="md" />
        </div>
      </div>
    );
  }

  const related = query.data?.related ?? [];
  const categoryUrl = portfolioUrl(article.category.slug);

  return (
    <article className={container}>
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
          <p className="text-caption font-bold text-primary-600">{article.category.name}</p>
          <div>
            <p className="text-caption-sm text-content-secondary">
              {article.reading_minutes} menit baca
            </p>
            <h1 className="mt-1 text-h4 font-semibold text-content-primary lg:text-h2">
              {article.title}
            </h1>
          </div>
          <p className="text-body-sm text-content-secondary lg:text-body">{article.excerpt}</p>
          <p className="text-caption-sm text-content-secondary">
            <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          </p>
          <div className="flex items-center gap-2">
            <Avatar initials={article.author.name.slice(0, 2).toUpperCase()} alt="" />
            <span className="text-body-sm text-content-primary">{article.author.name}</span>
          </div>
        </header>

        {article.cover_url && (
          <figure className="space-y-2">
            {/* Rasio tetap agar tidak terjadi layout shift; gambar ini kandidat LCP. */}
            <img
              src={article.cover_url}
              alt=""
              decoding="async"
              fetchPriority="high"
              className="aspect-[328/202] h-auto w-full rounded-lg object-cover"
            />
            {article.source && (
              <figcaption className="text-caption-sm text-content-secondary">
                Sumber: {article.source}
              </figcaption>
            )}
          </figure>
        )}
        {!article.cover_url && article.source && (
          <p className="text-caption-sm text-content-secondary">Sumber: {article.source}</p>
        )}

        <div
          className="article-body"
          // HTML sudah disaring server dengan allowlist (App\Support\ArticleHtmlSanitizer) saat
          // disimpan, dan CSP melarang skrip sisipan sebagai lapisan kedua.
          dangerouslySetInnerHTML={{ __html: article.body_html }}
        />
      </div>

      {related.length > 0 && (
        <section
          className="mt-12 space-y-6 border-t border-stroke-primary pt-8 lg:mt-16"
          aria-labelledby="judul-terkait"
        >
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
              <li key={item.slug}>
                <ArticleCard article={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
