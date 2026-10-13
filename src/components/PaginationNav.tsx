import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Link } from '../lib/router';

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  /** URL halaman tujuan; tiap halaman berupa tautan sungguhan (dapat dirayapi dan dibuka di tab baru). */
  hrefFor: (page: number) => string;
}

type Item = number | 'gap-start' | 'gap-end';

/** Daftar nomor halaman: semua bila <=7, selain itu jendela di sekitar halaman aktif dengan elipsis. */
export function getPageItems(currentPage: number, totalPages: number): Item[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const items: Item[] = [1];
  const start = Math.max(2, Math.min(currentPage - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(currentPage + 1, 5));
  if (start > 2) items.push('gap-start');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push('gap-end');
  items.push(totalPages);
  return items;
}

const baseClass =
  'inline-flex size-10 items-center justify-center rounded-lg border text-caption font-medium transition-colors';
const idleClass =
  'border-stroke-primary bg-background-primary text-content-primary hover:bg-background-tertiary';
const currentClass = 'border-primary-600 bg-primary-50 font-semibold text-primary-700';
const disabledClass = 'border-stroke-primary bg-background-secondary text-content-tertiary';

/**
 * Navigasi halaman berbasis tautan, bergaya token IDDS. Dibuat sendiri karena komponen Pagination
 * IDDS memuat tombol ikon tanpa nama dan <select> tanpa nama (axe: button-name, select-name),
 * serta memakai tombol sehingga halaman lanjutan tidak dapat dirayapi.
 */
export default function PaginationNav({ currentPage, totalPages, hrefFor }: PaginationNavProps) {
  if (totalPages <= 1) return null;

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Paginasi"
      className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p className="text-caption text-content-secondary">
        Halaman {currentPage} dari {totalPages}
      </p>
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {hasPrevious ? (
            <Link
              to={hrefFor(currentPage - 1)}
              aria-label="Halaman sebelumnya"
              className={`${baseClass} ${idleClass}`}
            >
              <IconChevronLeft size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span aria-hidden="true" className={`${baseClass} ${disabledClass}`}>
              <IconChevronLeft size={18} />
            </span>
          )}
        </li>

        {getPageItems(currentPage, totalPages).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Link
                to={hrefFor(item)}
                aria-label={`Halaman ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
                className={`${baseClass} ${item === currentPage ? currentClass : idleClass}`}
              >
                {item}
              </Link>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-content-secondary">
              &hellip;
            </li>
          ),
        )}

        <li>
          {hasNext ? (
            <Link
              to={hrefFor(currentPage + 1)}
              aria-label="Halaman berikutnya"
              className={`${baseClass} ${idleClass}`}
            >
              <IconChevronRight size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span aria-hidden="true" className={`${baseClass} ${disabledClass}`}>
              <IconChevronRight size={18} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
