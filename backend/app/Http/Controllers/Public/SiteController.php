<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Support\SiteSettings;
use Illuminate\Http\JsonResponse;

/** Pengaturan situs untuk beranda dan footer (GET /api/site). */
class SiteController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => SiteSettings::get()]);
    }
}
