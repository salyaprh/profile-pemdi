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
  {
    label: 'Portofolio',
    to: paths.portfolio,
    isActive: (p) => p === paths.portfolio || p.startsWith(`${paths.portfolio}/`),
  },
  { label: 'Hubungi kami', to: paths.contact, isActive: (p) => p === paths.contact },
];

/** Kolom tautan footer yang tetap; kolom "Kategori portofolio" diambil dari API (Footer.tsx). */
export const footerNavigation = navigationItems.map(({ label, to }) => ({ label, to }));
