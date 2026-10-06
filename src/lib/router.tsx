import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from 'react';

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
} as const;

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
}

export function navigate(
  to: string,
  { replace = false, scroll = true }: NavigateOptions = {},
) {
  const current = window.location.pathname + window.location.search;
  if (to !== current) {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', to);
    window.dispatchEvent(new Event(NAVIGATE_EVENT));
  }
  // 'instant' menimpa scroll-behavior: smooth dari CSS global IDDS.
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

export function useLocation() {
  const url = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => {
    const queryStart = url.indexOf('?');
    const pathname = normalizePathname(
      queryStart === -1 ? url : url.slice(0, queryStart),
    );
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
    navigate(to);
    onNavigate?.();
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

/** Mengatur <title> dokumen sesuai halaman aktif. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | PEMDI PANRB`;
  }, [title]);
}
