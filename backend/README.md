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

| Peran       | Hak                                                                                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**   | Semua aksi: mengedit artikel apa pun (termasuk yang sudah terbit), menerbitkan, mengembalikan dengan catatan, membatalkan terbit, menghapus/memulihkan artikel, kategori, pesan masuk, pengguna, pengaturan situs, log aktivitas |
| **Penulis** | Menulis artikel dan mengunggah gambar, mengedit draf miliknya, mengajukan atau menarik pengajuan tinjauan; hanya melihat artikel miliknya                                                                                        |

Aturan lengkapnya ada di `app/Policies/ArticlePolicy.php` (diuji per peran dan status di `tests/Feature/ArticlePolicyTest.php`). Alur status artikel: `draf → ditinjau → terbit`. "Kembalikan" mengubah artikel yang ditinjau menjadi draf dengan catatan dari Admin; "Batalkan terbit" mengembalikan artikel terbit menjadi draf (tanggal terbit pertama tetap disimpan). Hapus memindahkan artikel ke sampah (soft delete); hanya Admin yang dapat memulihkan atau menghapus permanen. Setiap perubahan artikel, kategori, pengguna, dan pengaturan dicatat di log aktivitas.

Tidak ada pendaftaran publik. Admin pertama dibuat di server dengan:

```bash
php artisan pemdi:buat-admin
```

Kata sandi ditanyakan secara tersembunyi (tidak lewat argumen, agar tidak tersimpan di riwayat shell) dan wajib minimal 12 karakter dengan huruf besar, huruf kecil, dan angka.

Akun berikutnya dibuat Admin di panel (**Pengguna**). Akun tidak pernah dihapus (riwayat penulis artikel harus utuh): akses dicabut dengan menonaktifkannya, dan sesi yang sedang berjalan langsung berakhir. Pengaman: Admin tidak dapat menurunkan atau menonaktifkan akunnya sendiri, dan Admin aktif terakhir tidak dapat diturunkan atau dinonaktifkan (409). Email disimpan dalam huruf kecil dan harus unik.

### Kata sandi sementara

CMS tidak mengirim email, jadi kata sandi akun baru dan hasil "Atur ulang kata sandi" ditetapkan Admin dan disampaikan langsung. Keduanya **sementara**: kolom `users.must_change_password` bernilai true sampai pemiliknya menggantinya sendiri (`PUT /api/auth/password`). Selama itu seluruh endpoint `/api/admin/*` dijawab 403 (middleware `password.changed`), dan frontend hanya membuka halaman Akun saya. Mengganti atau mengatur ulang kata sandi mengakhiri sesi akun itu di perangkat lain (middleware `AuthenticateSession` membandingkan hash kata sandi di sesi); sesi yang mengganti tetap berjalan. Admin tidak dapat mengatur ulang kata sandinya sendiri dari daftar pengguna (pakai Akun saya, yang meminta kata sandi saat ini).

## Keamanan login

- **Sesi cookie, satu origin.** Rute `/api` memakai middleware `web` (lihat `bootstrap/app.php`): cookie sesi HttpOnly + SameSite=Lax dan token CSRF (header `X-XSRF-TOKEN` dari cookie `XSRF-TOKEN`). Tidak ada token di localStorage dan tidak perlu CORS. Laravel Sanctum tidak dipakai karena tidak dibutuhkan untuk aplikasi satu origin.
- **Pesan seragam.** Email salah dan kata sandi salah dijawab sama, dan email yang tidak terdaftar tetap memverifikasi hash pengganti agar waktu respons tidak membocorkan keberadaan akun.
- **Rate limit.** Maksimal 5 kali gagal per email+IP dan 20 kali gagal per IP per menit (`app/Http/Requests/LoginRequest.php`). Login berhasil mengatur ulang hitungannya.
- **Sesi.** ID sesi diganti setiap login. Sesi berakhir setelah 60 menit tanpa aktivitas (`SESSION_LIFETIME`). Akun yang dinonaktifkan langsung kehilangan sesinya (middleware `active`).
- **Respons tidak di-cache.** Semua respons `/api/auth` dan `/api/admin` memakai `Cache-Control: no-store, private`, termasuk respons 401.
- **Jejak audit.** Login, gagal login, logout, perubahan akun dan kata sandi (tanpa nilainya), serta semua aksi admin dicatat di tabel `activity_logs` beserta IP-nya. Kode aksinya didaftarkan di `app/Enums/ActivityAction.php` (tiap aksi punya kelompok untuk filter halaman Aktivitas); catatan dihapus otomatis setelah 24 bulan (`ACTIVITY_RETENTION_MONTHS`) oleh `model:prune`.
- **Akses admin aman secara bawaan.** Semua rute `/api/admin/*` memakai `auth`, `active`, dan `password.changed`; rute khusus Admin memakai middleware `admin`, yang berjalan _sebelum_ model rute dicari sehingga Penulis tidak bisa menebak id lewat perbedaan 404/403. `tests/Feature/AdminRoutesSecurityTest.php` memeriksa setiap rute `/api/admin` (tamu = 401, Penulis = 403 kecuali yang didaftarkan di `OPEN_TO_PENULIS`), jadi rute baru yang lupa dijaga membuat uji gagal.
- **Batas laju.** Login (5 gagal per email+IP, 20 per IP per menit), ganti kata sandi (6 per menit), atur ulang kata sandi (20 per menit), unggah gambar (30 per menit), formulir kontak (5 per 10 menit per IP), API publik (120 per menit per IP). Di balik reverse proxy atau CDN, isi `TRUSTED_PROXIES` (alamat proxy dipisah koma, atau `*`) agar IP pengunjung dibaca dari `X-Forwarded-For`; tanpa itu semua pengunjung tampak berasal dari satu IP dan batas laju berlaku untuk seluruh situs sekaligus. Nginx + PHP-FPM langsung tidak membutuhkannya.
- **Produksi:** wajib HTTPS dan `SESSION_SECURE_COOKIE=true`.

