import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as data from '../data/articlesData';
import { formatDate } from '../lib/format';
import ArticleDetail from './ArticleDetail';

const article = data.articles[0]; // id '1', Kebijakan & Regulasi

describe('ArticleDetail', () => {
  it('menampilkan header artikel: kategori, waktu baca, judul, ringkasan, tanggal, penulis', () => {
    render(<ArticleDetail articleId={article.id} />);

    expect(screen.getByRole('heading', { level: 1, name: article.title })).toBeInTheDocument();
    expect(screen.getByText(article.category)).toBeInTheDocument();
    expect(screen.getByText(article.excerpt)).toBeInTheDocument();
    expect(screen.getByText(`${data.getReadingMinutes(article)} menit baca`)).toBeInTheDocument();
    expect(screen.getByText(article.author)).toBeInTheDocument();
  });

  it('memformat tanggal dalam bahasa Indonesia dan menyertakan <time datetime>', () => {
    const { container } = render(<ArticleDetail articleId={article.id} />);
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('datetime', article.date);
    expect(time).toHaveTextContent(formatDate(article.date));
    expect(time).toHaveTextContent('24 Januari 2025');
  });

  it('menampilkan avatar inisial penulis yang dekoratif', () => {
    render(<ArticleDetail articleId={article.id} />);
    expect(screen.getByText('HA')).toBeInTheDocument();
  });

  it('menampilkan gambar utama dengan alt, dimensi intrinsik, dan prioritas muat', () => {
    render(<ArticleDetail articleId={article.id} />);
    const image = screen.getByRole('img', { name: article.title });
    expect(image).toHaveAttribute('src', article.mediaSrc);
    expect(image).toHaveAttribute('width', '328');
    expect(image).toHaveAttribute('height', '202');
    expect(image).toHaveAttribute('fetchpriority', 'high');
    expect(image).toHaveAttribute('decoding', 'async');
  });

  it('menampilkan seluruh paragraf isi (fallback placeholder bila content kosong)', () => {
    render(<ArticleDetail articleId={article.id} />);
    for (const paragraph of data.placeholderContent) {
      expect(screen.getByText(paragraph.slice(0, 60), { exact: false })).toBeInTheDocument();
    }
  });

  it('tidak menampilkan baris sumber bila artikel tidak punya source', () => {
    render(<ArticleDetail articleId={article.id} />);
    expect(screen.queryByText(/Sumber:/)).not.toBeInTheDocument();
  });

  it('menampilkan baris sumber dan isi khusus bila artikel punya source dan content', () => {
    vi.spyOn(data, 'getArticleById').mockReturnValue({
      ...article,
      source: 'inadigitalnews.com',
      content: ['Paragraf khusus artikel ini.'],
    });
    render(<ArticleDetail articleId={article.id} />);

    expect(screen.getByText('Sumber: inadigitalnews.com')).toBeInTheDocument();
    expect(screen.getByText('Paragraf khusus artikel ini.')).toBeInTheDocument();
    expect(
      screen.queryByText(data.placeholderContent[0].slice(0, 40), { exact: false }),
    ).toBeNull();
  });

  it('mengatur judul dokumen, deskripsi, dan tidak menandai noindex', () => {
    render(<ArticleDetail articleId={article.id} />);
    expect(document.title).toBe(`${article.title} | PEMDI PANRB`);
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      article.excerpt,
    );
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  describe('breadcrumb', () => {
    it('menampilkan Beranda > Portofolio > judul (dipotong 24 karakter)', () => {
      render(<ArticleDetail articleId={article.id} />);
      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

      expect(within(nav).getByText('Beranda')).toBeInTheDocument();
      expect(within(nav).getByText('Portofolio')).toBeInTheDocument();
      expect(article.title.length).toBeGreaterThan(24);
      expect(within(nav).queryByText(article.title)).not.toBeInTheDocument();
    });

    it('klik Beranda dan Portofolio berpindah halaman', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<ArticleDetail articleId={article.id} />);
      await user.click(
        within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText('Portofolio'),
      );
      expect(window.location.pathname).toBe('/portfolio');
      unmount();

      render(<ArticleDetail articleId={article.id} />);
      await user.click(
        within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText('Beranda'),
      );
      expect(window.location.pathname).toBe('/');
    });
  });

  describe('artikel terkait', () => {
    it('menampilkan 3 artikel sekategori selain artikel ini', () => {
      render(<ArticleDetail articleId={article.id} />);
      const section = screen.getByRole('region', { name: 'Artikel terkait' });
      const hrefs = within(section)
        .getAllByRole('link')
        .map((l) => l.getAttribute('href'))
        .filter((href) => /^\/portfolio\/\d+$/.test(href ?? ''));

      const expected = data.getRelatedArticles(article).map((a) => `/portfolio/${a.id}`);
      expect(hrefs).toEqual(expected);
      expect(hrefs).toHaveLength(3);
      expect(hrefs).not.toContain(`/portfolio/${article.id}`);
    });

    it('"Lihat semua" menaut ke daftar portofolio kategori yang sama', () => {
      render(<ArticleDetail articleId={article.id} />);
      const link = screen.getByRole('link', { name: /Lihat semua/ });
      expect(link).toHaveAttribute(
        'href',
        `/portfolio?kategori=${encodeURIComponent(article.category)}`,
      );
    });

    it('bagian terkait tidak ditampilkan bila tidak ada artikel terkait', () => {
      vi.spyOn(data, 'getRelatedArticles').mockReturnValue([]);
      render(<ArticleDetail articleId={article.id} />);
      expect(screen.queryByRole('region', { name: 'Artikel terkait' })).not.toBeInTheDocument();
    });
  });

  describe('artikel tidak ditemukan', () => {
    it('menampilkan halaman 404 khusus artikel, bukan error', () => {
      render(<ArticleDetail articleId="999" />);
      expect(
        screen.getByRole('heading', { level: 1, name: 'Artikel tidak ditemukan' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toBeInTheDocument();
    });

    it('menandai noindex dan memberi judul dokumen yang jelas', () => {
      render(<ArticleDetail articleId="999" />);
      expect(document.title).toBe('Artikel tidak ditemukan | PEMDI PANRB');
      expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex',
      );
    });
  });
});
