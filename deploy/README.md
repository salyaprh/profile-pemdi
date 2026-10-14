# Memasang di server

Panduan memasang CMS di server Linux dengan Nginx dan PHP-FPM. Konfigurasi Nginx-nya ada di [`nginx.conf`](nginx.conf). Panduan dan konfigurasi ini **belum diuji di server nyata**: jalankan `nginx -t`, ikuti daftar pemeriksaan di bawah, dan sesuaikan dengan kebijakan tim infrastruktur.

## Kebutuhan

| Komponen   | Versi / catatan                                                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PHP        | 8.3 atau lebih baru, lewat PHP-FPM. Ekstensi: `ctype curl dom fileinfo gd mbstring openssl pdo tokenizer xml` dan driver database (`pdo_mysql` / `pdo_pgsql`). `gd` harus mendukung **WebP** (semua gambar unggahan dikonversi ke WebP). |
| Database   | MySQL 8 / MariaDB 10.6+ / PostgreSQL 14+ (SQLite hanya untuk pengembangan).                                                                                                                                                              |
| Web server | Nginx. Header keamanan, pembatas ukuran unggahan, dan pembagian jalur frontend/backend ada di `nginx.conf`.                                                                                                                              |
| Composer   | 2.x, untuk memasang dependency backend.                                                                                                                                                                                                  |
| Node.js    | 22.12+, **hanya untuk membangun frontend**. Boleh dibangun di laptop atau CI lalu `dist/` disalin ke server; server tidak perlu Node.                                                                                                    |
| HTTPS      | Wajib. Cookie sesi hanya dikirim lewat HTTPS dan header HSTS dipasang.                                                                                                                                                                   |

Susunan folder yang diasumsikan `nginx.conf`:

```
/var/www/pemdi/backend         Laravel (hanya public/index.php yang dijalankan PHP)
/var/www/pemdi/frontend/dist   hasil npm run build
```

## Pemasangan pertama

1. **Ambil kode** ke `/var/www/pemdi`.
2. **Backend**:

   ```bash
   cd /var/www/pemdi/backend
   composer install --no-dev --optimize-autoloader
   cp .env.example .env
   php artisan key:generate
   ```

   Edit `.env` (lihat tabel di bawah), lalu:

   ```bash
   php artisan migrate --force
   php artisan pemdi:buat-admin     # akun Admin pertama; kata sandi ditanyakan secara tersembunyi
   php artisan optimize             # cache konfigurasi, rute, dan tampilan
   ```

   Folder `storage/` dan `bootstrap/cache/` harus bisa ditulis oleh pengguna PHP-FPM (mis. `www-data`). Jangan jalankan `db:seed`: seeder hanya berisi 36 artikel placeholder, dan kategori dibuat Admin dari panel.

3. **Frontend**:

   ```bash
   cd /var/www/pemdi/frontend
   npm ci
   VITE_SITE_URL=https://pemdi.example.go.id npm run build
   ```

   `VITE_SITE_URL` (alamat situs tanpa garis miring di akhir) mengaktifkan canonical, `og:url`, dan baris Sitemap di `robots.txt`. Nilainya tertanam di bundle, jadi bangun ulang bila domain berubah.

4. **Nginx**: salin `nginx.conf` ke `sites-available`, ganti `server_name`, jalur sertifikat, dan jalur soket PHP-FPM, aktifkan, lalu `nginx -t && systemctl reload nginx`.

5. **Cron** (wajib; menghapus pesan kontak dan log yang melewati masa simpan serta gambar yang tidak terpakai):

   ```
   * * * * * cd /var/www/pemdi/backend && php artisan schedule:run >> /dev/null 2>&1
   ```

## Isi `.env` produksi

