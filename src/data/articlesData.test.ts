import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  articles,
  categoryOptions,
  getArticleById,
  getArticleContent,
  getReadingMinutes,
  getRelatedArticles,
  isCategoryFilter,
  placeholderContent,
  searchArticles,
  type Article,
} from './articlesData';

const categories = categoryOptions.filter((o) => o.value !== 'Semua').map((o) => o.value);

describe('integritas data artikel', () => {
  it('berisi 36 artikel dengan ID unik', () => {
    expect(articles).toHaveLength(36);
    expect(new Set(articles.map((a) => a.id)).size).toBe(articles.length);
  });

  it('setiap artikel punya kategori yang valid dan bukan "Semua"', () => {
    for (const article of articles) {
      expect(categories, `artikel ${article.id}`).toContain(article.category);
    }
  });

  it('setiap artikel punya tanggal ISO yang valid', () => {
    for (const article of articles) {
      expect(article.date, `artikel ${article.id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(article.date).getTime()), `artikel ${article.id}`).toBe(false);
    }
  });

  it('setiap artikel punya judul, ringkasan, dan penulis terisi', () => {
    for (const article of articles) {
      expect(article.title.trim(), `judul ${article.id}`).not.toBe('');
      expect(article.excerpt.trim(), `ringkasan ${article.id}`).not.toBe('');
      expect(article.author.trim(), `penulis ${article.id}`).not.toBe('');
    }
  });

  it('ringkasan tidak terpotong dengan "..." (regresi artikel #2)', () => {
    for (const article of articles) {
      expect(article.excerpt, `ringkasan ${article.id}`).not.toMatch(/\.\.\.$|…$/);
    }
  });

  it('berkas gambar setiap artikel ada di folder public', () => {
    const files = new Set(articles.map((a) => a.mediaSrc));
    for (const src of files) {
      expect(existsSync(resolve('public', `.${src}`)), src).toBe(true);
    }
  });
});

describe('isCategoryFilter', () => {
  it('menerima "Semua" dan kategori valid saja', () => {
    expect(isCategoryFilter('Semua')).toBe(true);
    expect(isCategoryFilter('Layanan Publik')).toBe(true);
    expect(isCategoryFilter('layanan publik')).toBe(false);
    expect(isCategoryFilter('Tidak Ada')).toBe(false);
    expect(isCategoryFilter(null)).toBe(false);
  });
});

describe('getArticleById', () => {
  it('menemukan artikel yang ada dan undefined bila tidak ada', () => {
    expect(getArticleById('3')?.id).toBe('3');
    expect(getArticleById('999')).toBeUndefined();
    expect(getArticleById('')).toBeUndefined();
  });
});

describe('getRelatedArticles', () => {
  const article = articles[0];

  it('hanya mengembalikan artikel sekategori dan bukan artikel itu sendiri', () => {
    const related = getRelatedArticles(article);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((a) => a.category === article.category)).toBe(true);
    expect(related.some((a) => a.id === article.id)).toBe(false);
  });

  it('dibatasi jumlahnya (default 3) dan terurut dari yang terbaru', () => {
    const related = getRelatedArticles(article);
    expect(related).toHaveLength(3);
    const dates = related.map((a) => a.date);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
    expect(getRelatedArticles(article, 1)).toHaveLength(1);
  });
});

describe('searchArticles', () => {
  it('mengembalikan array kosong untuk kueri kosong atau spasi', () => {
    expect(searchArticles('')).toEqual([]);
    expect(searchArticles('   ')).toEqual([]);
  });

  it('tidak peka huruf besar/kecil dan mencocokkan judul, ringkasan, atau kategori', () => {
    const byTitle = searchArticles('transparansi');
    expect(byTitle.length).toBeGreaterThan(0);
    expect(searchArticles('TRANSPARANSI').map((a) => a.id)).toEqual(byTitle.map((a) => a.id));

    const byCategory = searchArticles('panduan pengguna', 50);
    expect(byCategory.some((a) => a.category === 'Panduan Pengguna')).toBe(true);
  });

  it('dibatasi sesuai limit (default 6)', () => {
    expect(searchArticles('a', 50).length).toBeGreaterThan(6);
    expect(searchArticles('a')).toHaveLength(6);
    expect(searchArticles('a', 2)).toHaveLength(2);
  });

  it('tidak menemukan apa pun untuk kata yang tidak ada', () => {
    expect(searchArticles('zzzxxx')).toEqual([]);
  });
});

describe('isi artikel dan waktu baca', () => {
  const base: Article = { ...articles[0], content: undefined };

  it('memakai placeholderContent bila content kosong', () => {
    expect(getArticleContent(base)).toBe(placeholderContent);
    expect(getArticleContent({ ...base, content: [] })).toBe(placeholderContent);
  });

  it('memakai content milik artikel bila ada', () => {
    const content = ['Satu.', 'Dua.'];
    expect(getArticleContent({ ...base, content })).toBe(content);
  });

  it('waktu baca minimal 1 menit dan naik per 200 kata', () => {
    expect(getReadingMinutes({ ...base, content: ['pendek'] })).toBe(1);
    const words = (n: number) => [Array.from({ length: n }, () => 'kata').join(' ')];
    expect(getReadingMinutes({ ...base, content: words(200) })).toBe(1);
    expect(getReadingMinutes({ ...base, content: words(201) })).toBe(2);
    expect(getReadingMinutes({ ...base, content: words(1000) })).toBe(5);
  });
});
