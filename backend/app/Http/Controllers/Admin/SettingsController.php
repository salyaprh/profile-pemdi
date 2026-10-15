<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\SiteSettingsRequest;
use App\Models\ActivityLog;
use App\Support\SiteSettings;
use Illuminate\Http\JsonResponse;

/** Pengaturan situs (khusus Admin; middleware admin di routes/api.php). */
class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => SiteSettings::get()]);
    }

    public function update(SiteSettingsRequest $request): JsonResponse
    {
        $saved = SiteSettings::save($request->settings());

        ActivityLog::record(ActivityAction::PengaturanDiperbarui, 'Memperbarui pengaturan situs.');

        return response()->json(['data' => $saved]);
    }
}
