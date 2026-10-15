import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { footerNavigation } from '../data/siteContent';
import { testCategories, testSite } from '../test/publicApi';
import { server } from '../test/server';
import { renderPublic as render } from '../test/utils';
import Footer from './Footer';

// Setiap kolom dirender dua kali (kolom desktop + accordion mobile); cukup periksa yang pertama.
const column = (name: string) => screen.getAllByRole('navigation', { name })[0];

describe('Footer', () => {
  it('menampilkan logo yang menaut ke beranda', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'PEMDI PANRB, ke beranda' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('memuat kolom Navigasi dengan semua menu utama', () => {
    render(<Footer />);
    for (const link of footerNavigation) {
      expect(within(column('Navigasi')).getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.to,
      );
    }
  });

  it('kolom Kategori portofolio diambil dari API dan menaut ke filter slug', async () => {
    render(<Footer />);
    for (const category of testCategories) {
      expect(
        await within(column('Kategori portofolio')).findByRole('link', { name: category.name }),
      ).toHaveAttribute('href', `/portfolio?kategori=${category.slug}`);
    }
  });

  it('bila kategori gagal dimuat, kolomnya tetap berisi tautan ke semua portofolio', async () => {
    let failed = false;
    server.use(
      http.get('/api/categories', () => {
        failed = true;
        return HttpResponse.json({}, { status: 500 });
      }),
    );
    render(<Footer />);
    expect(
      within(column('Kategori portofolio')).getByRole('link', { name: 'Semua portofolio' }),
    ).toHaveAttribute('href', '/portfolio');
    // Tetap begitu setelah permintaan gagal (tanpa pesan galat di footer).
    await waitFor(() => expect(failed).toBe(true));
    expect(
      within(column('Kategori portofolio')).getByRole('link', { name: 'Semua portofolio' }),
    ).toBeInTheDocument();
  });

  it('deskripsi, kontak, dan media sosial berasal dari pengaturan situs', async () => {
    render(<Footer />);

    expect(await screen.findByText(testSite.description)).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'humas@panrb.example.go.id' })).toHaveAttribute(
      'href',
      'mailto:humas%40panrb.example.go.id',
    );
    expect(within(footer).getByRole('link', { name: '(021) 555-1234' })).toHaveAttribute(
      'href',
      'tel:0215551234',
    );
    expect(within(footer).getByText('Jakarta')).toBeInTheDocument();
    const instagram = within(footer).getByRole('link', {
      name: 'Instagram PEMDI PANRB (membuka tab baru)',
    });
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/panrb');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(instagram).toHaveAttribute('target', '_blank');
    // Yang dikosongkan Admin tidak ditampilkan.
    expect(within(footer).queryByRole('link', { name: /Facebook/ })).not.toBeInTheDocument();
    expect(within(footer).queryByRole('link', { name: /^X / })).not.toBeInTheDocument();
  });

  it('pengaturan gagal dimuat: deskripsi bawaan tetap tampil tanpa kontak dan media sosial', async () => {
    server.use(http.get('/api/site', () => HttpResponse.json({}, { status: 500 })));
    render(<Footer />);

    expect(await screen.findByText(/PEMDI merangkum karya dan inisiatif TDP/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /membuka tab baru/ })).not.toBeInTheDocument();
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
