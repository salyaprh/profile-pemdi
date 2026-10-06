// Data dummy artikel/portofolio. Gambar disajikan dari folder `public`.

export type ArticleCategory = 'Layanan Publik' | 'Kebijakan & Regulasi' | 'Panduan Pengguna';

/** Nilai filter kategori di halaman Portofolio ('Semua' = tanpa filter). */
export type CategoryFilter = 'Semua' | ArticleCategory;

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  /** Format ISO: YYYY-MM-DD */
  date: string;
  category: ArticleCategory;
  mediaSrc: string;
  /** Paragraf isi artikel. Bila kosong, dipakai `placeholderContent`. */
  content?: string[];
  /** Sumber artikel; ditampilkan di bawah gambar hanya bila diisi. */
  source?: string;
}

// Import article images (cycle through 1-6)
// Using public paths in Vite
const article1Image = '/images/articles/article-1.webp';
const article2Image = '/images/articles/article-2.webp';
const article3Image = '/images/articles/article-3.webp';
const article4Image = '/images/articles/article-4.webp';
const article5Image = '/images/articles/article-5.webp';
const article6Image = '/images/articles/article-6.webp';

const articleImages = [
  article1Image,
  article2Image,
  article3Image,
  article4Image,
  article5Image,
  article6Image,
];

// Helper function untuk cycle image (item 1-6 pakai 1-6, item 7-12 pakai 1-6 lagi, dst)
const getArticleImage = (index: number): string => {
  return articleImages[index % 6];
};

