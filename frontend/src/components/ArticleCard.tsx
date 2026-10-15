import { Skeleton } from '@idds/react';
import { Link, paths } from '../lib/router';
import type { ArticleSummary } from '../services/content';

/** Dipakai bila artikel belum diberi gambar sampul: logo PANRB di bidang netral. */
export const FALLBACK_COVER = '/images/articles/sampul-bawaan.svg';

/**
 * Kartu artikel (pola Blog Section IDDS). Dibungkus <Link> agar berupa tautan asli yang dapat
 * difokus keyboard; ukuran kartu seragam.
 *
 * Markup Card IDDS ditulis langsung dengan kelas CSS-nya (ina-card): komponen Card mengganti
 * `mediaAlt=""` menjadi alt "Card media", sehingga pembaca layar membacakan "Card media" di awal
 * setiap tautan kartu. Gambar sampul di sini dekoratif (judul sudah menjadi nama tautan).
 */
export default function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      to={paths.article(article.slug)}
      className="block h-full rounded-xl [&_.ina-card]:h-full [&_.ina-card]:w-full [&_img]:aspect-[328/202] [&_img]:object-cover"
    >
      <div className="ina-card ina-card--variant-basic ina-card--media-top ina-card--hoverable ina-card--clickable ina-card--with-header">
        <div className="ina-card__media">
          <img src={article.cover_url ?? FALLBACK_COVER} alt="" loading="lazy" decoding="async" />
        </div>
        <div className="ina-card__content">
          <div>
            <h3 className="ina-card__title">
              <span className="line-clamp-2 text-body-sm font-semibold text-content-primary">
                {article.title}
              </span>
            </h3>
            <p className="ina-card__description">
              <span className="line-clamp-2 text-caption text-content-secondary">
                {article.excerpt}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Kerangka kartu selama daftar artikel dimuat. */
export function ArticleCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-stroke-primary p-4">
      <Skeleton width="100%" height="9rem" rounded="md" />
      <Skeleton width="85%" height="1.25rem" rounded="md" />
      <Skeleton width="60%" height="1rem" rounded="md" />
    </div>
  );
}

/** Daftar kartu kerangka dengan status "Memuat" yang terbaca pembaca layar. */
export function ArticleGridSkeleton({ count }: { count: number }) {
  return (
    <>
      <p role="status" className="sr-only">
        Memuat artikel
      </p>
      <ul
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <ArticleCardSkeleton />
          </li>
        ))}
      </ul>
    </>
  );
}
