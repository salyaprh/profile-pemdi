import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { isCategoryFilter } from '../data/articlesData';
import { footerColumns } from '../data/siteContent';
import Footer from './Footer';

describe('Footer', () => {
  it('menampilkan logo yang menaut ke beranda', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'PEMDI PANRB, ke beranda' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('memuat kolom Navigasi dan Kategori portofolio dengan semua tautannya', () => {
    render(<Footer />);

    for (const column of footerColumns) {
      // Setiap kolom dirender dua kali (kolom desktop + accordion mobile).
      const navs = screen.getAllByRole('navigation', { name: column.title });
      expect(navs.length).toBeGreaterThanOrEqual(1);
      for (const link of column.links) {
        const found = within(navs[0]).getByRole('link', { name: link.label });
        expect(found).toHaveAttribute('href', link.to);
      }
    }
  });

  it('semua tautan kategori mengarah ke filter yang valid di halaman portofolio', () => {
    const categoryColumn = footerColumns.find((c) => c.title === 'Kategori portofolio');
    expect(categoryColumn?.links).toHaveLength(3);

    for (const link of categoryColumn?.links ?? []) {
      const url = new URL(link.to, 'http://x');
      expect(url.pathname).toBe('/portfolio');
      expect(isCategoryFilter(url.searchParams.get('kategori'))).toBe(true);
    }
  });

  it('menampilkan hak cipta dengan tahun berjalan', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2031-06-15T00:00:00Z'));
    try {
      render(<Footer />);
      expect(screen.getByText(/© 2031 PEMDI PANRB/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('tidak memuat CTA utama sesuai pedoman IDDS (hanya tautan navigasi)', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).queryByRole('button', { name: /kirim|mulai|daftar/i })).toBeNull();
  });
});
