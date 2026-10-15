# Pesan untuk tim infrastruktur PANRB

Siap disalin dan dikirim. Sesuaikan salam dan nama pengirim.

---

**Perihal: Kebutuhan server untuk aplikasi CMS PEMDI**

Yth. Tim Infrastruktur,

Kami sedang menyiapkan CMS untuk situs profil PEMDI (pengelolaan artikel, kategori, pesan kontak, dan pengguna) agar dapat dipasang di server PANRB. Aplikasi terdiri dari frontend statis (React) dan API Laravel, disajikan dari satu domain lewat Nginx dan PHP-FPM. Panduan pemasangan dan contoh konfigurasi Nginx terlampir di repositori (`deploy/README.md` dan `deploy/nginx.conf`).

Agar kami bisa menyesuaikan, mohon informasi berikut:

**Server**

1. OS dan versi (mis. Ubuntu 24.04 / RHEL) dan web server yang tersedia. Konfigurasi kami untuk **Nginx**; bila memakai Apache atau lainnya, kami terjemahkan.
2. Versi PHP yang tersedia. Kebutuhan: **PHP 8.3 atau lebih baru** dengan PHP-FPM dan ekstensi `ctype, curl, dom, fileinfo, gd (dukungan WebP), mbstring, openssl, pdo, tokenizer, xml` serta driver database.
3. Apakah **Composer** boleh dipasang di server, atau pemasangan dilakukan dari artefak yang sudah dibangun (kami bisa menyiapkannya).
4. Apakah server punya akses internet keluar (untuk `composer install`), atau perlu mirror internal.
5. Apakah Docker diperbolehkan, bila lebih mudah bagi tim Anda.

**Database**

6. Jenis dan versi yang disediakan: MySQL 8 / MariaDB 10.6+ / PostgreSQL 14+. Siapa yang membuat database dan penggunanya.

**Jaringan dan domain**

7. Domain atau subdomain yang dipakai (mis. `pemdi.panrb.go.id`) dan siapa yang mengelola sertifikat HTTPS.
8. Apakah ada load balancer, WAF, atau CDN di depan server? Bila ada, mohon alamat IP-nya agar batas laju login dan formulir kontak menghitung IP pengunjung yang benar.
9. Apakah ada batas ukuran unggahan atau aturan firewall khusus (aplikasi menerima gambar maksimal 5 MB).

**Operasional**

10. Kebijakan **cadangan**: seberapa sering, siapa yang mengelola, dan berapa lama disimpan. Yang perlu dicadangkan: database, folder `storage/app/public` (gambar unggahan), dan berkas `.env` (terutama `APP_KEY`, karena pesan kontak terenkripsi dengannya).
11. Apakah tersedia **cron** di server (dibutuhkan setiap menit untuk penghapusan pesan dan log yang melewati masa simpan).
12. Apakah tersedia **SMTP** internal? Saat ini tidak wajib: aplikasi belum mengirim email, dan kata sandi diatur ulang oleh Admin.
13. Apakah ada ketentuan **keamanan atau audit** (pemindaian kerentanan, whitelist IP untuk `/admin`, kebijakan kata sandi) yang harus dipenuhi sebelum tayang?
14. Apakah situs ini perlu **Matomo** PANRB? Bila ya, mohon Site ID dan alamatnya.

**Data pribadi**

15. Pesan formulir kontak berisi data pribadi. Saat ini pesan tersimpan terenkripsi dan dihapus otomatis setelah 12 bulan, log aktivitas setelah 24 bulan (dapat diubah lewat konfigurasi). Mohon konfirmasi apakah ada ketentuan lain yang berlaku.

Terima kasih. Kami siap berdiskusi atau melakukan sesi bersama untuk pemasangan.

Hormat kami,
[Nama] — [Unit]
