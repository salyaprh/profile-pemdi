import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { articles } from '../data/articlesData';
import { heroStats } from '../data/siteContent';
import Home from './Home';

describe('Home', () => {
  it('memiliki satu h1 sebagai judul halaman', () => {
    render(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Transformasi digital pemerintah untuk Indonesia yang lebih maju.',
    );
  });

  it('menyediakan CTA ke portofolio dan kontak sebagai tautan asli', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: /Lihat portofolio/ })).toHaveAttribute(
      'href',
      '/portfolio',
    );
    expect(screen.getByRole('link', { name: 'Hubungi TDP' })).toHaveAttribute('href', '/contact');
  });

  it('menampilkan seluruh statistik', () => {
    render(<Home />);
    for (const { value, label } of heroStats) {
      expect(screen.getByText(value)).toBeInTheDocument();
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('menampilkan 3 artikel terbaru pada bagian portofolio, masing-masing menaut ke detail', () => {
    render(<Home />);
    const section = screen.getByRole('region', { name: 'Portofolio Pemerintah Digital' });
    const links = within(section)
      .getAllByRole('link', { name: /.+/ })
      .filter((l) => l.getAttribute('href')?.startsWith('/portfolio/'));

    expect(links.map((l) => l.getAttribute('href'))).toEqual(
      articles.slice(0, 3).map((a) => `/portfolio/${a.id}`),
    );
  });

  it('menyediakan tombol "Lihat semua" ke daftar portofolio', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Lihat semua' })).toHaveAttribute('href', '/portfolio');
  });

  it('mengatur judul dan deskripsi dokumen', () => {
    render(<Home />);
    expect(document.title).toBe('Pemerintah Digital | PEMDI PANRB');
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
