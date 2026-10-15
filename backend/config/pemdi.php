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

];
