import { useMemo, useState, type KeyboardEvent } from 'react';
import { BasicDropdown, TextField } from '@idds/react';
import { IconSearch } from '@tabler/icons-react';
import { searchArticles } from '../data/articlesData';
import { Link, navigate, paths } from '../lib/router';

interface SearchBarProps {
  className?: string;
  /** Dipanggil setelah pengguna memilih hasil (mis. menutup menu mobile). */
  onSelect?: () => void;
}

/**
 * Pola Searchbar IDDS: TextField + BasicDropdown berisi hasil pencarian.
 * Hasil kosong selalu disertai pesan.
 */
export default function SearchBar({ className, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchArticles(query), [query]);
  const hasQuery = query.trim().length > 0;

  const close = () => {
    setOpen(false);
    setQuery('');
    onSelect?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault();
      navigate(paths.article(results[0].id));
      close();
    }
  };

  return (
    <BasicDropdown
      className={className}
      open={open && hasQuery}
      onOpenChange={setOpen}
      placement="bottom-end"
      panelClassName="w-[320px] max-w-[calc(100vw-2.5rem)]"
      trigger={
        <TextField
          value={query}
          onChange={(value) => {
            setQuery(value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
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
      }
      content={
        <div className="flex max-h-72 w-full flex-col gap-1 overflow-y-auto p-2">
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
                    <span className="line-clamp-2 block text-caption font-medium text-content-primary">{article.title}</span>
                    <span className="text-caption-sm text-content-secondary">{article.category}</span>
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
      }
    />
  );
}
