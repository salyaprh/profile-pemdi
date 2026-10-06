// Adapted for React Starter - using public paths for images
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: ArticleCategory;
  mediaSrc: string;
  avatar: string;
}

// Import article images (cycle through 1-6)
// Using public paths in Vite
const article1Image = '/assets/articles/article-1.png';
const article2Image = '/assets/articles/article-2.png';
const article3Image = '/assets/articles/article-3.png';
const article4Image = '/assets/articles/article-4.png';
const article5Image = '/assets/articles/article-5.png';
const article6Image = '/assets/articles/article-6.png';

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

const avatarImage =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIgMTJDMTQuNzYxNCAxMiAxNyA5Ljc2MTQyIDE3IDdDMTcgNC4yMzg1OCAxNC43NjE0IDIgMTIgMkM5LjIzODU4IDIgNyA0LjIzODU4IDcgN0M3IDkuNzYxNDIgOS4yMzg1OCAxMiAxMiAxMloiIGZpbGw9IiM2QjcyODAiLz4KPHBhdGggZD0iTTEyIDE0QzguNjY4NzUgMTQgMiAxNS43OTE3IDIgMTlWMjJIMjJWMjlDMTkgMTkgMTIgMTQgMTIgMTRaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo8L3N2Zz4K';

// Categories sesuai design
export type ArticleCategory =
  | 'Semua'
  | 'Layanan Publik'
  | 'Kebijakan & Regulasi'
  | 'Panduan Pengguna';

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
    avatar: avatarImage,
  },
  {
    id: '2',
    title: 'PANRB Resmikan Pembaruan Sistem Digital Terpadu',
    excerpt: 'Pembaruan ini mencakup peningkatan konten FAQ, artikel ke...',
    author: 'Haechal',
    date: '2025-01-20',
    category: 'Kebijakan & Regulasi',
    mediaSrc: getArticleImage(1),
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
  },
  {
    id: '27',
    title: 'Tutorial: Menggunakan Fitur Bookmark Artikel',
    excerpt:
      'Pelajari cara menyimpan artikel favorit Anda untuk dibaca kembali di kemudian hari.',
    author: 'Haechal',
    date: '2024-11-18',
    category: 'Panduan Pengguna',
    mediaSrc: getArticleImage(2),
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
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
    avatar: avatarImage,
  },
];

// Category options untuk Chip filter
export const categoryOptions = [
  { label: 'Semua', value: 'Semua' },
  { label: 'Layanan Publik', value: 'Layanan Publik' },
  { label: 'Kebijakan & Regulasi', value: 'Kebijakan & Regulasi' },
  { label: 'Panduan Pengguna', value: 'Panduan Pengguna' },
];
