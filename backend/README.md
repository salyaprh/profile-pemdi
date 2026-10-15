# Backend profile-pemdi

API untuk CMS profil PEMDI: login admin, pengelolaan konten, dan formulir kontak. Dibangun dengan Laravel 13 dan butuh PHP 8.3 atau lebih baru (versi minimum dikunci lewat `config.platform.php` di `composer.json` agar dependency tetap cocok untuk server dengan PHP 8.3).

Halaman HTML tidak dirender di sini. Situs publik dan panel admin adalah aplikasi React di `../frontend`, dan di produksi keduanya disajikan dari origin yang sama lewat Nginx.

## Menjalankan

```bash
composer setup             # install dependency, salin .env, buat APP_KEY, migrasi (SQLite), storage:link
php artisan db:seed        # konten placeholder + akun demo (akun demo ditolak di produksi)
composer dev               # server API di http://localhost:8000
```

`composer dev` memakai server bawaan PHP (`php -S`) dengan batas unggah 6 MB, bukan `php artisan serve`, karena batas bawaan PHP (2 MB) lebih kecil dari batas unggah gambar CMS (5 MB). Di server produksi atur `upload_max_filesize` ≥ 6M dan `post_max_size` ≥ 8M di `php.ini`, serta `client_max_body_size 8m` di Nginx.

Lalu jalankan frontend (`cd ../frontend && npm run dev`) dan buka `http://localhost:5173/admin`. Vite meneruskan `/api` ke server ini.

Akun demo (lokal saja): `admin@pemdi.test` dan `penulis@pemdi.test`. Kata sandinya ada di `database/seeders/DemoUserSeeder.php` atau diatur lewat `DEMO_USER_PASSWORD` di `.env`.

## Akun dan peran

| Peran       | Hak                                                                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**   | Semua aksi: mengedit artikel apa pun (termasuk yang sudah terbit), menerbitkan, mengembalikan dengan catatan, membatalkan terbit, menghapus/memulihkan artikel, kategori; nanti pesan, pengguna, pengaturan, log aktivitas |
| **Penulis** | Menulis artikel dan mengunggah gambar, mengedit draf miliknya, mengajukan atau menarik pengajuan tinjauan; hanya melihat artikel miliknya                                                                                  |

Aturan lengkapnya ada di `app/Policies/ArticlePolicy.php` (diuji per peran dan status di `tests/Feature/ArticlePolicyTest.php`). Alur status artikel: `draf → ditinjau → terbit`. "Kembalikan" mengubah artikel yang ditinjau menjadi draf dengan catatan dari Admin; "Batalkan terbit" mengembalikan artikel terbit menjadi draf (tanggal terbit pertama tetap disimpan). Hapus memindahkan artikel ke sampah (soft delete); hanya Admin yang dapat memulihkan atau menghapus permanen. Setiap perubahan artikel dan kategori dicatat di log aktivitas.

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

