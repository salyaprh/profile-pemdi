<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Kebijakan kata sandi akun CMS. Tanpa cek kebocoran (uncompromised) karena itu memanggil
        // layanan pihak ketiga, sedangkan server PANRB belum tentu boleh mengakses internet.
        Password::defaults(fn () => Password::min(12)->letters()->mixedCase()->numbers());

        // API publik: longgar untuk pengunjung biasa, membatasi perayap yang terlalu agresif.
        // Di balik Nginx/proxy, IP pengunjung asli hanya terbaca bila proxy dipercaya (TrustProxies).
        RateLimiter::for('public', fn (Request $request) => Limit::perMinute((int) config('pemdi.public_rate_limit'))->by($request->ip()));
        RateLimiter::for('contact', fn (Request $request) => Limit::perMinutes(10, (int) config('pemdi.contact.rate_limit'))
            ->by($request->ip())
            ->response(fn () => response()->json(
                ['message' => 'Terlalu banyak pesan dari jaringan Anda. Coba lagi beberapa menit lagi.'],
                429,
            )));
    }
}
