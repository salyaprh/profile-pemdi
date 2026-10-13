import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFound from './NotFound';

describe('NotFound', () => {
  it('memakai judul dan penjelasan default yang jelas dan sopan', () => {
    render(<NotFound />);
    expect(
      screen.getByRole('heading', { level: 1, name: '404: Halaman tidak ditemukan' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/halaman yang Anda cari tidak tersedia/i)).toBeInTheDocument();
  });

  it('menyediakan CTA kembali ke beranda', () => {
    render(<NotFound />);
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/');
  });

  it('dapat memakai judul dan deskripsi khusus', () => {
    render(<NotFound title="Artikel tidak ditemukan" description="Sudah dihapus." />);
    expect(screen.getByRole('heading', { name: 'Artikel tidak ditemukan' })).toBeInTheDocument();
    expect(screen.getByText('Sudah dihapus.')).toBeInTheDocument();
  });

  it('menandai halaman noindex dan memberi judul dokumen', () => {
    render(<NotFound />);
    expect(document.title).toBe('Halaman tidak ditemukan | PEMDI PANRB');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
  });
});
