<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Akun yang dinonaktifkan Admin langsung kehilangan akses, termasuk sesi yang sedang berjalan.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && ! $user->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // 401, bukan 403: sesinya sudah diakhiri, jadi klien harus diperlakukan sebagai tamu.
            abort(401, 'Akun Anda dinonaktifkan. Hubungi Admin.');
        }

        return $next($request);
    }
}
