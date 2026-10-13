import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { testArticles } from '../test/publicApi';
import { server } from '../test/server';
import { renderPublic, setUrl } from '../test/utils';
import Articles from './Articles';

// Data tiruan: 15 artikel terbit (5 per kategori), 12 per halaman.
const status = () => screen.getByRole('status');
const cardSlugs = () =>
  screen
    .getAllByRole('link')
    .map((link) => link.getAttribute('href') ?? '')
    .filter((href) => /^\/portfolio\/[^/?]+$/.test(href))
    .map((href) => href.split('/').pop());

async function openPortfolio(url: string) {
  setUrl(url);
  const user = userEvent.setup();
  renderPublic(<Articles />);
  await screen.findByText(/^Menampilkan|^Tidak ada artikel/);
  return user;
}

function recordRequests() {
  const requests: string[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname === '/api/articles') requests.push(url.search);
  });
  return requests;
}

describe('Articles (Portofolio)', () => {
  it('menampilkan 12 artikel pertama dari API secara default', async () => {
    await openPortfolio('/portfolio');
    expect(status()).toHaveTextContent('Menampilkan 1-12 dari 15 artikel');
    expect(cardSlugs()).toEqual(testArticles.slice(0, 12).map((a) => a.slug));
  });

  it('menampilkan kerangka kartu dengan status "Memuat" selama data diambil', () => {
    setUrl('/portfolio');
    renderPublic(<Articles />);
    expect(screen.getByRole('status')).toHaveTextContent('Memuat artikel');
  });

  it('memiliki satu h1 dan mengatur judul dokumen', async () => {
    await openPortfolio('/portfolio');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toBe('Portofolio | PEMDI PANRB');
  });

  describe('halaman (?halaman=)', () => {
    it('halaman 2 menampilkan sisa artikel dan dikirim sebagai ?page=2', async () => {
      const requests = recordRequests();
      await openPortfolio('/portfolio?halaman=2');
      expect(status()).toHaveTextContent('Menampilkan 13-15 dari 15 artikel');
      expect(cardSlugs()).toEqual(testArticles.slice(12).map((a) => a.slug));
      expect(requests).toContain('?page=2&per_page=12');
    });

    it.each(['abc', '0', '-3', '', 'NaN'])(
      'nilai tidak valid %j kembali ke halaman 1',
      async (value) => {
        await openPortfolio(`/portfolio?halaman=${value}`);
        expect(status()).toHaveTextContent('Menampilkan 1-12 dari 15 artikel');
      },
    );

    it('halaman di luar jangkauan: pesan dan tautan ke halaman pertama', async () => {
      await openPortfolio('/portfolio?halaman=99');
      expect(screen.getByText('Halaman ini kosong')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Ke halaman pertama' })).toHaveAttribute(
        'href',
        '/portfolio',
      );
    });

    it('klik nomor halaman memperbarui URL (Back dapat kembali)', async () => {
      const user = await openPortfolio('/portfolio');

      await user.click(screen.getByRole('link', { name: 'Halaman 2' }));

      expect(window.location.search).toBe('?halaman=2');
      expect(await screen.findByText('Menampilkan 13-15 dari 15 artikel')).toBeInTheDocument();
    });
  });

  describe('kategori (?kategori=slug)', () => {
    it('chip kategori berasal dari API; "Semua" aktif secara default', async () => {
      await openPortfolio('/portfolio');
      const group = await screen.findByRole('group', { name: 'Filter kategori' });
      expect(
        within(group)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Semua', 'Layanan Publik', 'Kebijakan & Regulasi', 'Panduan Pengguna']);
      expect(within(group).getByRole('button', { name: 'Semua' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('memfilter lewat slug dan menandai chip yang aktif', async () => {
      const requests = recordRequests();
      await openPortfolio('/portfolio?kategori=panduan-pengguna');

      expect(status()).toHaveTextContent('Menampilkan 1-5 dari 5 artikel');
      expect(requests).toContain('?kategori=panduan-pengguna&per_page=12');
      expect(await screen.findByRole('button', { name: 'Panduan Pengguna' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('klik chip kategori memperbarui URL dan mereset halaman ke 1', async () => {
      const user = await openPortfolio('/portfolio?halaman=2');

      await user.click(await screen.findByRole('button', { name: 'Kebijakan & Regulasi' }));

      expect(window.location.search).toBe('?kategori=kebijakan-regulasi');
      expect(await screen.findByText('Menampilkan 1-5 dari 5 artikel')).toBeInTheDocument();
    });

    it('memilih "Semua" menghapus ?kategori= dari URL', async () => {
      const user = await openPortfolio('/portfolio?kategori=layanan-publik');

      await user.click(await screen.findByRole('button', { name: 'Semua' }));

      expect(window.location.search).toBe('');
      expect(await screen.findByText('Menampilkan 1-12 dari 15 artikel')).toBeInTheDocument();
    });

    it('kategori tanpa artikel (atau tidak dikenal): pesan kosong dan tautan semua artikel', async () => {
      await openPortfolio('/portfolio?kategori=tidak-ada');
      expect(screen.getByText('Belum ada artikel di kategori ini')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tampilkan semua artikel' })).toHaveAttribute(
        'href',
        '/portfolio',
      );
    });
  });

  describe('paginasi', () => {
    it('ditampilkan sebagai navigasi berisi tautan yang mempertahankan filter', async () => {
      await openPortfolio('/portfolio');
      const nav = screen.getByRole('navigation', { name: 'Paginasi' });

      expect(within(nav).getByText('Halaman 1 dari 2')).toBeInTheDocument();
      expect(within(nav).getByRole('link', { name: 'Halaman 2' })).toHaveAttribute(
        'href',
        '/portfolio?halaman=2',
      );
      expect(within(nav).getByRole('link', { name: 'Halaman 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  });

  it('gagal memuat: pesan galat dan tombol coba lagi', async () => {
    server.use(http.get('/api/articles', () => HttpResponse.json({}, { status: 503 })));
    setUrl('/portfolio');
    renderPublic(<Articles />);

    expect(await screen.findByText('Artikel gagal dimuat')).toBeInTheDocument();
    expect(
      screen.getByText('Terjadi kesalahan di server. Coba lagi beberapa saat lagi.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });
});
