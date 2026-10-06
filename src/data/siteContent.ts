import { paths } from '../lib/router';
import { categoryOptions } from './articlesData';

export const siteName = 'PEMDI PANRB';

export const siteDescription =
  'PEMDI merangkum karya dan inisiatif TDP dalam membangun layanan pemerintah yang terintegrasi, berdampak, dan berpusat pada kebutuhan masyarakat.';

export interface NavigationItem {
  label: string;
  to: string;
  /** Menentukan menu aktif berdasarkan pathname saat ini. */
  isActive: (pathname: string) => boolean;
}

// IDDS menyarankan 3-5 menu utama pada header.
export const navigationItems: NavigationItem[] = [
  { label: 'Beranda', to: paths.home, isActive: (p) => p === '/' },
  {
    label: 'Portofolio',
    to: paths.portfolio,
    isActive: (p) => p === paths.portfolio || p.startsWith(`${paths.portfolio}/`),
  },
  { label: 'Hubungi kami', to: paths.contact, isActive: (p) => p === paths.contact },
];

export const footerColumns: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Navigasi',
    links: navigationItems.map(({ label, to }) => ({ label, to })),
  },
  {
    title: 'Kategori portofolio',
    links: categoryOptions
      .filter((option) => option.value !== 'Semua')
      .map((option) => ({
        label: option.label,
        to: `${paths.portfolio}?kategori=${encodeURIComponent(option.value)}`,
      })),
  },
];

// TODO: angka berikut masih placeholder dari desain awal. Ganti dengan data resmi PEMDI.
export const heroStats = [
  { value: '12+', label: 'Inisiatif transformasi' },
  { value: '28', label: 'Layanan terdigitalisasi' },
  { value: '100%', label: 'Berorientasi dampak' },
];
