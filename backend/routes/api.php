<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\ArticleWorkflowController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ContactMessageController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
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
        // Ganti kata sandi sendiri: terbuka juga bagi akun yang masih wajib menggantinya.
        Route::put('password', [AuthController::class, 'changePassword'])->middleware(['auth', 'active', 'throttle:6,1']);
    });

    Route::prefix('admin')->middleware(['auth', 'active', 'password.changed'])->group(function () {
        Route::get('dashboard', DashboardController::class);

        // Artikel: hak akses per aksi diperiksa ArticlePolicy di controller.
        Route::whereNumber('article')->group(function () {
            Route::get('articles', [ArticleController::class, 'index']);
            Route::post('articles', [ArticleController::class, 'store']);
            Route::get('articles/{article}', [ArticleController::class, 'show'])->withTrashed();
            Route::put('articles/{article}', [ArticleController::class, 'update']);
            Route::delete('articles/{article}', [ArticleController::class, 'destroy']);
            Route::post('articles/{article}/restore', [ArticleController::class, 'restore'])->withTrashed();
            Route::delete('articles/{article}/permanent', [ArticleController::class, 'forceDestroy'])->withTrashed();

            foreach (['submit', 'withdraw', 'publish', 'return', 'unpublish'] as $action) {
                Route::post("articles/{article}/{$action}", [ArticleWorkflowController::class, $action]);
            }
        });

        Route::get('categories', [CategoryController::class, 'index']);
        Route::middleware('admin')->whereNumber('category')->group(function () {
            Route::post('categories', [CategoryController::class, 'store']);
            Route::put('categories/{category}', [CategoryController::class, 'update']);
            Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
        });

        Route::post('media', [MediaController::class, 'store'])->middleware('throttle:30,1');

        // Area khusus Admin selain kategori (di atas): pesan, pengguna, pengaturan, log aktivitas.
        Route::middleware('admin')->group(function () {
            Route::whereNumber('message')->group(function () {
                Route::get('messages', [ContactMessageController::class, 'index']);
                Route::get('messages/{message}', [ContactMessageController::class, 'show']);
                Route::patch('messages/{message}', [ContactMessageController::class, 'update']);
                Route::delete('messages/{message}', [ContactMessageController::class, 'destroy']);
            });

            Route::whereNumber('user')->group(function () {
                Route::get('users', [UserController::class, 'index']);
                Route::post('users', [UserController::class, 'store']);
                Route::get('users/{user}', [UserController::class, 'show']);
                Route::put('users/{user}', [UserController::class, 'update']);
                Route::post('users/{user}/password', [UserController::class, 'resetPassword'])->middleware('throttle:20,1');
            });

            Route::get('settings', [SettingsController::class, 'show']);
            Route::put('settings', [SettingsController::class, 'update']);
            Route::get('activity', [ActivityController::class, 'index']);
        });
    });
});
