# Backend profile-pemdi

API untuk CMS profil PEMDI: login admin, pengelolaan konten, dan formulir kontak. Dibangun dengan Laravel 13 dan butuh PHP 8.3 atau lebih baru (versi minimum dikunci lewat `config.platform.php` di `composer.json` agar dependency tetap cocok untuk server dengan PHP 8.3).

Halaman HTML tidak dirender di sini. Situs publik dan panel admin adalah aplikasi React di `../frontend`, dan di produksi keduanya disajikan dari origin yang sama lewat Nginx.

## Menjalankan

```bash
composer setup             # install dependency, salin .env, buat APP_KEY, jalankan migrasi (SQLite)
php artisan db:seed        # konten placeholder + akun demo (akun demo ditolak di produksi)
composer dev               # server API di http://localhost:8000
```

Lalu jalankan frontend (`cd ../frontend && npm run dev`) dan buka `http://localhost:5173/admin`. Vite meneruskan `/api` ke server ini.

Akun demo (lokal saja): `admin@pemdi.test` dan `penulis@pemdi.test`. Kata sandinya ada di `database/seeders/DemoUserSeeder.php` atau diatur lewat `DEMO_USER_PASSWORD` di `.env`.

## Akun dan peran

| Peran       | Hak                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| **Admin**   | Semua aksi: menerbitkan, mengembalikan dengan catatan, menghapus/memulihkan artikel, kategori, pesan, pengguna, pengaturan, log aktivitas |
| **Penulis** | Menulis dan mengedit draf miliknya, mengajukan atau menarik pengajuan tinjauan                              |

Aturan lengkapnya ada di `app/Policies/ArticlePolicy.php` (diuji per peran dan status di `tests/Feature/ArticlePolicyTest.php`). Alur status artikel: `draf → ditinjau → terbit`.

Tidak ada pendaftaran publik. Admin pertama dibuat di server dengan:

```bash
php artisan pemdi:buat-admin
```

Kata sandi ditanyakan secara tersembunyi (tidak lewat argumen, agar tidak tersimpan di riwayat shell) dan wajib minimal 12 karakter dengan huruf besar, huruf kecil, dan angka.

## Keamanan login

- **Sesi cookie, satu origin.** Rute `/api` memakai middleware `web` (lihat `bootstrap/app.php`): cookie sesi HttpOnly + SameSite=Lax dan token CSRF (header `X-XSRF-TOKEN` dari cookie `XSRF-TOKEN`). Tidak ada token di localStorage dan tidak perlu CORS. Laravel Sanctum tidak dipakai karena tidak dibutuhkan untuk aplikasi satu origin.
- **Pesan seragam.** Email salah dan kata sandi salah dijawab sama, dan email yang tidak terdaftar tetap memverifikasi hash pengganti agar waktu respons tidak membocorkan keberadaan akun.
- **Rate limit.** Maksimal 5 kali gagal per email+IP dan 20 kali gagal per IP per menit (`app/Http/Requests/LoginRequest.php`). Login berhasil mengatur ulang hitungannya.
- **Sesi.** ID sesi diganti setiap login. Sesi berakhir setelah 60 menit tanpa aktivitas (`SESSION_LIFETIME`). Akun yang dinonaktifkan langsung kehilangan sesinya (middleware `active`).
- **Respons tidak di-cache.** Semua respons `/api/auth` dan `/api/admin` memakai `Cache-Control: no-store, private`, termasuk respons 401.
- **Jejak audit.** Login, gagal login, logout, dan pembuatan akun dicatat di tabel `activity_logs` beserta IP-nya.
- **Produksi:** wajib HTTPS dan `SESSION_SECURE_COOKIE=true`.

## API

| Metode | Path                   | Akses           | Fungsi                                                         |
| ------ | ---------------------- | --------------- | -------------------------------------------------------------- |
| GET    | `/api/csrf`            | semua           | Memasang cookie `XSRF-TOKEN` (204)                             |
| GET    | `/api/auth/me`         | semua           | `{ user }` pengguna yang login, atau `{ user: null }`          |
| POST   | `/api/auth/login`      | semua           | `{ email, password }` → `{ user }`; 422 bila salah, 429 bila dikunci |
| POST   | `/api/auth/logout`     | login           | 204                                                            |
| GET    | `/api/admin/dashboard` | login dan aktif | Jumlah artikel per status; aktivitas terbaru (khusus Admin)    |

Galat dikembalikan sebagai JSON (`message`, dan `errors` per kolom untuk 422).

## Perintah

| Perintah           | Fungsi                                       |
| ------------------ | -------------------------------------------- |
| `composer test`    | Uji PHPUnit (SQLite in-memory)               |
| `composer lint`    | Cek gaya kode dengan Pint (preset Laravel)   |
| `composer format`  | Rapikan gaya kode dengan Pint                |
| `composer analyse` | Analisis statis Larastan (PHPStan level 6)   |
| `composer audit`   | Cek kerentanan dependency                    |

Semua perintah di atas dijalankan CI pada PHP 8.3 (versi minimum) dan versi terbaru. Uji e2e di `../frontend` juga menyalakan backend ini dengan database SQLite sementara (`../frontend/e2e/start-backend.mjs`).

## Data placeholder

`database/seeders/data/placeholder-content.json` berisi 36 artikel dan 3 kategori dari desain awal situs (sebelumnya tertulis di frontend). Penulisnya akun placeholder yang nonaktif. Ganti dengan konten resmi lewat CMS.
