<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityGroup;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Log aktivitas CMS (khusus Admin, hanya bisa dibaca): GET /api/admin/activity. */
class ActivityController extends Controller
{
    private const PER_PAGE = 30;

    /** Filter: ?kelompok=login|artikel|kategori|pesan|pengguna|pengaturan, ?page=<n>. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $group = ActivityGroup::tryFrom($request->string('kelompok')->value());

        $entries = ActivityLog::query()
            ->with('user')
            ->when($group !== null, fn (Builder $query) => $query->whereIn('action', $group?->actionValues() ?? []))
            ->latest('created_at')
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return ActivityLogResource::collection($entries);
    }
}
