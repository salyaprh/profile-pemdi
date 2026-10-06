import { useState } from 'react';
import { IconMenu2, IconSearch, IconX } from '@tabler/icons-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigationItems = [
    { id: 'dashboard', label: 'Beranda' },
    { id: 'articles', label: 'Portofolio' },
    { id: 'form', label: 'Hubungi Kami' },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchInput = (
    <label className="relative block">
      <span className="sr-only">Cari proyek atau informasi</span>
      <IconSearch size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0968F6]" />
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Cari proyek atau informasi"
        className="h-10 w-full rounded-lg border border-[#84B4FB] bg-[#EDF8FF] pl-10 pr-3 text-sm text-[#002A69] outline-none transition focus:border-[#0968F6] focus:ring-2 focus:ring-[#0968F6]/15"
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-[#EDF8FF] text-[#002A69]">
      <header className="sticky top-0 z-50 border-b border-[#D4E5FE] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-8 px-5 lg:px-8">
          <button type="button" onClick={() => handleNavigate('dashboard')} className="flex shrink-0 items-center gap-3 text-left" aria-label="Ke beranda PEMDI">
            <img src="/panrb.svg" alt="PANRB" className="h-11 w-auto" />
            <span className="hidden border-l border-[#84B4FB] pl-3 text-[15px] font-bold leading-tight text-[#002A69] sm:block">PEMDI <span className="font-normal text-[#0968F6]">PANRB</span></span>
          </button>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
            {navigationItems.map((item) => (
              <button key={item.id} type="button" onClick={() => handleNavigate(item.id)} className={`relative py-7 text-sm font-semibold transition-colors ${currentPage === item.id ? 'text-[#0968F6] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#0968F6]' : 'text-[#002A69] hover:text-[#0968F6]'}`}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden w-full max-w-[250px] sm:block">{searchInput}</div>
          <button type="button" className="rounded-lg p-2 text-[#002A69] md:hidden" onClick={() => setIsMenuOpen((open) => !open)} aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}>
            {isMenuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-[#D4E5FE] bg-white px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
              {navigationItems.map((item) => (
                <button key={item.id} type="button" onClick={() => handleNavigate(item.id)} className={`rounded-lg px-3 py-3 text-left text-sm font-semibold ${currentPage === item.id ? 'bg-[#D4E5FE] text-[#0049B8]' : 'text-[#002A69]'}`}>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-3 sm:hidden">{searchInput}</div>
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
