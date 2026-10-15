<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Endpoint khusus Admin. Dijalankan SEBELUM model rute dicari (lihat bootstrap/app.php): Penulis
 * selalu mendapat 403, tidak peduli id yang diminta ada atau tidak, sehingga ia tidak bisa menebak
 * id pesan atau pengguna dari perbedaan 404/403.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->isAdmin(), 403, 'Anda tidak memiliki akses untuk tindakan ini.');

        return $next($request);
    }
}
