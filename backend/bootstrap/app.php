<?php

use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\PreventCaching;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        // API hanya dipakai frontend sendiri dari origin yang sama, jadi memakai grup `web`:
        // sesi dalam cookie HttpOnly dan token CSRF (header X-XSRF-TOKEN), tanpa token di
        // localStorage dan tanpa CORS.
        then: function (): void {
            Route::middleware('web')->prefix('api')->group(base_path('routes/api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['active' => EnsureUserIsActive::class, 'no-store' => PreventCaching::class]);
        // Tanpa ini middleware auth (berprioritas) dijalankan lebih dulu, sehingga respons 401-nya tidak
        // melewati PreventCaching.
        $middleware->prependToPriorityList(AuthenticatesRequests::class, PreventCaching::class);
        // Tamu yang mengakses rute ber-`auth` mendapat 401 JSON, bukan redirect ke halaman login.
        $middleware->redirectGuestsTo(fn (): ?string => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        // Pesan bawaan Gate/Policy ("This action is unauthorized.") diganti bahasa Indonesia; pesan
        // 403 khusus dari abort(403, '...') dibiarkan.
        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*') && $e->getMessage() === 'This action is unauthorized.') {
                return response()->json(['message' => 'Anda tidak memiliki akses untuk tindakan ini.'], 403);
            }

            return null;
        });
    })->create();
