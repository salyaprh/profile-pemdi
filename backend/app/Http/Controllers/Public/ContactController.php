<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactMessageRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

/**
 * Formulir "Hubungi kami" untuk pengunjung (tanpa sesi dan tanpa cookie). Perlindungan spam:
 * pembatasan laju per IP, kolom jebakan bot, dan token waktu terenkripsi.
 */
class ContactController extends Controller
{
    /** GET /api/contact/token: waktu formulir dibuka, terenkripsi (tidak bisa dipalsukan). */
    public function token(): JsonResponse
    {
        return response()
            ->json(['token' => Crypt::encryptString((string) now()->getTimestamp())])
            ->header('Cache-Control', 'no-store, private');
    }

    /** POST /api/contact */
    public function store(ContactMessageRequest $request): JsonResponse
    {
        // Pesan dari bot dijawab sama seperti pesan sungguhan agar bot tidak belajar menghindar,
        // tetapi tidak disimpan.
        if ($request->looksAutomated()) {
            Log::info('Pesan kontak diabaikan: ciri pengiriman otomatis.');
        } else {
            ContactMessage::create($request->messageData());
        }

        return response()->json(['message' => 'Pesan diterima.'], 202);
    }
}