| Variabel                | Nilai                                                                                                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_ENV`, `APP_DEBUG`  | `production` dan `false`. `APP_DEBUG=true` membocorkan isi `.env` dan jejak kode ke pengunjung.                                                                                                                                                                             |
| `APP_URL`               | Alamat situs persis seperti di browser, mis. `https://pemdi.example.go.id`. Dipakai sitemap dan pratinjau tautan.                                                                                                                                                           |
| `DB_*`                  | Koneksi database (`DB_CONNECTION=mysql` atau `pgsql`, host, nama, pengguna, kata sandi). Beri pengguna database hak seperlunya.                                                                                                                                             |
| `SESSION_SECURE_COOKIE` | `true`.                                                                                                                                                                                                                                                                     |
| `SESSION_DOMAIN`        | Kosong/`null` (cookie hanya untuk domain situs).                                                                                                                                                                                                                            |
| `LOG_LEVEL`             | `warning`.                                                                                                                                                                                                                                                                  |
| `TRUSTED_PROXIES`       | Kosong bila Nginx langsung menerima pengunjung. Bila ada load balancer/CDN di depan Nginx, isi alamatnya; tanpa itu semua pengunjung tampak berasal dari satu IP dan batas laju (login, formulir kontak) berlaku untuk seluruh situs. Di Nginx juga pasang modul `real_ip`. |
| `FRONTEND_INDEX`        | Hanya bila frontend tidak di `../frontend/dist/index.html` relatif terhadap backend.                                                                                                                                                                                        |
| `DEMO_USER_PASSWORD`    | **Jangan diisi.** Akun demo tidak pernah dibuat di produksi.                                                                                                                                                                                                                |

Atur juga `upload_max_filesize=6M` dan `post_max_size=8M` di `php.ini` PHP-FPM (gambar maksimal 5 MB; Nginx menolak body di atas 8 MB).

## Pembaruan

```bash
cd /var/www/pemdi && git pull
cd backend && composer install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan optimize
cd ../frontend && npm ci && VITE_SITE_URL=https://pemdi.example.go.id npm run build
sudo systemctl reload php8.3-fpm        # mengosongkan OPcache
```

## Cadangan

Yang harus dicadangkan rutin dan diuji pemulihannya:

- **Database** (dump penuh).
- **`backend/storage/app/public/`**: semua gambar unggahan.
- **`backend/.env`, terutama `APP_KEY`**: pesan kontak dan kolom terenkripsi lain hanya bisa dibaca dengan kunci ini. Simpan di tempat terpisah dari cadangan database; kehilangan kunci berarti pesan tersimpan tidak bisa dibuka lagi.

## Pemeriksaan setelah pemasangan

1. `curl -sI https://<domain>/` memuat `Content-Security-Policy`, `Strict-Transport-Security`, dan `X-Content-Type-Options`. Periksa juga di https://securityheaders.com.
2. `curl -s https://<domain>/api/articles` mengembalikan JSON, dan `https://<domain>/up` menjawab 200.
3. `https://<domain>/.env` dan `https://<domain>/storage/../.env` menjawab 404.
4. `curl -s https://<domain>/portfolio/<slug-artikel-terbit>` memuat `og:title` dan `og:image` artikel itu. Lalu tempel tautannya di WhatsApp untuk melihat pratinjau.
5. Masuk di `/admin`, buat kategori, tulis dan terbitkan artikel dengan gambar, lalu pastikan tampil di situs publik.
6. Kirim formulir kontak, lalu buka kotak masuk Admin.
7. `php artisan schedule:list` menampilkan `model:prune` dan `pemdi:bersihkan-media`.

## Yang perlu dipastikan ke tim infrastruktur

- OS dan web server yang dipakai (bila bukan Nginx, `nginx.conf` perlu diterjemahkan).
- Versi PHP dan ekstensi yang tersedia (terutama `gd` dengan WebP).
- Jenis dan versi database, serta siapa yang membuatnya.
- Domain, sertifikat HTTPS, dan apakah ada load balancer/CDN di depan Nginx (menentukan `TRUSTED_PROXIES`).
- SMTP: saat ini aplikasi tidak mengirim email (kata sandi diatur Admin), jadi tidak wajib.
- Kebijakan cadangan dan masa simpan data pribadi (pesan kontak 12 bulan, log aktivitas 24 bulan, dapat diubah lewat `.env`).
