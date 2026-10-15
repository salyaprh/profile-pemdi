<?php

use App\Http\Controllers\Public\ArticleController;
use App\Http\Controllers\Public\CategoryController;
use App\Http\Controllers\Public\ContactController;
use Illuminate\Support\Facades\Route;

// API untuk pengunjung situs publik: berprefiks /api tetapi TANPA sesi dan cookie (grup `api`,
// lihat bootstrap/app.php), jadi pengunjung tidak mendapat cookie apa pun. Hanya konten terbit.

Route::middleware('throttle:public')->group(function () {
    // Selalu divalidasi ulang (no-cache + ETag): artikel yang baru terbit langsung terlihat, dan
    // respons yang tidak berubah dijawab 304 tanpa isi.
    Route::middleware('cache.headers:public;no_cache;etag')->group(function () {
        Route::get('articles', [ArticleController::class, 'index']);
        Route::get('articles/{slug}', [ArticleController::class, 'show'])->where('slug', '[a-z0-9-]{1,220}');
        Route::get('categories', CategoryController::class);
    });

    Route::get('contact/token', [ContactController::class, 'token']);
});

Route::post('contact', [ContactController::class, 'store'])->middleware('throttle:contact');
