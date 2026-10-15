<?php

namespace App\Http\Requests;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /** Gagal berturut-turut untuk satu email dari satu IP sebelum dikunci sementara. */
    public const MAX_ATTEMPTS_PER_ACCOUNT = 5;

    /** Gagal dari satu IP (semua email) per menit: membatasi tebak-tebakan banyak akun sekaligus. */
    public const MAX_ATTEMPTS_PER_IP = 20;

    /**
     * Hash bcrypt pengganti saat email tidak terdaftar. Kata sandi tetap diverifikasi terhadap
     * hash ini agar waktu respons sama, sehingga keberadaan akun tidak bisa ditebak dari waktunya.
     */
    private const DUMMY_HASH = '$2y$12$vEjETzFJXFCRBEq0nHrDLuCF1mIPdbdWnyc4wsVcPyQYRsu/vwq66';

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.max' => 'Email terlalu panjang.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.max' => 'Kata sandi terlalu panjang.',
        ];
    }

    /**
     * Memeriksa kredensial dan mengembalikan pengguna bila valid. Pesan gagal sengaja seragam
     * ("email atau kata sandi salah") agar tidak membocorkan email mana yang terdaftar.
     *
     * @throws ValidationException
     */
    public function authenticate(): User
    {
        $this->ensureIsNotRateLimited();

        $email = Str::lower($this->string('email')->trim()->value());
        $user = User::where('email', $email)->first();
        $passwordMatches = Hash::check($this->string('password')->value(), $user->password ?? self::DUMMY_HASH);

        if ($user === null || ! $passwordMatches) {
            RateLimiter::hit($this->accountKey());
            RateLimiter::hit($this->ipKey());
            // Tidak dikaitkan ke pemilik akun: pelakunya belum tentu dia (bisa orang lain yang menebak).
            ActivityLog::record('login_gagal', "Percobaan masuk gagal untuk {$email}.");

            throw ValidationException::withMessages(['email' => 'Email atau kata sandi salah.']);
        }

        if (! $user->is_active) {
            ActivityLog::record('login_ditolak', 'Akun nonaktif mencoba masuk.', user: $user);

            throw ValidationException::withMessages([
                'email' => 'Akun ini dinonaktifkan. Hubungi Admin untuk mengaktifkannya kembali.',
            ]);
        }

        RateLimiter::clear($this->accountKey());

        return $user;
    }

    /**
     * @throws ValidationException
     */
    private function ensureIsNotRateLimited(): void
    {
        $limited = match (true) {
            RateLimiter::tooManyAttempts($this->accountKey(), self::MAX_ATTEMPTS_PER_ACCOUNT) => $this->accountKey(),
            RateLimiter::tooManyAttempts($this->ipKey(), self::MAX_ATTEMPTS_PER_IP) => $this->ipKey(),
            default => null,
        };

        if ($limited === null) {
            return;
        }

        $seconds = RateLimiter::availableIn($limited);

        throw ValidationException::withMessages([
            'email' => "Terlalu banyak percobaan masuk. Coba lagi dalam {$seconds} detik.",
        ])->status(429);
    }

    private function accountKey(): string
    {
        return 'login:'.Str::transliterate(Str::lower($this->string('email')->trim()->value())).'|'.$this->ip();
    }

    private function ipKey(): string
    {
        return 'login-ip:'.$this->ip();
    }
}
