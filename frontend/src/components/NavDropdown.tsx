import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { Link } from '../lib/router';

export interface SubmenuLink {
  label: string;
  to: string;
  /** Tautan untuk halaman yang sedang dibuka (aria-current="page"). */
  current: boolean;
}

interface NavDropdownProps {
  label: string;
  /** Salah satu submenu sedang dibuka: tombol induk ditandai aktif. */
  active: boolean;
  links: SubmenuLink[];
  className: string;
}

/**
 * Menu header dengan submenu, mengikuti pola disclosure navigation WAI-ARIA (tombol + daftar
 * tautan, bukan role="menu"). IDDS tidak punya komponen ini, dan BasicDropdown-nya melanggar WCAG.
 * Dibuka dengan klik/Enter/Spasi atau hover mouse; ditutup dengan Escape, klik di luar, fokus
 * berpindah keluar, atau setelah memilih tautan.
 */
export default function NavDropdown({ label, active, links, className }: NavDropdownProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Klik setelah hover membuka panel tidak boleh langsung menutupnya lagi.
  const openedByHover = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePointer = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      if (rootRef.current?.contains(document.activeElement)) buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || isOpen) return;
    openedByHover.current = true;
    setIsOpen(true);
  };

  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    openedByHover.current = false;
    setIsOpen(false);
  };

  const close = () => setIsOpen(false);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onBlur={(event) => {
        // Hanya saat fokus pindah ke elemen lain (Tab). relatedTarget kosong juga terjadi saat
        // mengklik tautan di panel (Safari tidak memfokuskan tautan), dan klik di luar sudah
        // ditangani pointerdown; menutup di sini akan melepas tautan sebelum kliknya diproses.
        const next = event.relatedTarget;
        if (next && !event.currentTarget.contains(next)) close();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-current={active ? 'true' : undefined}
        className={`${className} gap-1`}
        onClick={() => {
          if (openedByHover.current) openedByHover.current = false;
          else setIsOpen((open) => !open);
        }}
      >
        {label}
        <IconChevronDown
          size={16}
          aria-hidden="true"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        // Gaya panel dan item mengikuti menu ActionDropdown IDDS (.ina-action-dropdown__menu/__item).
        // pt-2 (bukan margin) agar kursor tidak keluar dari area hover saat turun ke panel.
        <div id={panelId} className="absolute left-0 top-full z-50 min-w-[200px] pt-2">
          <ul className="rounded-lg border border-stroke-primary bg-background-primary p-0.5 shadow-lg">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onNavigate={close}
                  aria-current={link.current ? 'page' : undefined}
                  className={`block rounded-md px-4 py-2 text-caption transition-colors hover:bg-background-secondary ${
                    link.current ? 'font-semibold text-primary-600' : 'text-content-primary'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
