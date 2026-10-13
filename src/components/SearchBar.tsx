import {
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { TextField } from '@idds/react';
import { IconSearch } from '@tabler/icons-react';
import { searchArticles } from '../data/articlesData';
import { Link, navigate, paths } from '../lib/router';

interface SearchBarProps {
  className?: string;
  /** Dipanggil setelah pengguna memilih hasil (mis. menutup menu mobile). */
  onSelect?: () => void;
}

/**
 * Pencarian artikel: TextField IDDS + panel hasil berisi tautan (pola Searchbar IDDS).
 *
 * Panel dibuat sendiri, bukan BasicDropdown IDDS: pembungkus <div role="button"> milik
 * BasicDropdown berisi kontrol interaktif (kolom input dan tombol hapus), yang melanggar
 * WCAG 4.1.2 (axe: nested-interactive) di setiap halaman. Hasil kosong selalu disertai pesan.
 *
 * Keyboard: Enter membuka hasil pertama, Tab masuk ke daftar hasil, Escape menutup panel.
 */
export default function SearchBar({ className = '', onSelect }: SearchBarProps) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchArticles(query), [query]);
  const hasQuery = query.trim().length > 0;
  const panelOpen = open && hasQuery;

  const close = () => {
    setOpen(false);
    setQuery('');
    onSelect?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && panelOpen) {
      // Escape pertama hanya menutup panel hasil. stopPropagation mencegah Header ikut menutup
      // seluruh menu mobile; Escape berikutnya (panel sudah tertutup) baru menutup menu.
      event.stopPropagation();
      setOpen(false);
      containerRef.current?.querySelector('input')?.focus();
    } else if (
      event.key === 'Enter' &&
      event.target instanceof HTMLInputElement &&
      results.length > 0
    ) {
      event.preventDefault();
      navigate(paths.article(results[0].id));
      close();
    }
  };

  // Panel menutup saat fokus keluar dari seluruh komponen (mis. Tab ke elemen lain).
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(event.relatedTarget)) setOpen(false);
  };

  // Mencegah input kehilangan fokus saat panel diklik/disentuh (Safari iOS tidak memfokuskan
  // tautan), sehingga panel tidak tertutup sebelum klik terdaftar.
  const keepFocus = (event: MouseEvent<HTMLDivElement>) => event.preventDefault();

  return (
    // Delegasi event: keydown/blur dari input dan tautan hasil ditangani di sini; wadah bukan kontrol.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <TextField
        id={inputId}
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Cari artikel portofolio"
        aria-label="Cari artikel portofolio"
        // type="text": tombol "×" sudah disediakan TextField IDDS (hindari ganda dengan bawaan browser).
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        prefixIcon={<IconSearch size={16} aria-hidden="true" />}
        className="w-full"
      />

      {panelOpen && (
        // Hanya mencegah input kehilangan fokus saat panel disentuh; panel bukan kontrol.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          onMouseDown={keepFocus}
          className="absolute right-0 top-full z-50 mt-1 flex max-h-72 w-[320px] max-w-[calc(100vw-2.5rem)] flex-col gap-1 overflow-y-auto rounded-lg border border-stroke-primary bg-background-primary p-2 shadow-lg"
        >
          <p className="px-2 pt-1 text-caption-sm text-content-secondary" role="status">
            {results.length > 0 ? `${results.length} hasil pencarian` : 'Hasil pencarian'}
          </p>
          {results.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {results.map((article) => (
                <li key={article.id}>
                  <Link
                    to={paths.article(article.id)}
                    onNavigate={close}
                    className="block rounded-lg px-2 py-2 hover:bg-background-tertiary"
                  >
                    <span className="line-clamp-2 block text-caption font-medium text-content-primary">
                      {article.title}
                    </span>
                    <span className="text-caption-sm text-content-secondary">
                      {article.category}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-3 text-caption text-content-secondary">
              Tidak ada hasil untuk &ldquo;{query.trim()}&rdquo;. Coba kata kunci lain.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
