<?php

namespace App\Http\Controllers;

use App\Enums\ActivityAction;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

/**
 * Login berbasis sesi untuk panel admin (cookie HttpOnly + token CSRF, satu origin).
 */
class AuthController extends Controller
{
    /**
     * Memastikan browser punya cookie XSRF-TOKEN sebelum mengirim permintaan yang mengubah data.
     * Cookie itu dipasang middleware CSRF pada setiap respons; endpoint ini sekadar pemicunya.
     */
    public function csrf(): Response
    {
        return response()->noContent();
    }

    /**
     * Pengguna yang sedang login, atau null. Sengaja 200 (bukan 401) untuk tamu: ini pertanyaan
     * "siapa saya", dan jawabannya "belum login" adalah kondisi normal, bukan error.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user !== null && ! $user->is_active) {
            $this->endSession($request);
            $user = null;
        }

        return response()->json(['user' => $user ? new UserResource($user) : null]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = $request->authenticate();

        Auth::guard('web')->login($user);
        // Cegah session fixation: ID sesi selalu diganti setelah login.
        $request->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();
        ActivityLog::record(ActivityAction::Login, 'Masuk ke CMS.', user: $user);

        return response()->json(['user' => new UserResource($user)]);
    }

    /**
     * Ganti kata sandi akun sendiri. Penanda kata sandi sementara dicabut. Sesi di perangkat lain
     * berakhir sendiri karena middleware AuthenticateSession (bootstrap/app.php) mendeteksi hash
     * kata sandi yang berubah; sesi ini tetap berjalan.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->password = $request->string('password')->value();
        $user->must_change_password = false;
        $user->save();

        ActivityLog::record(ActivityAction::KataSandiDiganti, 'Mengganti kata sandi sendiri.');

        return response()->json(['user' => new UserResource($user)]);
    }

    public function logout(Request $request): Response
    {
        ActivityLog::record(ActivityAction::Logout, 'Keluar dari CMS.');
        $this->endSession($request);

        return response()->noContent();
    }

    private function endSession(Request $request): void
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
