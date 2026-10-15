import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { testArticles, toSummary } from '../test/publicApi';
import { server } from '../test/server';
import { renderPublic } from '../test/utils';
import ArticleDetail from './ArticleDetail';

const article = testArticles[0]; // Layanan Publik, terbit 24 Januari 2025 09.00 WIB

async function renderArticle(slug = article.slug) {
  const user = userEvent.setup();
  const view = renderPublic(<ArticleDetail slug={slug} />);
  await screen.findByRole('heading', { level: 1 });
  return { user, ...view };
}

describe('ArticleDetail', () => {
  it('menampilkan kerangka dengan status "Memuat" selama artikel diambil', () => {
    renderPublic(<ArticleDetail slug={article.slug} />);
    expect(screen.getByRole('status')).toHaveTextContent('Memuat artikel');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
  });

  it('menampilkan header artikel: kategori, waktu baca, judul, ringkasan, tanggal, penulis', async () => {
    await renderArticle();

    expect(screen.getByRole('heading', { level: 1, name: article.title })).toBeInTheDocument();
    expect(screen.getByText(article.category.name)).toBeInTheDocument();
    expect(screen.getByText(article.excerpt)).toBeInTheDocument();
    expect(screen.getByText('2 menit baca')).toBeInTheDocument();
    expect(screen.getByText(article.author.name)).toBeInTheDocument();
    expect(screen.getByText('HA')).toBeInTheDocument(); // avatar inisial penulis
  });

  it('memformat tanggal terbit (WIB) dan menyertakan <time datetime>', async () => {
    const { container } = await renderArticle();
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('datetime', article.published_at);
    expect(time).toHaveTextContent('24 Januari 2025');
  });

  it('menampilkan gambar sampul dengan prioritas muat; alt kosong karena judul sudah ada', async () => {
    const { container } = await renderArticle();
    const image = container.querySelector('figure img');
    expect(image).toHaveAttribute('src', article.cover_url);
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('fetchpriority', 'high');
  });

  it('merender isi HTML dari server di dalam .article-body (judul bagian dan tautan)', async () => {
    const { container } = await renderArticle();
    const body = container.querySelector('.article-body');
    expect(body).not.toBeNull();
    expect(
      within(body as HTMLElement).getByRole('heading', { level: 2, name: 'Latar belakang' }),
    ).toBeInTheDocument();
    expect(within(body as HTMLElement).getByRole('link', { name: 'tautan resmi' })).toHaveAttribute(
      'href',
      'https://www.menpan.go.id',
    );
  });

  it('tidak menampilkan baris sumber bila artikel tidak punya sumber', async () => {
    await renderArticle();
    expect(screen.queryByText(/Sumber:/)).not.toBeInTheDocument();
  });

  it('menampilkan sumber di bawah gambar sampul bila diisi', async () => {
    await renderArticle(testArticles[2].slug);
    expect(screen.getByText('Sumber: Biro Hubungan Masyarakat')).toBeInTheDocument();
  });

  it('artikel tanpa sampul tidak menampilkan gambar kosong', async () => {
    const { container } = await renderArticle(testArticles[4].slug);
    expect(container.querySelector('figure')).toBeNull();
  });

  it('mengatur judul dokumen, deskripsi, canonical slug, dan tidak menandai noindex', async () => {
    await renderArticle();
    expect(document.title).toBe(`${article.title} | PEMDI PANRB`);
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      article.excerpt,
    );
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  describe('breadcrumb', () => {
    it('menampilkan Beranda > Portofolio > judul (dipotong 24 karakter)', async () => {
      await renderArticle();
      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

      expect(within(nav).getByText('Beranda')).toBeInTheDocument();
      expect(within(nav).getByText('Portofolio')).toBeInTheDocument();
      expect(article.title.length).toBeGreaterThan(24);
      expect(within(nav).queryByText(article.title)).not.toBeInTheDocument();
    });

    it('klik Portofolio berpindah halaman', async () => {
      const { user } = await renderArticle();
      await user.click(
        within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText('Portofolio'),
      );
      expect(window.location.pathname).toBe('/portfolio');
    });
  });

  describe('artikel terkait', () => {
    it('menampilkan artikel terkait dari respons API, tanpa artikel ini sendiri', async () => {
      await renderArticle();
      const section = screen.getByRole('region', { name: 'Artikel terkait' });
      const hrefs = within(section)
        .getAllByRole('link')
        .map((l) => l.getAttribute('href'))
        .filter((href) => /^\/portfolio\/[^/?]+$/.test(href ?? ''));

      expect(hrefs).toEqual(
        testArticles
          .filter((a) => a.category.slug === article.category.slug && a.slug !== article.slug)
          .slice(0, 3)
          .map((a) => `/portfolio/${a.slug}`),
      );
    });

    it('"Lihat semua" menaut ke daftar portofolio kategori yang sama (slug)', async () => {
      await renderArticle();
      expect(screen.getByRole('link', { name: /Lihat semua/ })).toHaveAttribute(
        'href',
        '/portfolio?kategori=layanan-publik',
      );
    });

    it('bagian terkait tidak ditampilkan bila tidak ada artikel terkait', async () => {
      server.use(
        http.get('/api/articles/:slug', () => HttpResponse.json({ data: article, related: [] })),
      );
      await renderArticle();
      expect(screen.queryByRole('region', { name: 'Artikel terkait' })).not.toBeInTheDocument();
    });
  });

  describe('artikel tidak ditemukan (404 dari API)', () => {
    it('menampilkan halaman 404 khusus artikel, noindex, dan judul dokumen yang jelas', async () => {
      await renderArticle('tidak-ada');
      expect(
        screen.getByRole('heading', { level: 1, name: 'Artikel tidak ditemukan' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toBeInTheDocument();
      expect(document.title).toBe('Artikel tidak ditemukan | PEMDI PANRB');
      expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex',
      );
    });
  });

  it('gagal memuat (bukan 404): pesan galat dan coba lagi, bukan halaman 404', async () => {
    let calls = 0;
    server.use(
      http.get('/api/articles/:slug', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.error()
          : HttpResponse.json({ data: article, related: testArticles.slice(1, 2).map(toSummary) });
      }),
    );
    const { user } = await renderArticle();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Artikel gagal dimuat' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tidak dapat terhubung ke server/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: article.title }),
    ).toBeInTheDocument();
  });
});
