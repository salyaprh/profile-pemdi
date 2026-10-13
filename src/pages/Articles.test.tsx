import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { articles } from '../data/articlesData';
import { setUrl } from '../test/utils';
import Articles from './Articles';

const status = () => screen.getByRole('status');
const cardLinks = () =>
  screen
    .getAllByRole('link')
    .filter((link) => /^\/portfolio\/[^/]+$/.test(link.getAttribute('href') ?? ''));
const ids = () => cardLinks().map((l) => l.getAttribute('href')?.split('/').pop());

describe('Articles (Portofolio)', () => {
  it('menampilkan 12 artikel pertama dari 36 secara default', () => {
    render(<Articles />);
    expect(status()).toHaveTextContent('Menampilkan 1-12 dari 36 artikel');
    expect(ids()).toEqual(articles.slice(0, 12).map((a) => a.id));
  });

  it('setiap kartu adalah tautan asli ke halaman detail', () => {
    render(<Articles />);
    for (const link of cardLinks()) {
      expect(link.getAttribute('href')).toMatch(/^\/portfolio\/\d+$/);
    }
  });

  it('memiliki satu h1 dan mengatur judul dokumen', () => {
    render(<Articles />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toBe('Portofolio | PEMDI PANRB');
  });

  describe('halaman (?halaman=)', () => {
    it.each([
      [2, 13, 24],
      [3, 25, 36],
    ])('halaman %i menampilkan artikel %i-%i', (page, from, to) => {
      setUrl(`/portfolio?halaman=${page}`);
      render(<Articles />);
      expect(status()).toHaveTextContent(`Menampilkan ${from}-${to} dari 36 artikel`);
      expect(ids()).toEqual(articles.slice(from - 1, to).map((a) => a.id));
    });

    it.each(['abc', '0', '-3', '', '1.5', 'NaN'])(
      'nilai tidak valid %j kembali ke halaman 1',
      (value) => {
        setUrl(`/portfolio?halaman=${value}`);
        render(<Articles />);
        expect(status()).toHaveTextContent('Menampilkan 1-12 dari 36 artikel');
      },
    );

    it('halaman di luar jangkauan dibatasi ke halaman terakhir', () => {
      setUrl('/portfolio?halaman=99');
      render(<Articles />);
      expect(status()).toHaveTextContent('Menampilkan 25-36 dari 36 artikel');
    });

    it('klik nomor halaman memperbarui URL (Back dapat kembali)', async () => {
      const user = userEvent.setup();
      render(<Articles />);

      await user.click(screen.getByRole('link', { name: 'Halaman 2' }));

      expect(window.location.search).toBe('?halaman=2');
      expect(status()).toHaveTextContent('Menampilkan 13-24 dari 36 artikel');
    });

    it('halaman 1 tidak menulis ?halaman= ke URL', async () => {
      setUrl('/portfolio?halaman=2');
      const user = userEvent.setup();
      render(<Articles />);

      await user.click(screen.getByRole('link', { name: 'Halaman 1' }));

      expect(window.location.search).toBe('');
    });
  });

  describe('kategori (?kategori=)', () => {
    it.each(['Layanan Publik', 'Kebijakan & Regulasi', 'Panduan Pengguna'] as const)(
      'memfilter artikel kategori %s',
      (category) => {
        setUrl(`/portfolio?kategori=${encodeURIComponent(category)}`);
        render(<Articles />);

        const expected = articles.filter((a) => a.category === category);
        const shown = Math.min(12, expected.length);
        expect(status()).toHaveTextContent(
          `Menampilkan 1-${shown} dari ${expected.length} artikel`,
        );
        expect(ids()).toEqual(expected.slice(0, shown).map((a) => a.id));
      },
    );

    it('kategori tidak dikenal diperlakukan sebagai "Semua"', () => {
      setUrl('/portfolio?kategori=Tidak+Ada');
      render(<Articles />);
      expect(status()).toHaveTextContent('Menampilkan 1-12 dari 36 artikel');
    });

    it('klik chip kategori memperbarui URL dan mereset halaman ke 1', async () => {
      setUrl('/portfolio?halaman=3');
      const user = userEvent.setup();
      render(<Articles />);

      await user.click(screen.getByRole('button', { name: 'Panduan Pengguna' }));

      expect(window.location.search).toBe('?kategori=Panduan+Pengguna');
      const expected = articles.filter((a) => a.category === 'Panduan Pengguna');
      expect(status()).toHaveTextContent(`dari ${expected.length} artikel`);
      expect(status()).toHaveTextContent('Menampilkan 1-');
    });

    it('memilih "Semua" menghapus ?kategori= dari URL', async () => {
      setUrl('/portfolio?kategori=Layanan+Publik');
      const user = userEvent.setup();
      render(<Articles />);

      await user.click(screen.getByRole('button', { name: 'Semua' }));

      expect(window.location.search).toBe('');
      expect(status()).toHaveTextContent('dari 36 artikel');
    });

    it('filter dan halaman dapat digabung', () => {
      setUrl('/portfolio?kategori=Layanan+Publik&halaman=2');
      render(<Articles />);

      const expected = articles.filter((a) => a.category === 'Layanan Publik');
      expect(expected.length).toBeGreaterThan(12);
      expect(ids()).toEqual(expected.slice(12, 24).map((a) => a.id));
    });
  });

  describe('paginasi', () => {
    it('ditampilkan sebagai navigasi berisi tautan bila lebih dari satu halaman', () => {
      render(<Articles />);
      const nav = screen.getByRole('navigation', { name: 'Paginasi' });

      expect(within(nav).getByText('Halaman 1 dari 3')).toBeInTheDocument();
      for (const page of [1, 2, 3]) {
        expect(within(nav).getByRole('link', { name: `Halaman ${page}` })).toHaveAttribute(
          'href',
          page === 1 ? '/portfolio' : `/portfolio?halaman=${page}`,
        );
      }
      expect(within(nav).getByRole('link', { name: 'Halaman 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('tautan halaman mempertahankan filter kategori', () => {
      setUrl('/portfolio?kategori=Layanan+Publik');
      render(<Articles />);
      const nav = screen.getByRole('navigation', { name: 'Paginasi' });
      expect(within(nav).getByRole('link', { name: 'Halaman 2' })).toHaveAttribute(
        'href',
        '/portfolio?kategori=Layanan+Publik&halaman=2',
      );
    });

    it('tidak ada kontrol bernama kosong: tombol ikon tanpa nama dan <select> sudah tidak ada', () => {
      const { container } = render(<Articles />);
      expect(container.querySelector('select')).toBeNull();
      expect(screen.queryByText('Baris per halaman')).not.toBeInTheDocument();
    });
  });
});