## API

### Situs publik (tanpa sesi)

Rute di `routes/public.php` memakai grup middleware `api`: tanpa sesi, tanpa cookie, dan tanpa CSRF, jadi pengunjung situs tidak pernah mendapat cookie. Hanya artikel berstatus terbit (dan tanggal terbitnya sudah lewat) yang keluar dari sini; email penulis, status, dan catatan tinjauan tidak pernah ikut. Kontraknya ada di `../frontend/src/services/content.ts`.

| Metode | Path                   | Fungsi                                                                                                                                                              |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/articles`        | `{ data, meta }`, terbaru lebih dulu. `?kategori=<slug>&cari=<kata>&page=<n>&per_page=<1–24>` (bawaan 12). Pencarian di judul dan ringkasan, tidak peka huruf besar |
| GET    | `/api/articles/{slug}` | `{ data, related }`: artikel beserta `body_html`, `source`, `reading_minutes`, dan maksimal 3 artikel terbit sekategori. 404 bila tidak ada atau belum terbit       |
| GET    | `/api/categories`      | Kategori yang punya artikel terbit, dengan jumlahnya                                                                                                                |
| GET    | `/api/site`            | Pengaturan situs untuk beranda dan footer: deskripsi, 3 angka, kontak, media sosial (nilai bawaan bila belum diatur)                                                |
| GET    | `/api/contact/token`   | `{ token }`: waktu formulir kontak dibuka, terenkripsi                                                                                                              |
| POST   | `/api/contact`         | Pesan formulir "Hubungi kami" → 202. Lihat [Formulir kontak](#formulir-kontak)                                                                                      |
| GET    | `/sitemap.xml`         | Halaman statis + semua artikel terbit, URL absolut dari `APP_URL` (di produksi wajib alamat situs)                                                                  |

Respons GET publik memakai `Cache-Control: no-cache, public` + `ETag`: browser selalu memeriksa ulang (artikel yang baru terbit langsung terlihat), dan respons yang tidak berubah dijawab 304. Batasnya 120 permintaan per IP per menit (`PUBLIC_API_RATE_LIMIT`). CORS dimatikan (`config/cors.php`) karena semua permintaan datang dari origin yang sama.

### Panel admin (sesi + CSRF)

| Metode | Path                                 | Akses           | Fungsi                                                                                                               |
| ------ | ------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/csrf`                          | semua           | Memasang cookie `XSRF-TOKEN` (204)                                                                                   |
| GET    | `/api/auth/me`                       | semua           | `{ user }` pengguna yang login, atau `{ user: null }`                                                                |
| PUT    | `/api/auth/password`                 | login           | `{ current_password, password, password_confirmation }` → `{ user }`; sesi lain berakhir; 6 per menit                |
| POST   | `/api/auth/login`                    | semua           | `{ email, password }` → `{ user }`; 422 bila salah, 429 bila dikunci                                                 |
| POST   | `/api/auth/logout`                   | login           | 204                                                                                                                  |
| GET    | `/api/admin/dashboard`               | login dan aktif | Jumlah artikel per status; khusus Admin: aktivitas terbaru dan `unread_messages`                                     |
| GET    | `/api/admin/articles`                | login dan aktif | Daftar, 15 per halaman. Filter `?status=draf\|ditinjau\|terbit\|sampah&kategori=&cari=&page=`                        |
| POST   | `/api/admin/articles`                | login dan aktif | Membuat draf. Slug dibuat dari judul bila kosong                                                                     |
| GET    | `/api/admin/articles/{id}`           | pemilik / Admin | Detail beserta `body_html` dan `can` (aksi yang diizinkan untuk pengguna ini)                                        |
| PUT    | `/api/admin/articles/{id}`           | sesuai policy   | Menyimpan perubahan. Kirim `updated_at` versi yang diedit; 409 bila sudah diubah orang lain                          |
| DELETE | `/api/admin/articles/{id}`           | Admin           | Pindahkan ke sampah                                                                                                  |
| POST   | `/api/admin/articles/{id}/restore`   | Admin           | Pulihkan dari sampah                                                                                                 |
| DELETE | `/api/admin/articles/{id}/permanent` | Admin           | Hapus permanen (hanya dari sampah)                                                                                   |
| POST   | `/api/admin/articles/{id}/{aksi}`    | sesuai policy   | `submit`, `withdraw`, `publish`, `return` (`{ note }` 5–1000 karakter), `unpublish`                                  |
| GET    | `/api/admin/categories`              | login dan aktif | Kategori beserta jumlah artikel (termasuk yang di sampah)                                                            |
| POST   | `/api/admin/categories`              | Admin           | `{ name }`; slug dibuat sekali dan tidak berubah saat nama diganti                                                   |
| PUT    | `/api/admin/categories/{id}`         | Admin           | Ganti nama                                                                                                           |
| DELETE | `/api/admin/categories/{id}`         | Admin           | 409 bila masih dipakai artikel                                                                                       |
| POST   | `/api/admin/media`                   | login dan aktif | Unggah gambar (`multipart/form-data`, kolom `file`) → `{ data: { url, og_url, width, height } }`; 30 per menit       |
| GET    | `/api/admin/messages`                | Admin           | Kotak masuk, 20 per halaman, terbaru lebih dulu. `?status=belum-dibaca&page=`; potongan isi saja                     |
| GET    | `/api/admin/messages/{id}`           | Admin           | Detail pesan (termasuk ponsel dan isi lengkap). Tidak otomatis menandai dibaca                                       |
| PATCH  | `/api/admin/messages/{id}`           | Admin           | `{ read: boolean }`: tandai sudah/belum dibaca                                                                       |
| DELETE | `/api/admin/messages/{id}`           | Admin           | Hapus permanen; log aktivitas hanya mencatat nomor pesan                                                             |
| GET    | `/api/admin/users`                   | Admin           | Daftar, 20 per halaman. `?status=aktif\|nonaktif&cari=<nama atau email>&page=`                                       |
| POST   | `/api/admin/users`                   | Admin           | `{ name, email, role, password }` → 201; akun baru wajib mengganti kata sandi                                        |
| GET    | `/api/admin/users/{id}`              | Admin           | Detail beserta jumlah artikel dan waktu masuk terakhir                                                               |
| PUT    | `/api/admin/users/{id}`              | Admin           | `{ name, email, role, is_active }`; 422 untuk akun sendiri (peran/status), 409 bila Admin aktif terakhir             |
| POST   | `/api/admin/users/{id}/password`     | Admin           | `{ password }`: kata sandi sementara baru; 422 untuk akun sendiri                                                    |
| GET    | `/api/admin/settings`                | Admin           | Pengaturan situs (bentuknya sama dengan `/api/site`)                                                                 |
| PUT    | `/api/admin/settings`                | Admin           | Deskripsi, tepat 3 angka beranda, kontak, tautan media sosial (https saja)                                           |
| GET    | `/api/admin/activity`                | Admin           | Log aktivitas, 30 per halaman, terbaru lebih dulu. `?kelompok=login\|artikel\|kategori\|pesan\|pengguna\|pengaturan` |

