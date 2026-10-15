<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Semua rute di sini berprefiks /api dan memakai middleware `web` (sesi + CSRF); lihat bootstrap/app.php.

Route::get('csrf', [AuthController::class, 'csrf']);

// Respons yang memuat data akun tidak boleh disimpan cache browser/proxy.
Route::middleware('no-store')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth');
    });

    Route::prefix('admin')->middleware(['auth', 'active'])->group(function () {
        Route::get('dashboard', DashboardController::class);
    });
});
