import { http, HttpResponse } from 'msw';
import type {
  ArticleSummary,
  PublicArticle,
  PublicCategory,
  CategoryRef,
} from '../services/content';

/**
 * API publik tiruan untuk uji (bentuk sama dengan kontrak di src/services/content.ts). Dipasang
 * sebagai handler bawaan server MSW, jadi setiap uji yang merender situs publik mendapat data ini;
 * uji yang butuh respons lain menimpanya dengan server.use().
 */

export const testCategories: CategoryRef[] = [
  { name: 'Layanan Publik', slug: 'layanan-publik' },
  { name: 'Kebijakan & Regulasi', slug: 'kebijakan-regulasi' },
  { name: 'Panduan Pengguna', slug: 'panduan-pengguna' },
];

const titles = [
  'Pemerintah Perkuat Layanan Digital ASN Melalui Integrasi INAgov',
  'PANRB Resmikan Pembaruan Sistem Digital Terpadu',
  'Mulai 2025, Informasi Layanan Publik Terpusat di INAgov',
  'INAgov Dorong Transparansi Informasi Pemerintahan',
  'Panduan Mengakses Layanan Kepegawaian Secara Daring',
  'Kebijakan Satu Data untuk Layanan yang Lebih Tepat',
  'Layanan Publik 24/7: Akses Tanpa Batas Waktu',
  'Regulasi Baru: Standar Kualitas Konten Digital',
  'Tutorial: Berlangganan Newsletter INAgov',
  'Layanan Publik Real-time: Update Informasi Terkini',
  'Kebijakan Aksesibilitas: Platform Ramah Disabilitas',
  'Panduan: Menggunakan Fitur Pencarian Lanjutan',
  'Layanan Publik Terintegrasi: Satu Platform untuk Semua',
  'Peraturan Terbaru: Standar Konten Multibahasa',
  'Panduan: Menggunakan Fitur Share Artikel',
];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** 15 artikel terbit, terbaru lebih dulu; kategori bergiliran. */
export const testArticles: PublicArticle[] = titles.map((title, index) => ({
  slug: slugify(title),
  title,
  excerpt: `Ringkasan artikel ${index + 1}: ${title.toLowerCase()} untuk masyarakat dan ASN.`,
  cover_url: index === 4 ? null : `/images/articles/article-${(index % 6) + 1}.webp`,
  published_at: new Date(Date.UTC(2025, 0, 24 - index, 2)).toISOString(),
  category: testCategories[index % 3],
  author: { name: index % 2 === 0 ? 'Haechal' : 'Siti Rahma' },
  body_html: `<p>Paragraf pembuka artikel ${index + 1}.</p><h2>Latar belakang</h2><p>Isi lanjutan dengan <a href="https://www.menpan.go.id" rel="noopener noreferrer">tautan resmi</a>.</p>`,
  source: index === 2 ? 'Biro Hubungan Masyarakat' : null,
  reading_minutes: 2,
}));

export function toSummary({
  slug,
  title,
  excerpt,
  cover_url,
  published_at,
  category,
  author,
}: PublicArticle): ArticleSummary {
  return { slug, title, excerpt, cover_url, published_at, category, author };
}

export const publicHandlers = [
  http.get('/api/categories', () =>
    HttpResponse.json({
      data: testCategories.map((category): PublicCategory => ({
        ...category,
        articles_count: testArticles.filter((a) => a.category.slug === category.slug).length,
      })),
    }),
  ),

  http.get('/api/articles', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const kategori = params.get('kategori');
    const cari = params.get('cari')?.toLowerCase();
    const perPage = Math.min(24, Number(params.get('per_page')) || 12);
    const page = Math.max(1, Number(params.get('page')) || 1);

    const matches = testArticles.filter(
      (article) =>
        (!kategori || article.category.slug === kategori) &&
        (!cari || `${article.title} ${article.excerpt}`.toLowerCase().includes(cari)),
    );
    const lastPage = Math.max(1, Math.ceil(matches.length / perPage));
    return HttpResponse.json({
      data: matches.slice((page - 1) * perPage, page * perPage).map(toSummary),
      meta: { current_page: page, last_page: lastPage, per_page: perPage, total: matches.length },
    });
  }),

  http.get('/api/articles/:slug', ({ params }) => {
    const article = testArticles.find((item) => item.slug === params.slug);
    if (!article) {
      return HttpResponse.json({ message: 'Artikel tidak ditemukan.' }, { status: 404 });
    }
    const related = testArticles
      .filter((item) => item.slug !== article.slug && item.category.slug === article.category.slug)
      .slice(0, 3)
      .map(toSummary);
    return HttpResponse.json({ data: article, related });
  }),

  http.get('/api/contact/token', () => HttpResponse.json({ token: 'token-formulir-uji' })),
];