Galat dikembalikan sebagai JSON (`message`, dan `errors` per kolom untuk 422). Aksi yang tidak diizinkan dijawab 403 dengan pesan berbahasa Indonesia.

## Isi artikel dan unggahan gambar

- **Penyaring HTML** (`app/Support/ArticleHtmlSanitizer.php`, symfony/html-sanitizer). Isi artikel disaring di server setiap kali disimpan, apa pun yang dikirim browser. Hanya elemen yang bisa dibuat toolbar editor yang diizinkan: `p h2 h3 strong em u s ul ol li blockquote br hr a img`. Tautan hanya `http(s)`, `mailto`, dan path situs ini (tautan `//host` ditolak), selalu diberi `rel="noopener noreferrer"`. Gambar hanya dari folder unggahan sendiri (`/storage/<MEDIA_DIRECTORY>/<uuid>.webp`). Elemen lain dibuang beserta isinya bila berbahaya (`script`, `style`, `iframe`, …) atau dibuka (teksnya dipertahankan) bila hanya format. Diuji dengan korpus payload XSS di `tests/Feature/ArticleHtmlSanitizerTest.php`.
- **Unggah gambar** (`app/Support/MediaStorage.php`, Intervention Image dengan GD). Hanya JPEG, PNG, atau WebP, 200–8000 px, maksimal 5 MB; SVG ditolak. Setiap gambar di-encode ulang menjadi WebP (kualitas 82, metadata EXIF dibuang), diperkecil sampai lebar 1600 px, dan dibuat varian 1200×630 (`-og.webp`) untuk pratinjau tautan. Proses ini juga menetralkan berkas _polyglot_ (gambar yang disisipi kode). Nama berkas diacak (UUID).
- Berkas disimpan di disk `public` (`storage/app/public/<MEDIA_DIRECTORY>`, bawaan `media`) dan dibuka lewat `/storage/...` setelah `php artisan storage:link`. Di Nginx, folder `/storage/` wajib dilayani sebagai berkas statis tanpa eksekusi PHP.

