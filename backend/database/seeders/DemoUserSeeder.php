<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Akun demo untuk pengembangan lokal dan uji e2e. DITOLAK di produksi: akun produksi dibuat
 * dengan `php artisan pemdi:buat-admin` dan dari panel Admin.
 *
 * Kata sandi dari env DEMO_USER_PASSWORD (config pemdi.demo_user_password), atau nilai bawaan di bawah.
 */
class DemoUserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@pemdi.test';

    public const PENULIS_EMAIL = 'penulis@pemdi.test';

    public const DEFAULT_PASSWORD = 'DemoPemdi2026';

    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('DemoUserSeeder tidak boleh dijalankan di produksi.');
        }

        // ?: (bukan ??) karena DEMO_USER_PASSWORD= yang dikosongkan bernilai string kosong.
        $password = (string) (config('pemdi.demo_user_password') ?: self::DEFAULT_PASSWORD);

        foreach ([
            [self::ADMIN_EMAIL, 'Admin Demo', Role::Admin],
            [self::PENULIS_EMAIL, 'Penulis Demo', Role::Penulis],
        ] as [$email, $name, $role]) {
            $user = User::firstOrNew(['email' => $email]);
            $user->fill(['name' => $name, 'password' => $password]);
            $user->role = $role;
            $user->is_active = true;
            $user->save();
        }
    }
}
