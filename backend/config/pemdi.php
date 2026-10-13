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
