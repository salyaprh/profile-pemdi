<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ArticleStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Ringkasan untuk halaman Dasbor (pola "CMS Dashboard" IDDS): metrik di atas, aktivitas di bawah.
 * Admin melihat seluruh artikel dan aktivitas terbaru; Penulis hanya artikel miliknya.
 */
class DashboardController extends Controller
{
    private const RECENT_ACTIVITY_LIMIT = 8;

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        /** @var array<string, int> $counts */
        $counts = Article::query()
            ->when(! $user->isAdmin(), fn ($query) => $query->where('author_id', $user->id))
            ->toBase()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $recentActivity = $user->isAdmin()
            ? ActivityLog::with('user')->latest('created_at')->latest('id')->limit(self::RECENT_ACTIVITY_LIMIT)->get()
            : collect();

        $metrics = [
            'published' => (int) ($counts[ArticleStatus::Terbit->value] ?? 0),
            'in_review' => (int) ($counts[ArticleStatus::Ditinjau->value] ?? 0),
            'draft' => (int) ($counts[ArticleStatus::Draf->value] ?? 0),
        ];

        return response()->json([
            'metrics' => $metrics,
            // Kotak masuk pesan khusus Admin.
            ...($user->isAdmin() ? ['unread_messages' => ContactMessage::query()->whereNull('read_at')->count()] : []),
            'recent_activity' => ActivityLogResource::collection($recentActivity)->resolve($request),
        ]);
    }
}
