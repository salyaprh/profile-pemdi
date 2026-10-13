# Backend profile-pemdi

API untuk CMS profil PEMDI: login admin, pengelolaan konten, dan formulir kontak. Dibangun dengan Laravel 13 dan butuh PHP 8.3 atau lebih baru (versi minimum dikunci lewat `config.platform.php` di `composer.json` agar dependency tetap cocok untuk server dengan PHP 8.3).

Halaman HTML tidak dirender di sini. Situs publik dan panel admin adalah aplikasi React di `../frontend`, dan di produksi keduanya disajikan dari origin yang sama lewat Nginx.

## Menjalankan

```bash
composer setup   # install dependency, salin .env, buat APP_KEY, jalankan migrasi (SQLite)
composer dev     # server API di http://localhost:8000
```

Pemeriksaan kesehatan: `GET /up`.

## Perintah

| Perintah           | Fungsi                                       |
| ------------------ | -------------------------------------------- |
| `composer test`    | Uji PHPUnit (SQLite in-memory)               |
| `composer lint`    | Cek gaya kode dengan Pint (preset Laravel)   |
| `composer format`  | Rapikan gaya kode dengan Pint                |
| `composer analyse` | Analisis statis Larastan (PHPStan level 6)   |
| `composer audit`   | Cek kerentanan dependency                    |

Semua perintah di atas dijalankan CI pada PHP 8.3 (versi minimum) dan versi terbaru.
