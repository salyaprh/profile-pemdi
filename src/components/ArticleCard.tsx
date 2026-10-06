import { Card } from '@idds/react';
import type { Article } from '../data/articlesData';
import { Link, paths } from '../lib/router';

/**
 * Kartu artikel (pola Blog Section IDDS). Dibungkus <Link> agar berupa
 * tautan asli yang dapat difokus keyboard; ukuran kartu seragam.
 */
export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to={paths.article(article.id)}
      className="block h-full rounded-xl [&_.ina-card]:h-full [&_.ina-card]:w-full"
    >
      <Card
        variant="basic"
        mediaPosition="top"
        // Card IDDS sudah membungkus title dalam <h3> dan description dalam <p>.
        title={
          <span className="line-clamp-2 text-body-sm font-semibold text-content-primary">
            {article.title}
          </span>
        }
        description={
          <span className="line-clamp-2 text-caption text-content-secondary">
            {article.excerpt}
          </span>
        }
        mediaSrc={article.mediaSrc}
        mediaAlt=""
        hoverable
        clickable
        className="h-full w-full"
      />
    </Link>
  );
}
