<?php

/*
| CORS dimatikan: frontend dan API disajikan dari origin yang sama (Nginx), jadi browser tidak
| butuh izin lintas origin. Bawaan Laravel (`api/*` untuk semua origin) dibiarkan tertutup agar
| situs lain tidak bisa membaca respons API lewat JavaScript.
*/

return [

    'paths' => [],

    'allowed_methods' => ['*'],

    'allowed_origins' => [],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