## Formulir kontak

- **Data pribadi terenkripsi.** Nama, email, ponsel, subjek, dan isi pesan disimpan dengan cast `encrypted` (AES-256 dengan `APP_KEY`). Alamat IP tidak disimpan. Akibatnya: **`APP_KEY` wajib dicadangkan**; tanpa kunci itu pesan lama tidak bisa dibaca. Saat mengganti kunci, pindahkan kunci lama ke `APP_PREVIOUS_KEYS`.
- **Masa simpan.** Pesan dihapus otomatis setelah 12 bulan (`CONTACT_RETENTION_MONTHS`) oleh `model:prune` yang dijadwalkan harian di `routes/console.php`. Butuh cron di server: `* * * * * cd /path/backend && php artisan schedule:run >> /dev/null 2>&1`.
- **Anti-spam tanpa CAPTCHA.** Batas 5 pesan per IP per 10 menit (`CONTACT_RATE_LIMIT`); kolom jebakan `kolom_khusus` yang tersembunyi dari pengguna; dan token waktu dari `/api/contact/token`. Pesan yang mengisi kolom jebakan dijawab 202 seperti biasa tetapi tidak disimpan. Pesan yang dikirim kurang dari 3 detik setelah token diambil (`CONTACT_MIN_SECONDS`), dengan token yang dipalsukan, atau dengan token berumur lebih dari 2 jam ditolak 422 pada kolom `token` (bukan dibuang diam-diam: pengunjung sungguhan dengan isi-otomatis browser bisa mengirim dalam hitungan detik); frontend mengambil token baru dan pengiriman ulang berhasil.
- **Aturan validasi sama dengan frontend.** `app/Http/Requests/ContactMessageRequest.php` dan `../frontend/src/lib/validators.ts` diuji dengan kasus yang sama (`../frontend/src/lib/contact-validation-cases.json`, lihat `tests/Feature/ContactValidationParityTest.php`), termasuk pesan galatnya.
- Di balik reverse proxy, batas per IP hanya benar bila proxy dipercaya (`TrustProxies`); dengan Nginx + PHP-FPM langsung, `REMOTE_ADDR` sudah IP pengunjung.

## Perintah

| Perintah           | Fungsi                                     |
| ------------------ | ------------------------------------------ |
| `composer test`    | Uji PHPUnit (SQLite in-memory)             |
| `composer lint`    | Cek gaya kode dengan Pint (preset Laravel) |
| `composer format`  | Rapikan gaya kode dengan Pint              |
| `composer analyse` | Analisis statis Larastan (PHPStan level 6) |
| `composer audit`   | Cek kerentanan dependency                  |

Jadwal (`php artisan schedule:list`): `model:prune` harian untuk pesan kontak dan log aktivitas yang melewati masa simpan.

Semua perintah di atas dijalankan CI pada PHP 8.3 (versi minimum) dan versi terbaru. Uji e2e di `../frontend` juga menyalakan backend ini dengan database SQLite sementara dan folder unggahan terpisah `media-e2e` (`../frontend/e2e/start-backend.mjs`).

## Pengaturan situs

Disimpan sebagai satu baris `site` di tabel `settings` (`app/Support/SiteSettings.php`). Nilai bawaan ada di kode, jadi tabel kosong tetap menghasilkan situs yang utuh, dan nilai tersimpan yang rusak jatuh ke nilai bawaan. Angka dan deskripsi bawaan masih placeholder dari desain awal: ganti dengan data resmi lewat halaman Pengaturan. Hanya kunci yang dikenal yang disimpan, tautan media sosial wajib `https://`, dan semua teks ditampilkan sebagai teks biasa (bukan HTML).

## Data placeholder

`database/seeders/data/placeholder-content.json` berisi 36 artikel dan 3 kategori dari desain awal situs (sebelumnya tertulis di frontend). Penulisnya akun placeholder yang nonaktif. Ganti dengan konten resmi lewat CMS.