export const articles: Article[] = [
  {
    id: '1',
    title: 'Pemerintah Perkuat Layanan Digital ASN Melalui Integrasi INAgov',
    excerpt:
      'Integrasi layanan ke dalam INAgov diharapkan meningkatkan efisiensi dan akses informasi bagi Aparatur Sipil Negara di seluruh Indonesia.',
    author: 'Haechal',
    date: '2025-01-24',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(0),
  },
  {
    id: '2',
    title: 'PANRB Resmikan Pembaruan Sistem Digital Terpadu',
    excerpt:
      'Pembaruan ini mencakup peningkatan konten FAQ, artikel kebijakan, dan pusat bantuan bagi ASN.',
    author: 'Haechal',
    date: '2025-01-20',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(1),
  },
  {
    id: '3',
    title: 'Mulai 2025, Informasi Layanan Publik Terpusat di INAgov',
    excerpt:
      'Pemerintah menargetkan INAgov sebagai kanal utama penyampaian informasi layanan publik kepada masyarakat.',
    author: 'Haechal',
    date: '2025-01-18',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(2),
  },
  {
    id: '4',
    title: 'INAgov Dorong Transparansi Informasi Pemerintahan',
    excerpt:
      'Langkah ini dilakukan untuk memastikan ASN memperoleh informasi yang akurat dan terkini mengenai kebijakan pemerintah.',
    author: 'Haechal',
    date: '2025-01-15',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(3),
  },
  {
    id: '5',
    title: 'Pemerintah Tingkatkan Kualitas Konten Informasi Digital',
    excerpt:
      'Optimalisasi konten artikel dan pusat bantuan menjadi bagian dari strategi transformasi digital pemerintah.',
    author: 'Haechal',
    date: '2025-01-12',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(4),
  },
  {
    id: '6',
    title: 'PANRB Tekankan Pentingnya Integrasi Sistem Informasi',
    excerpt:
      'Pengelolaan artikel dan pusat informasi dinilai krusial dalam mendukung efisiensi kerja ASN.',
    author: 'Haechal',
    date: '2025-01-10',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(5),
  },
  {
    id: '7',
    title: 'Panduan Mengakses Layanan Publik Melalui INAgov',
    excerpt:
      'Pelajari langkah-langkah mudah untuk mengakses berbagai layanan publik yang tersedia di platform INAgov.',
    author: 'Haechal',
    date: '2025-01-08',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(0),
  },
  {
    id: '8',
    title: 'Kementerian Luncurkan Fitur Baru Portal INAgov',
    excerpt:
      'Fitur baru ini dirancang untuk memudahkan pengguna dalam menemukan informasi dan layanan yang dibutuhkan.',
    author: 'Haechal',
    date: '2025-01-05',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(1),
  },
  {
    id: '9',
    title: 'Regulasi Baru Terkait Digitalisasi Pelayanan Publik',
    excerpt:
      'Pemerintah mengeluarkan regulasi terbaru untuk memperkuat kerangka hukum digitalisasi pelayanan publik.',
    author: 'Haechal',
    date: '2025-01-03',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(2),
  },
  {
    id: '10',
    title: 'Cara Menggunakan Fitur Pencarian di INAgov',
    excerpt:
      'Tutorial lengkap untuk memaksimalkan penggunaan fitur pencarian dalam menemukan artikel dan informasi yang relevan.',
    author: 'Haechal',
    date: '2025-01-01',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(3),
  },
  {
    id: '11',
    title: 'Transformasi Digital Pemerintahan Capai Milestone Baru',
    excerpt:
      'Program transformasi digital pemerintah menunjukkan kemajuan signifikan dengan integrasi berbagai layanan ke dalam satu platform.',
    author: 'Haechal',
    date: '2024-12-28',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(4),
  },
  {
    id: '12',
    title: 'Panduan Lengkap Registrasi Akun INAgov',
    excerpt:
      'Ikuti panduan step-by-step untuk membuat dan mengaktifkan akun INAgov Anda dengan mudah dan cepat.',
    author: 'Haechal',
    date: '2024-12-25',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(5),
  },
  {
    id: '13',
    title: 'Kebijakan Baru: Standar Konten Digital Pemerintah',
    excerpt:
      'Pemerintah menetapkan standar baru untuk memastikan kualitas dan konsistensi konten digital di seluruh platform pemerintah.',
    author: 'Haechal',
    date: '2024-12-22',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(0),
  },
  {
    id: '14',
    title: 'Layanan Publik Online: Akses 24/7 untuk Masyarakat',
    excerpt:
      'Platform INAgov memungkinkan masyarakat mengakses berbagai layanan publik kapan saja dan di mana saja.',
    author: 'Haechal',
    date: '2024-12-20',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(1),
  },
  {
    id: '15',
    title: 'Tutorial: Memahami Kategori Artikel di INAgov',
    excerpt:
      'Pelajari cara memanfaatkan sistem kategori untuk menemukan artikel yang sesuai dengan kebutuhan Anda.',
    author: 'Haechal',
    date: '2024-12-18',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(2),
  },
  {
    id: '16',
    title: 'Peraturan Terbaru tentang Aksesibilitas Digital',
    excerpt:
      'Pemerintah mengeluarkan peraturan baru untuk memastikan platform digital pemerintah dapat diakses oleh semua kalangan.',
    author: 'Haechal',
    date: '2024-12-15',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(3),
  },
  {
    id: '17',
    title: 'Inovasi Layanan: Chatbot AI untuk Bantuan Publik',
    excerpt:
      'INAgov memperkenalkan fitur chatbot berbasis AI untuk memberikan bantuan instan kepada pengguna platform.',
    author: 'Haechal',
    date: '2024-12-12',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(4),
  },
  {
    id: '18',
    title: 'Panduan: Mengelola Notifikasi di INAgov',
    excerpt:
      'Pelajari cara mengatur dan mengelola notifikasi agar tidak ketinggalan informasi penting dari pemerintah.',
    author: 'Haechal',
    date: '2024-12-10',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(5),
  },
  {
    id: '19',
    title: 'Kebijakan Keamanan Data di Platform INAgov',
    excerpt:
      'Pemerintah memastikan keamanan data pengguna dengan menerapkan standar keamanan siber yang ketat.',
    author: 'Haechal',
    date: '2024-12-08',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(0),
  },
  {
    id: '20',
    title: 'Layanan One-Stop Service untuk ASN',
    excerpt:
      'Platform INAgov menyediakan layanan terpadu yang memudahkan ASN dalam mengakses berbagai informasi dan layanan.',
    author: 'Haechal',
    date: '2024-12-05',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(1),
  },
  {
    id: '21',
    title: 'Cara Melaporkan Masalah Teknis di INAgov',
    excerpt:
      'Panduan lengkap untuk melaporkan masalah teknis yang Anda temui saat menggunakan platform INAgov.',
    author: 'Haechal',
    date: '2024-12-03',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(2),
  },
  {
    id: '22',
    title: 'Regulasi Privasi Data Pengguna INAgov',
    excerpt:
      'Pemerintah mengatur kebijakan privasi yang jelas untuk melindungi data pribadi pengguna platform INAgov.',
    author: 'Haechal',
    date: '2024-12-01',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(3),
  },
  {
    id: '23',
    title: 'Layanan Publik Digital: Efisiensi dan Transparansi',
    excerpt:
      'Digitalisasi layanan publik meningkatkan efisiensi dan transparansi dalam penyelenggaraan pemerintahan.',
    author: 'Haechal',
    date: '2024-11-28',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(4),
  },
  {
    id: '24',
    title: 'Panduan: Memahami Dashboard INAgov',
    excerpt:
      'Pelajari cara menggunakan dashboard INAgov untuk mengakses informasi dan layanan dengan lebih efisien.',
    author: 'Haechal',
    date: '2024-11-25',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(5),
  },
  {
    id: '25',
    title: 'Kebijakan Baru: Standar UI/UX Platform Pemerintah',
    excerpt:
      'Pemerintah menetapkan standar desain antarmuka untuk memastikan pengalaman pengguna yang konsisten.',
    author: 'Haechal',
    date: '2024-11-22',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(0),
  },
  {
    id: '26',
    title: 'Layanan Publik Mobile: Akses dari Smartphone',
    excerpt:
      'Platform INAgov kini dapat diakses dengan optimal melalui perangkat mobile untuk kemudahan pengguna.',
    author: 'Haechal',
    date: '2024-11-20',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(1),
  },
  {
    id: '27',
    title: 'Tutorial: Menggunakan Fitur Bookmark Artikel',
    excerpt: 'Pelajari cara menyimpan artikel favorit Anda untuk dibaca kembali di kemudian hari.',
    author: 'Haechal',
    date: '2024-11-18',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(2),
  },
  {
    id: '28',
    title: 'Peraturan Terbaru: Standar Konten Multibahasa',
    excerpt:
      'Pemerintah mengatur standar untuk menyediakan konten dalam berbagai bahasa daerah dan internasional.',
    author: 'Haechal',
    date: '2024-11-15',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(3),
  },
  {
    id: '29',
    title: 'Layanan Publik Terintegrasi: Satu Platform untuk Semua',
    excerpt:
      'INAgov menjadi platform terpadu yang menghubungkan berbagai layanan publik dalam satu tempat.',
    author: 'Haechal',
    date: '2024-11-12',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(4),
  },
  {
    id: '30',
    title: 'Panduan: Menggunakan Fitur Pencarian Lanjutan',
    excerpt:
      'Pelajari cara memanfaatkan filter dan opsi pencarian lanjutan untuk menemukan informasi yang lebih spesifik.',
    author: 'Haechal',
    date: '2024-11-10',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(5),
  },
  {
    id: '31',
    title: 'Kebijakan Aksesibilitas: Platform Ramah Disabilitas',
    excerpt:
      'Pemerintah memastikan platform INAgov dapat diakses dengan mudah oleh pengguna dengan kebutuhan khusus.',
    author: 'Haechal',
    date: '2024-11-08',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(0),
  },
  {
    id: '32',
    title: 'Layanan Publik Real-time: Update Informasi Terkini',
    excerpt:
      'Platform INAgov menyediakan update informasi real-time untuk memastikan pengguna selalu mendapatkan data terbaru.',
    author: 'Haechal',
    date: '2024-11-05',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(1),
  },
  {
    id: '33',
    title: 'Tutorial: Berlangganan Newsletter INAgov',
    excerpt:
      'Ikuti panduan untuk berlangganan newsletter dan mendapatkan update informasi terbaru langsung di email Anda.',
    author: 'Haechal',
    date: '2024-11-03',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(2),
  },
  {
    id: '34',
    title: 'Regulasi Baru: Standar Kualitas Konten Digital',
    excerpt:
      'Pemerintah menetapkan standar kualitas untuk memastikan konten digital yang akurat dan terpercaya.',
    author: 'Haechal',
    date: '2024-11-01',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(3),
  },
  {
    id: '35',
    title: 'Layanan Publik 24/7: Akses Tanpa Batas Waktu',
    excerpt:
      'Platform INAgov tersedia 24 jam sehari, 7 hari seminggu untuk memastikan akses layanan publik yang tidak terbatas.',
    author: 'Haechal',
    date: '2024-10-28',
    category: 'Layanan Publik',
    mediaSrc: getArticleImage(4),
  },
  {
    id: '36',
    title: 'Panduan: Menggunakan Fitur Share Artikel',
    excerpt:
      'Pelajari cara membagikan artikel menarik dari INAgov ke media sosial atau platform lainnya.',
    author: 'Haechal',
    date: '2024-10-25',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(5),
  },
];

