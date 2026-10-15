<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Enums\ArticleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReturnArticleRequest;
use App\Http\Resources\AdminArticleResource;
use App\Models\ActivityLog;
use App\Models\Article;
use Illuminate\Support\Facades\Gate;

/**
 * Alur tinjauan (maker-checker): Penulis mengajukan, Admin menerbitkan atau mengembalikan dengan
 * catatan. Setiap langkah diperiksa ArticlePolicy (peran, kepemilikan, dan status saat ini) dan
 * dicatat di log aktivitas.
 */
class ArticleWorkflowController extends Controller
{
    public function submit(Article $article): AdminArticleResource
    {
        Gate::authorize('submit', $article);
        $article->status = ArticleStatus::Ditinjau;
        $article->review_note = null;

        return $this->save($article, ActivityAction::ArtikelDiajukan, 'Mengajukan artikel "%s" untuk ditinjau.');
    }

    public function withdraw(Article $article): AdminArticleResource
    {
        Gate::authorize('withdraw', $article);
        $article->status = ArticleStatus::Draf;

        return $this->save($article, ActivityAction::ArtikelDitarik, 'Menarik pengajuan artikel "%s".');
    }

    public function publish(Article $article): AdminArticleResource
    {
        Gate::authorize('publish', $article);
        $article->status = ArticleStatus::Terbit;
        $article->review_note = null;
        // Tanggal terbit pertama dipertahankan bila artikel pernah terbit lalu dibatalkan.
        $article->published_at ??= now();

        return $this->save($article, ActivityAction::ArtikelDiterbitkan, 'Menerbitkan artikel "%s".');
    }

    public function return(ReturnArticleRequest $request, Article $article): AdminArticleResource
    {
        Gate::authorize('return', $article);
        $article->status = ArticleStatus::Draf;
        $article->review_note = trim($request->string('note')->value());

        return $this->save($article, ActivityAction::ArtikelDikembalikan, 'Mengembalikan artikel "%s" ke Penulis dengan catatan.');
    }

    public function unpublish(Article $article): AdminArticleResource
    {
        Gate::authorize('unpublish', $article);
        $article->status = ArticleStatus::Draf;

        return $this->save($article, ActivityAction::ArtikelDibatalkanTerbit, 'Membatalkan penerbitan artikel "%s".');
    }

    private function save(Article $article, ActivityAction $action, string $description): AdminArticleResource
    {
        $article->save();
        ActivityLog::record($action, sprintf($description, $article->title), $article);

        return (new AdminArticleResource($article->load(['category', 'author'])))->withBody();
    }
}
