<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Area khusus Admin: kategori, pesan, pengguna, pengaturan, log aktivitas.
        Gate::define('admin', fn (User $user): bool => $user->isAdmin());

        // Kebijakan kata sandi akun CMS. Tanpa cek kebocoran (uncompromised) karena itu memanggil
        // layanan pihak ketiga, sedangkan server PANRB belum tentu boleh mengakses internet.
        Password::defaults(fn () => Password::min(12)->letters()->mixedCase()->numbers());
    }
}
