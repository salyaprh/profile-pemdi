import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { testArticles, testSite } from '../test/publicApi';
import { server } from '../test/server';
import { renderPublic } from '../test/utils';
import Home from './Home';

const portfolioSection = () =>
  screen.getByRole('region', { name: 'Portofolio Pemerintah Digital' });

describe('Home', () => {
  it('memiliki satu h1 sebagai judul halaman', () => {
    renderPublic(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Transformasi digital pemerintah untuk Indonesia yang lebih maju.',
    );
  });

  it('menyediakan CTA ke portofolio dan kontak sebagai tautan asli', () => {
    renderPublic(<Home />);
    expect(screen.getByRole('link', { name: /Lihat portofolio/ })).toHaveAttribute(
      'href',
      '/portfolio',
    );
    expect(screen.getByRole('link', { name: 'Hubungi TDP' })).toHaveAttribute('href', '/contact');
  });

  it('menampilkan tiga angka dari pengaturan situs, dengan kerangka selama memuat', async () => {
    renderPublic(<Home />);
    expect(screen.queryByText(testSite.hero_stats[0].label)).not.toBeInTheDocument();

    for (const { value, label } of testSite.hero_stats) {
      expect(await screen.findByText(value)).toBeInTheDocument();
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('bagian angka tidak tampil bila pengaturan gagal dimuat (bukan angka tebakan)', async () => {
    let failed = false;
    server.use(
      http.get('/api/site', () => {
        failed = true;
        return HttpResponse.json({}, { status: 500 });
      }),
    );
    renderPublic(<Home />);

    await waitFor(() => expect(failed).toBe(true));
    await screen.findByRole('link', { name: /Lihat portofolio/ });
    expect(screen.queryByText(testSite.hero_stats[0].value)).not.toBeInTheDocument();
  });

  it('meminta 3 artikel terbit terbaru dari API dan menautkan masing-masing ke detail', async () => {
    const requests: string[] = [];
    server.events.on('request:start', ({ request }) => requests.push(request.url));
    renderPublic(<Home />);

    // Kerangka kartu tampil selama memuat, dengan status yang terbaca pembaca layar.
    expect(within(portfolioSection()).getByRole('status')).toHaveTextContent('Memuat artikel');

    await within(portfolioSection()).findByRole('link', {
      name: (name) => name.startsWith(testArticles[0].title),
    });
    expect(
      within(portfolioSection())
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
        .filter((href) => href?.startsWith('/portfolio/')),
    ).toEqual(testArticles.slice(0, 3).map((article) => `/portfolio/${article.slug}`));
    expect(requests.some((url) => url.endsWith('/api/articles?per_page=3'))).toBe(true);
  });

  it('artikel gagal dimuat: pesan dan tombol coba lagi yang memuat ulang', async () => {
    let calls = 0;
    server.use(
      http.get('/api/articles', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json({
              data: [],
              meta: { current_page: 1, last_page: 1, per_page: 3, total: 0 },
            });
      }),
    );
    const user = userEvent.setup();
    renderPublic(<Home />);

    expect(await screen.findByText('Artikel gagal dimuat')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByText('Belum ada artikel')).toBeInTheDocument();
  });

  it('menyediakan tombol "Lihat semua" ke daftar portofolio', () => {
    renderPublic(<Home />);
    expect(screen.getByRole('link', { name: 'Lihat semua' })).toHaveAttribute('href', '/portfolio');
  });

  it('mengatur judul dan deskripsi dokumen', () => {
    renderPublic(<Home />);
    expect(document.title).toBe('Pemerintah Digital | PEMDI PANRB');
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
