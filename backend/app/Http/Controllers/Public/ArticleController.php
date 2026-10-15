<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicArticleResource;
use App\Models\Article;
use App\Support\LikePattern;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Artikel terbit untuk situs publik (GET /api/articles, /api/articles/{slug}). Draf, artikel yang
 * menunggu tinjauan, artikel di sampah, dan artikel bertanggal terbit di masa depan tidak pernah
 * keluar dari sini.
 */
class ArticleController extends Controller
{
    private const DEFAULT_PER_PAGE = 12;

    private const MAX_PER_PAGE = 24;

    private const RELATED_LIMIT = 3;

    /** Filter: ?kategori=<slug>, ?cari=<kata>, ?page=<n>, ?per_page=<1–24>. */
    public function index(Request $request): JsonResponse
    {
        // Nilai bukan angka memakai bawaan; angka di luar batas dipangkas ke 1–24.
        $requested = filter_var($request->query('per_page'), FILTER_VALIDATE_INT);
        $perPage = $requested === false ? self::DEFAULT_PER_PAGE : min(self::MAX_PER_PAGE, max(1, $requested));
        $category = $request->string('kategori')->trim()->value();
        $search = mb_substr($request->string('cari')->trim()->value(), 0, 100);

        $articles = $this->published()
            ->when($category !== '', fn (Builder $query) => $query->whereRelation('category', 'slug', $category))
            ->when($search !== '', fn (Builder $query) => LikePattern::whereAnyContains($query, ['title', 'excerpt'], $search))
            ->paginate($perPage);

        // Hanya `data` dan `meta`: tautan halaman bawaan Laravel memuat host backend, dan frontend
        // membentuk URL halamannya sendiri.
        return response()->json([
            'data' => PublicArticleResource::collection($articles->getCollection())->resolve(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $article = $this->published()->where('slug', $slug)->first();
        abort_if($article === null, 404, 'Artikel tidak ditemukan.');

        $related = $this->published()
            ->where('category_id', $article->category_id)
            ->whereKeyNot($article->getKey())
            ->limit(self::RELATED_LIMIT)
            ->get();

        return response()->json([
            'data' => (new PublicArticleResource($article))->withBody()->resolve(),
            'related' => PublicArticleResource::collection($related)->resolve(),
        ]);
    }

    /** @return Builder<Article> */
    private function published(): Builder
    {
        return Article::query()
            ->published()
            ->with(['category', 'author'])
            ->latest('published_at')
            ->latest('id');
    }
}
