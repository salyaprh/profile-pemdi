<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Support\FrontendPage;
use Illuminate\Http\Response;

/**
 * Halaman artikel di /portfolio/{slug}: index.html frontend yang meta judul, deskripsi, dan gambarnya
 * diganti dengan milik artikel. Pengunjung biasa tetap mendapat aplikasi React yang sama; manfaatnya
 * untuk crawler yang tidak menjalankan JavaScript (pratinjau WhatsApp, Facebook, dll.).
 *
 * Artikel yang tidak ada atau belum terbit dijawab 404 dengan halaman yang sama, sehingga frontend
 * menampilkan halaman "tidak ditemukan"-nya sendiri.
 */
class ArticlePageController extends Controller
{
    public function __invoke(string $slug, FrontendPage $page): Response
    {
        // Format yang sama dengan rute API artikel; slug lain pasti tidak ada, jadi tidak perlu sampai
        // ke database.
        $article = preg_match('/^[a-z0-9-]{1,220}$/', $slug) === 1
            ? Article::query()->published()->where('slug', $slug)->first()
            : null;

        if ($article === null) {
            return response($page->html(), 404, FrontendPage::HEADERS);
        }

        return response($page->forArticle($article), 200, FrontendPage::HEADERS);
    }
}
