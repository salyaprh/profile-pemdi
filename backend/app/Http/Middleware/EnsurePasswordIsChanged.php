<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Akun dengan kata sandi sementara (dibuat atau diatur ulang Admin) tidak dapat memakai endpoint
 * panel sebelum menggantinya lewat PUT /api/auth/password. Frontend mengarahkannya ke halaman
 * Akun saya; pemeriksaan ini memastikan hal yang sama berlaku untuk pemanggil API langsung.
 */
class EnsurePasswordIsChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->must_change_password) {
            abort(403, 'Ganti kata sandi sementara Anda terlebih dahulu di menu Akun saya.');
        }

        return $next($request);
    }
}
