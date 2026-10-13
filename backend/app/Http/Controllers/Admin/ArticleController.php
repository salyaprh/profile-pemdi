<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Enums\ArticleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArticleRequest;
use App\Http\Resources\AdminArticleResource;
use App\Models\ActivityLog;
use App\Models\Article;
use App\Support\LikePattern;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

/**
 * CRUD artikel di panel admin. Perubahan status (ajukan, terbitkan, dll.) ada di
 * ArticleWorkflowController. Hak akses: App\Policies\ArticlePolicy.
 */
class ArticleController extends Controller
{
    private const PER_PAGE = 15;

    private const STATUS_FILTERS = ['draf', 'ditinjau', 'terbit'];

    /** Filter: ?status=draf|ditinjau|terbit|sampah, ?kategori=<id>, ?cari=<judul>, ?page=<n>. */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Article::class);
        $user = $request->user();
        $status = $request->string('status')->value();

        $query = Article::query()->with(['category', 'author']);

        if ($status === 'sampah') {
            abort_unless($user->isAdmin(), 403, 'Sampah artikel hanya dapat dilihat Admin.');
            $query->onlyTrashed();
        } elseif (in_array($status, self::STATUS_FILTERS, true)) {
            $query->where('status', $status);
        }

        if (! $user->isAdmin()) {
            $query->where('author_id', $user->id);
        }

        if ($request->filled('kategori')) {
            $query->where('category_id', $request->integer('kategori'));
        }

        $search = trim($request->string('cari')->value());
        if ($search !== '') {
            LikePattern::whereAnyContains($query, ['title'], $search);
        }

        $articles = $query->latest('updated_at')->latest('id')->paginate(self::PER_PAGE)->withQueryString();

        return AdminArticleResource::collection($articles);
    }

    public function show(Article $article): AdminArticleResource
    {
        Gate::authorize('view', $article);

        return $this->resource($article);
    }

    public function store(ArticleRequest $request): JsonResponse
    {
        Gate::authorize('create', Article::class);
        $data = $request->articleData();

        $article = new Article(Arr::except($data, 'slug'));
        $article->slug = $data['slug'] ?? Article::uniqueSlug($data['title']);
        $article->author_id = $request->user()->id;
        $article->status = ArticleStatus::Draf;
        $article->save();

        ActivityLog::record(ActivityAction::ArtikelDibuat, "Membuat artikel \"{$article->title}\".", $article);

        return $this->resource($article)->response()->setStatusCode(201);
    }

    public function update(ArticleRequest $request, Article $article): AdminArticleResource
    {
        Gate::authorize('update', $article);
        $this->ensureNotModifiedSince($request, $article);
        $data = $request->articleData();

        $article->fill(Arr::except($data, 'slug'));
        // Slug tidak ikut berubah saat judul diganti (hanya bila diisi eksplisit), agar tautan yang
        // sudah tersebar tetap berlaku.
        if ($data['slug'] !== null) {
            $article->slug = $data['slug'];
        }
        $article->save();

        ActivityLog::record(ActivityAction::ArtikelDiperbarui, "Memperbarui artikel \"{$article->title}\".", $article);

        return $this->resource($article);
    }

    public function destroy(Article $article): Response
    {
        Gate::authorize('delete', $article);
        $article->delete();

        ActivityLog::record(ActivityAction::ArtikelDihapus, "Memindahkan artikel \"{$article->title}\" ke sampah.", $article);

        return response()->noContent();
    }

    public function restore(Article $article): AdminArticleResource
    {
        Gate::authorize('restore', $article);
        abort_unless($article->trashed(), 409, 'Artikel ini tidak ada di sampah.');
        $article->restore();

        ActivityLog::record(ActivityAction::ArtikelDipulihkan, "Memulihkan artikel \"{$article->title}\" dari sampah.", $article);

        return $this->resource($article);
    }

    public function forceDestroy(Article $article): Response
    {
        Gate::authorize('forceDelete', $article);
        abort_unless($article->trashed(), 409, 'Pindahkan artikel ke sampah sebelum menghapusnya permanen.');

        ActivityLog::record(ActivityAction::ArtikelDihapusPermanen, "Menghapus permanen artikel \"{$article->title}\".", $article);
        $article->forceDelete();

        return response()->noContent();
    }

    /**
     * Penguncian optimistis: tolak penyimpanan bila artikel sudah diubah orang lain sejak
     * formulir dibuka, agar perubahan mereka tidak tertimpa diam-diam.
     */
    private function ensureNotModifiedSince(Request $request, Article $article): void
    {
        if (! $request->filled('updated_at') || $article->updated_at === null) {
            return;
        }

        $loadedAt = Carbon::parse($request->string('updated_at')->value());
        abort_unless(
            $loadedAt->equalTo($article->updated_at),
            409,
            'Artikel ini sudah diubah pengguna lain sejak Anda membukanya. Muat ulang halaman untuk melihat versi terbaru.',
        );
    }

    private function resource(Article $article): AdminArticleResource
    {
        return (new AdminArticleResource($article->load(['category', 'author'])))->withBody();
    }
}