| Metode | Path                                 | Akses           | Fungsi                                                                                                         |
| ------ | ------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/csrf`                          | semua           | Memasang cookie `XSRF-TOKEN` (204)                                                                             |
| GET    | `/api/auth/me`                       | semua           | `{ user }` pengguna yang login, atau `{ user: null }`                                                          |
| POST   | `/api/auth/login`                    | semua           | `{ email, password }` → `{ user }`; 422 bila salah, 429 bila dikunci                                           |
| POST   | `/api/auth/logout`                   | login           | 204                                                                                                            |
| GET    | `/api/admin/dashboard`               | login dan aktif | Jumlah artikel per status; aktivitas terbaru (khusus Admin)                                                    |
| GET    | `/api/admin/articles`                | login dan aktif | Daftar, 15 per halaman. Filter `?status=draf\|ditinjau\|terbit\|sampah&kategori=&cari=&page=`                  |
| POST   | `/api/admin/articles`                | login dan aktif | Membuat draf. Slug dibuat dari judul bila kosong                                                               |
| GET    | `/api/admin/articles/{id}`           | pemilik / Admin | Detail beserta `body_html` dan `can` (aksi yang diizinkan untuk pengguna ini)                                  |
| PUT    | `/api/admin/articles/{id}`           | sesuai policy   | Menyimpan perubahan. Kirim `updated_at` versi yang diedit; 409 bila sudah diubah orang lain                    |
| DELETE | `/api/admin/articles/{id}`           | Admin           | Pindahkan ke sampah                                                                                            |
| POST   | `/api/admin/articles/{id}/restore`   | Admin           | Pulihkan dari sampah                                                                                           |
| DELETE | `/api/admin/articles/{id}/permanent` | Admin           | Hapus permanen (hanya dari sampah)                                                                             |
| POST   | `/api/admin/articles/{id}/{aksi}`    | sesuai policy   | `submit`, `withdraw`, `publish`, `return` (`{ note }` 5–1000 karakter), `unpublish`                            |
| GET    | `/api/admin/categories`              | login dan aktif | Kategori beserta jumlah artikel (termasuk yang di sampah)                                                      |
| POST   | `/api/admin/categories`              | Admin           | `{ name }`; slug dibuat sekali dan tidak berubah saat nama diganti                                             |
| PUT    | `/api/admin/categories/{id}`         | Admin           | Ganti nama                                                                                                     |
| DELETE | `/api/admin/categories/{id}`         | Admin           | 409 bila masih dipakai artikel                                                                                 |
| POST   | `/api/admin/media`                   | login dan aktif | Unggah gambar (`multipart/form-data`, kolom `file`) → `{ data: { url, og_url, width, height } }`; 30 per menit |

Galat dikembalikan sebagai JSON (`message`, dan `errors` per kolom untuk 422). Aksi yang tidak diizinkan dijawab 403 dengan pesan berbahasa Indonesia.

## Isi artikel dan unggahan gambar

- **Penyaring HTML** (`app/Support/ArticleHtmlSanitizer.php`, symfony/html-sanitizer). Isi artikel disaring di server setiap kali disimpan, apa pun yang dikirim browser. Hanya elemen yang bisa dibuat toolbar editor yang diizinkan: `p h2 h3 strong em u s ul ol li blockquote br hr a img`. Tautan hanya `http(s)`, `mailto`, dan path situs ini (tautan `//host` ditolak), selalu diberi `rel="noopener noreferrer"`. Gambar hanya dari folder unggahan sendiri (`/storage/<MEDIA_DIRECTORY>/<uuid>.webp`). Elemen lain dibuang beserta isinya bila berbahaya (`script`, `style`, `iframe`, …) atau dibuka (teksnya dipertahankan) bila hanya format. Diuji dengan korpus payload XSS di `tests/Unit/ArticleHtmlSanitizerTest.php`.
- **Unggah gambar** (`app/Support/MediaStorage.php`, Intervention Image dengan GD). Hanya JPEG, PNG, atau WebP, 200–8000 px, maksimal 5 MB; SVG ditolak. Setiap gambar di-encode ulang menjadi WebP (kualitas 82, metadata EXIF dibuang), diperkecil sampai lebar 1600 px, dan dibuat varian 1200×630 (`-og.webp`) untuk pratinjau tautan. Proses ini juga menetralkan berkas _polyglot_ (gambar yang disisipi kode). Nama berkas diacak (UUID).
- Berkas disimpan di disk `public` (`storage/app/public/<MEDIA_DIRECTORY>`, bawaan `media`) dan dibuka lewat `/storage/...` setelah `php artisan storage:link`. Di Nginx, folder `/storage/` wajib dilayani sebagai berkas statis tanpa eksekusi PHP.

## Perintah

| Perintah           | Fungsi                                     |
| ------------------ | ------------------------------------------ |
| `composer test`    | Uji PHPUnit (SQLite in-memory)             |
| `composer lint`    | Cek gaya kode dengan Pint (preset Laravel) |
| `composer format`  | Rapikan gaya kode dengan Pint              |
| `composer analyse` | Analisis statis Larastan (PHPStan level 6) |
| `composer audit`   | Cek kerentanan dependency                  |

Semua perintah di atas dijalankan CI pada PHP 8.3 (versi minimum) dan versi terbaru. Uji e2e di `../frontend` juga menyalakan backend ini dengan database SQLite sementara dan folder unggahan terpisah `media-e2e` (`../frontend/e2e/start-backend.mjs`).

## Data placeholder

`database/seeders/data/placeholder-content.json` berisi 36 artikel dan 3 kategori dari desain awal situs (sebelumnya tertulis di frontend). Penulisnya akun placeholder yang nonaktif. Ganti dengan konten resmi lewat CMS.
