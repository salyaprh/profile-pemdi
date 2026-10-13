<?php

namespace App\Enums;

/**
 * Semua aksi yang dicatat di log aktivitas (ActivityLog::record). Kodenya disimpan di kolom
 * `action` dan tidak boleh diganti nilainya setelah ada catatan lama; tambahkan kasus baru di sini
 * beserta kelompoknya, agar muncul di filter halaman Aktivitas.
 */
enum ActivityAction: string
{
    case Login = 'login';
    case LoginGagal = 'login_gagal';
    case LoginDitolak = 'login_ditolak';
    case Logout = 'logout';
    case KataSandiDiganti = 'kata_sandi_diganti';

    case ArtikelDibuat = 'artikel_dibuat';
    case ArtikelDiperbarui = 'artikel_diperbarui';
    case ArtikelDiajukan = 'artikel_diajukan';
    case ArtikelDitarik = 'artikel_ditarik';
    case ArtikelDiterbitkan = 'artikel_diterbitkan';
    case ArtikelDikembalikan = 'artikel_dikembalikan';
    case ArtikelDibatalkanTerbit = 'artikel_dibatalkan_terbit';
    case ArtikelDihapus = 'artikel_dihapus';
    case ArtikelDipulihkan = 'artikel_dipulihkan';
    case ArtikelDihapusPermanen = 'artikel_dihapus_permanen';
    case MediaDiunggah = 'media_diunggah';

    case KategoriDibuat = 'kategori_dibuat';
    case KategoriDiperbarui = 'kategori_diperbarui';
    case KategoriDihapus = 'kategori_dihapus';

    case PesanDihapus = 'pesan_dihapus';

    case PenggunaDibuat = 'pengguna_dibuat';
    case PenggunaDiperbarui = 'pengguna_diperbarui';
    case PenggunaSandiDiaturUlang = 'pengguna_sandi_diatur_ulang';

    case PengaturanDiperbarui = 'pengaturan_diperbarui';

    public function group(): ActivityGroup
    {
        return match ($this) {
            self::Login, self::LoginGagal, self::LoginDitolak, self::Logout => ActivityGroup::Login,
            self::ArtikelDibuat, self::ArtikelDiperbarui, self::ArtikelDiajukan, self::ArtikelDitarik,
            self::ArtikelDiterbitkan, self::ArtikelDikembalikan, self::ArtikelDibatalkanTerbit,
            self::ArtikelDihapus, self::ArtikelDipulihkan, self::ArtikelDihapusPermanen,
            self::MediaDiunggah => ActivityGroup::Artikel,
            self::KategoriDibuat, self::KategoriDiperbarui, self::KategoriDihapus => ActivityGroup::Kategori,
            self::PesanDihapus => ActivityGroup::Pesan,
            self::PenggunaDibuat, self::PenggunaDiperbarui, self::PenggunaSandiDiaturUlang,
            self::KataSandiDiganti => ActivityGroup::Pengguna,
            self::PengaturanDiperbarui => ActivityGroup::Pengaturan,
        };
    }
}
