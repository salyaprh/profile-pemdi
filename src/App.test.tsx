import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { articles } from './data/articlesData';
import { renderWithToast, setUrl } from './test/utils';

const h1 = () => screen.getByRole('heading', { level: 1 });

function renderAt(url: string) {
  setUrl(url);
  return renderWithToast(<App />);
}

describe('App: peta rute', () => {
  it.each([
    ['/', 'Transformasi digital pemerintah untuk Indonesia yang lebih maju.'],
    ['/portfolio', 'Portofolio Pemerintah Digital'],
    ['/portfolio?kategori=Layanan+Publik&halaman=2', 'Portofolio Pemerintah Digital'],
    ['/portfolio/', 'Portofolio Pemerintah Digital'],
    ['/contact', 'Hubungi kami'],
    ['/contact/', 'Hubungi kami'],
    [`/portfolio/${articles[2].id}`, articles[2].title],
  ])('%s -> %s', (url, heading) => {
    renderAt(url);
    expect(h1()).toHaveTextContent(heading);
  });

  it.each([
    '/halaman-ngawur',
    '/portfolio/1/extra',
    '/PORTFOLIO',
    '/contact/x',
    '/portfolio/%E0%A4%A', // URL rusak (percent-encoding tidak valid) tidak boleh melempar error
  ])('path tidak dikenal %s -> halaman 404', (url) => {
    renderAt(url);
    expect(h1()).toHaveTextContent('404: Halaman tidak ditemukan');
  });

  it('ID artikel yang tidak ada -> 404 khusus artikel', () => {
    renderAt('/portfolio/999');
    expect(h1()).toHaveTextContent('Artikel tidak ditemukan');
  });

  it('ID artikel ber-encode didekode sebelum dicari', () => {
    renderAt('/portfolio/%31'); // "%31" = "1"
    expect(h1()).toHaveTextContent(articles[0].title);
  });
});

describe('App: kerangka halaman', () => {
  it('memiliki header, main (target skip link), dan footer di semua halaman', () => {
    renderAt('/contact');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'konten-utama');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('skip link menjadi elemen pertama yang dapat difokus dan memindahkan fokus ke main', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.tab();
    const skip = screen.getByRole('link', { name: 'Lompat ke konten utama' });
    expect(skip).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.location.hash).toBe('');
  });
});

describe('App: navigasi', () => {
  it('menu header berpindah halaman tanpa memuat ulang dan memperbarui konten', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' });

    await user.click(within(nav).getByRole('link', { name: 'Portofolio' }));
    expect(h1()).toHaveTextContent('Portofolio Pemerintah Digital');

    await user.click(within(nav).getByRole('link', { name: 'Hubungi kami' }));
    expect(h1()).toHaveTextContent('Hubungi kami');
    expect(window.location.pathname).toBe('/contact');
  });

  it('klik kartu artikel di Beranda membuka detail, lalu breadcrumb kembali ke portofolio', async () => {
    const user = userEvent.setup();
    renderAt('/');

    const first = articles[0];
    await user.click(
      screen.getAllByRole('link').find((l) => l.getAttribute('href') === `/portfolio/${first.id}`)!,
    );
    expect(h1()).toHaveTextContent(first.title);

    await user.click(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText('Portofolio'),
    );
    expect(h1()).toHaveTextContent('Portofolio Pemerintah Digital');
  });

  it('tombol Back browser mengembalikan halaman sebelumnya (state ada di URL)', async () => {
    const user = userEvent.setup();
    renderAt('/portfolio?kategori=Layanan+Publik');
    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' });

    await user.click(within(nav).getByRole('link', { name: 'Hubungi kami' }));
    expect(h1()).toHaveTextContent('Hubungi kami');

    window.history.back();
    await screen.findByRole('heading', { level: 1, name: 'Portofolio Pemerintah Digital' });
    expect(window.location.search).toBe('?kategori=Layanan+Publik');
  });

  it('judul dokumen berubah mengikuti halaman', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(document.title).toBe('Pemerintah Digital | PEMDI PANRB');

    await user.click(
      within(screen.getByRole('navigation', { name: 'Navigasi utama' })).getByRole('link', {
        name: 'Hubungi kami',
      }),
    );
    expect(document.title).toBe('Hubungi kami | PEMDI PANRB');
  });
});
