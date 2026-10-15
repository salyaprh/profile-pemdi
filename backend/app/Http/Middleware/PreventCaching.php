<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Respons yang memuat data akun/admin tidak boleh disimpan cache browser maupun proxy.
 * (Middleware `cache.headers` bawaan Laravel hanya berlaku untuk GET/HEAD yang berisi konten.)
 */
class PreventCaching
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('Cache-Control', 'no-store, private');

        return $response;
    }
}
