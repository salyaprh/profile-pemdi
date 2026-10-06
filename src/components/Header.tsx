import { useEffect, useState } from 'react';
import { IconMenu2, IconX } from '@tabler/icons-react';
import { navigationItems, siteName } from '../data/siteContent';
import { Link, paths, useLocation } from '../lib/router';
import SearchBar from './SearchBar';

const navLinkClass = (active: boolean) =>
  `inline-flex h-10 items-center rounded-lg px-3 text-caption font-medium transition-colors hover:bg-background-tertiary ${
    active ? 'font-semibold text-primary-600' : 'text-content-primary'
  }`;

/** Pola Header IDDS: logo di kiri, 3-5 menu utama, pencarian, sticky. */
export default function Header() {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stroke-primary bg-background-primary/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-6 px-5 lg:px-8">
        <Link to={paths.home} className="flex shrink-0 items-center gap-3 rounded" aria-label={`${siteName}, ke beranda`}>
          <img src="/panrb.svg" alt="" className="h-10 w-auto" />
          <span className="hidden border-l border-stroke-primary pl-3 text-caption font-bold leading-tight text-content-primary sm:block">
            PEMDI <span className="font-normal text-primary-600">PANRB</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {navigationItems.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} className={navLinkClass(active)}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden w-full max-w-[280px] md:block">
          <SearchBar />
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-content-primary hover:bg-background-tertiary md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="menu-mobile"
          aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
        >
          {isMenuOpen ? <IconX size={22} aria-hidden="true" /> : <IconMenu2 size={22} aria-hidden="true" />}
        </button>
      </div>

      {isMenuOpen && (
        <div id="menu-mobile" className="border-t border-stroke-primary bg-background-primary px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
            {navigationItems.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onNavigate={closeMenu}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-3 py-3 text-caption font-medium ${active ? 'bg-primary-50 font-semibold text-primary-700' : 'text-content-primary hover:bg-background-tertiary'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3">
            <SearchBar onSelect={closeMenu} />
          </div>
        </div>
      )}
    </header>
  );
}
