import {
  IconChartBar,
  IconCoin,
  IconMessageStar,
  IconSchool,
  IconSitemap,
  type Icon,
} from '@tabler/icons-react';
import { paths } from '../lib/router';

export const siteName = 'PEMDI PANRB';

/**
 * Deskripsi bawaan: dipakai sebagai meta deskripsi halaman yang tidak punya deskripsi sendiri dan
 * sebagai tampilan sementara footer. Teks yang tampil di situs diatur Admin di Pengaturan.
 */
export const siteDescription =
  'PEMDI merangkum karya dan inisiatif TDP dalam membangun layanan pemerintah yang terintegrasi, berdampak, dan berpusat pada kebutuhan masyarakat.';

interface NavigationItem {
  label: string;
  to: string;
  /** Menentukan menu aktif berdasarkan pathname saat ini. */
  isActive: (pathname: string) => boolean;
}

// IDDS menyarankan 3-5 menu utama pada header.
export const navigationItems: NavigationItem[] = [
  { label: 'Beranda', to: paths.home, isActive: (p) => p === '/' },
  { label: 'Layanan', to: paths.services, isActive: (p) => p === paths.services },
  {
    label: 'Portofolio',
    to: paths.portfolio,
    isActive: (p) => p === paths.portfolio || p.startsWith(`${paths.portfolio}/`),
  },
  { label: 'Hubungi kami', to: paths.contact, isActive: (p) => p === paths.contact },
];

interface Service {
  /** Jangkar kartu di /layanan (mis. /layanan#evaluasi). */
  id: string;
  /** Nama singkat di menu Layanan. */
  name: string;
  title: string;
  description: string;
  /** Alamat platform. `null` = belum tersedia: layanan tidak tampil di menu maupun halaman. */
  url: string | null;
  icon: Icon;
}

/** Layanan PEMDI di menu Layanan dan halaman /layanan; tiap layanan menaut ke platformnya. */
const allServices: Service[] = [
  {
    id: 'evaluasi',
    name: 'Evaluasi',
    title: 'Evaluasi Kinerja Pemdi',
    description:
      'Platform penilaian terintegrasi untuk mengevaluasi transformasi digital instansi pemerintah secara transparan dan terukur.',
    url: 'https://eval.spbe.go.id',
    icon: IconChartBar,
  },
  {
    id: 'kompetensi',
    name: 'Kompetensi',
    title: 'Kompetensi Digital ASN',
    description:
      'Pembelajaran daring bersama FutureSkills untuk mengembangkan kompetensi digital aparatur sipil negara.',
    url: 'https://asn.futureskills.id',
    icon: IconSchool,
  },
  {
    id: 'arsitektur',
    name: 'Arsitektur',
    title: 'Arsitektur SPBE',
    description:
      'Kerangka acuan nasional untuk proses bisnis, data, aplikasi, infrastruktur, dan keamanan pemerintahan digital.',
    url: 'https://arsitektur.spbe.go.id',
    icon: IconSitemap,
  },
  {
    id: 'ega',
    name: 'Ega Pemdi',
    title: 'Evaluasi Anggaran (EGA) Pemdi',
    description:
      'Pengajuan dan evaluasi anggaran belanja pemerintah digital agar efektif, efisien, dan selaras dengan Arsitektur SPBE.',
    url: 'https://ega-spbe.layanan.go.id',
    icon: IconCoin,
  },
  {
    id: 'survei-kepuasan',
    name: 'Survei Kepuasan',
    title: 'Survei Kepuasan',
    description:
      'Sampaikan penilaian Anda terhadap layanan PEMDI untuk membantu kami terus berbenah.',
    // Menunggu alamat resmi dari mentor; isi di sini dan layanan tampil otomatis.
    url: null,
    icon: IconMessageStar,
  },
];

export const services = allServices.filter(
  (service): service is Service & { url: string } => service.url !== null,
);

/** Kolom tautan footer yang tetap; kolom "Kategori portofolio" diambil dari API (Footer.tsx). */
export const footerNavigation = navigationItems.map(({ label, to }) => ({ label, to }));