// Opsi kategori untuk Chip filter
export const categoryOptions: { label: string; value: CategoryFilter }[] = [
  { label: 'Semua', value: 'Semua' },
  { label: 'Layanan Publik', value: 'Layanan Publik' },
  { label: 'Kebijakan & Regulasi', value: 'Kebijakan & Regulasi' },
  { label: 'Panduan Pengguna', value: 'Panduan Pengguna' },
];

export function isCategoryFilter(value: string | null): value is CategoryFilter {
  return categoryOptions.some((option) => option.value === value);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find((article) => article.id === id);
}

/** Artikel dengan kategori sama (selain artikel itu sendiri), terbaru lebih dulu. */
export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return articles
    .filter((item) => item.id !== article.id && item.category === article.category)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/** Pencarian sederhana pada judul, ringkasan, dan kategori. */
export function searchArticles(query: string, limit = 6): Article[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return articles
    .filter((article) =>
      [article.title, article.excerpt, article.category].some((field) =>
        field.toLowerCase().includes(term),
      ),
    )
    .slice(0, limit);
}

// TODO: ganti dengan isi artikel asli per artikel (field `content`) dari CMS/API.
// Sampai saat itu, semua artikel memakai teks contoh berikut.
export const placeholderContent: string[] = [
  'Jakarta — Pemerintah terus mendorong percepatan transformasi digital di lingkungan Aparatur Sipil Negara (ASN) melalui penguatan integrasi layanan dalam platform INAgov.',
  'Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi (KemenPANRB) menyatakan bahwa integrasi berbagai layanan ASN ke dalam satu portal bertujuan untuk mengurangi fragmentasi sistem yang selama ini menghambat efisiensi kerja.',
  '"Selama ini ASN harus berpindah-pindah platform untuk mengakses layanan yang berbeda. Dengan INAgov, kami ingin menghadirkan pengalaman yang lebih sederhana, konsisten, dan efisien," ujar perwakilan KemenPANRB dalam keterangan resminya.',
  'Integrasi ini mencakup layanan informasi kepegawaian, pengembangan kompetensi, akses kebijakan terbaru, dan berbagai layanan administratif lainnya. Melalui platform terpadu ini, diharapkan ASN dapat menghemat waktu dan meningkatkan produktivitas kerja.',
  'Selain efisiensi, penguatan INAgov juga diharapkan dapat meningkatkan transparansi dan akuntabilitas dalam penyelenggaraan pemerintahan. Semua informasi dan layanan yang tersedia di platform ini dapat diakses dengan mudah oleh seluruh ASN di seluruh Indonesia.',
  'Ke depan, pemerintah berencana untuk terus mengembangkan fitur INAgov dengan menambahkan lebih banyak layanan dan meningkatkan kualitas konten informasi yang tersedia. Langkah ini merupakan bagian dari komitmen pemerintah dalam mempercepat transformasi digital sektor publik.',
];

export function getArticleContent(article: Article): string[] {
  return article.content?.length ? article.content : placeholderContent;
}

/** Perkiraan waktu baca dalam menit (200 kata/menit, minimal 1). */
export function getReadingMinutes(article: Article): number {
  const words = getArticleContent(article).join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
