<?php

return [

    /*
    | Kata sandi akun demo (database/seeders/DemoUserSeeder.php) untuk pengembangan lokal dan uji
    | e2e. Seeder demo selalu ditolak di produksi.
    */
    'demo_user_password' => env('DEMO_USER_PASSWORD'),

    /*
    | Folder unggahan gambar di disk `public` (storage/app/public/<folder>, URL /storage/<folder>).
    | Uji e2e memakai folder terpisah agar tidak bercampur dengan unggahan pengembangan.
    */
    'media_directory' => env('MEDIA_DIRECTORY', 'media'),

    /*
    | index.html hasil build frontend (`npm run build`), disisipi meta tiap artikel oleh
    | PublicArticlePageController supaya pratinjau tautan (WhatsApp, dll.) benar. Bawaannya sesuai
    | susunan repo; ubah bila frontend dipasang di folder lain.
    */
    'frontend_index' => env('FRONTEND_INDEX', base_path('../frontend/dist/index.html')),

    /*
    | Gambar unggahan yang tidak dipakai artikel mana pun (termasuk yang di sampah) dihapus setelah
    | sekian hari, oleh `pemdi:bersihkan-media` yang dijadwalkan harian. Tenggang ini memberi waktu bagi
    | Penulis yang baru mengunggah gambar tetapi belum menyimpan artikelnya.
    */
    'media_orphan_days' => (int) env('MEDIA_ORPHAN_DAYS', 7),

    /*
    | Reverse proxy/CDN yang dipercaya untuk membaca IP pengunjung dari X-Forwarded-For: alamat
    | dipisah koma, atau * bila hanya proxy yang dapat menjangkau server. Kosong = tidak ada (Nginx +
    | PHP-FPM langsung). Tanpa ini semua pengunjung di balik proxy tampak berasal dari satu IP, sehingga
    | batas laju login, formulir kontak, dan API publik berlaku untuk SELURUH situs sekaligus.
    */
    'trusted_proxies' => array_values(array_filter(array_map('trim', explode(',', (string) env('TRUSTED_PROXIES', ''))))),

    /*
    | Masa simpan log aktivitas (bulan). Memuat alamat IP, jadi tidak disimpan selamanya; dihapus
    | `model:prune` yang dijadwalkan harian (routes/console.php).
    */
    'activity_retention_months' => (int) env('ACTIVITY_RETENTION_MONTHS', 24),

    /*
    | Batas permintaan API situs publik per IP per menit (artikel, kategori, sitemap).
    */
    'public_rate_limit' => (int) env('PUBLIC_API_RATE_LIMIT', 120),

    /*
    | Formulir kontak publik (POST /api/contact).
    | - retention_months: pesan dihapus otomatis setelah sekian bulan (UU PDP: simpan seperlunya);
    |   dijalankan `php artisan schedule:run` (cron) lewat model:prune.
    | - rate_limit: maksimal pesan per IP per 10 menit.
    | - min_seconds: pesan yang dikirim lebih cepat dari ini setelah formulir dibuka dianggap bot.
    | - token_ttl_minutes: token formulir kedaluwarsa setelah sekian menit.
    */
    'contact' => [
        'retention_months' => (int) env('CONTACT_RETENTION_MONTHS', 12),
        'rate_limit' => (int) env('CONTACT_RATE_LIMIT', 5),
        'min_seconds' => (int) env('CONTACT_MIN_SECONDS', 3),
        'token_ttl_minutes' => (int) env('CONTACT_TOKEN_TTL_MINUTES', 120),
    ],

];
