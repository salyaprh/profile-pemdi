import { useMemo, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

/**
 * Router minimal berbasis History API (tanpa dependency tambahan).
 * Semua tautan internal memakai <Link> agar tetap berupa <a href> asli:
 * bisa dibuka di tab baru, dapat difokus keyboard, dan terbaca pembaca layar.
 */

export const paths = {
  home: '/',
  portfolio: '/portfolio',
  article: (id: string) => `/portfolio/${encodeURIComponent(id)}`,
  contact: '/contact',
  admin: '/admin',
  adminLogin: '/admin/masuk',
  adminArticles: '/admin/artikel',
  adminArticleNew: '/admin/artikel/baru',
  adminArticle: (id: number) => `/admin/artikel/${id}`,
  adminCategories: '/admin/kategori',
} as const;

/** Semua path di bawah /admin milik panel CMS (dimuat terpisah, tanpa header/footer situs). */
export function isAdminPath(pathname: string): boolean {
  return pathname === paths.admin || pathname.startsWith(`${paths.admin}/`);
}

const NAVIGATE_EVENT = 'app:navigate';

function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener(NAVIGATE_EVENT, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(NAVIGATE_EVENT, listener);
  };
}

const getSnapshot = () => window.location.pathname + window.location.search;
const getServerSnapshot = () => '/';

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

interface NavigateOptions {
  replace?: boolean;
  /** Gulir ke atas setelah berpindah (default: true). */
  scroll?: boolean;
  /** Abaikan penahan navigasi (mis. sesi berakhir, sehingga halaman Masuk wajib tampil). */
  force?: boolean;
}

/**
 * Penahan navigasi aktif (mis. formulir yang belum disimpan). Mengembalikan `true` bila navigasi
 * boleh dilanjutkan. Hanya menahan navigasi di dalam aplikasi; muat ulang/tutup tab ditangani
 * `beforeunload`, dan tombol Back browser tidak dapat ditahan.
 */
let navigationBlocker: (() => boolean) | null = null;

export function setNavigationBlocker(blocker: () => boolean): () => void {
  navigationBlocker = blocker;
  return () => {
    if (navigationBlocker === blocker) navigationBlocker = null;
  };
}

/** Berpindah halaman. Mengembalikan `false` bila dibatalkan penahan navigasi. */
export function navigate(
  to: string,
  { replace = false, scroll = true, force = false }: NavigateOptions = {},
): boolean {
  const current = window.location.pathname + window.location.search;
  if (to !== current) {
    if (!force && navigationBlocker && !navigationBlocker()) return false;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', to);
    window.dispatchEvent(new Event(NAVIGATE_EVENT));
  }
  // 'instant' menimpa scroll-behavior: smooth dari CSS global IDDS.
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  return true;
}

export function useLocation() {
  const url = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => {
    const queryStart = url.indexOf('?');
    const pathname = normalizePathname(queryStart === -1 ? url : url.slice(0, queryStart));
    const search = queryStart === -1 ? '' : url.slice(queryStart);
    return { pathname, search, searchParams: new URLSearchParams(search) };
  }, [url]);
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  /** Dipanggil setelah navigasi internal terjadi (mis. menutup menu mobile). */
  onNavigate?: () => void;
}

export function Link({ to, onClick, onNavigate, children, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    const opensElsewhere =
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === '_blank';
    if (event.defaultPrevented || opensElsewhere) return;

    event.preventDefault();
    if (navigate(to)) onNavigate?.();
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
