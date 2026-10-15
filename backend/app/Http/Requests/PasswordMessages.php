<?php

namespace App\Http\Requests;

/** Pesan galat aturan Password::defaults(), sama dengan frontend/src/admin/password.ts. */
final class PasswordMessages
{
    /**
     * @return array<string, string>
     */
    public static function all(): array
    {
        return [
            'password.min' => 'Kata sandi minimal 12 karakter',
            'password.letters' => 'Kata sandi harus memuat huruf',
            'password.mixed' => 'Kata sandi harus memuat huruf besar dan huruf kecil',
            'password.numbers' => 'Kata sandi harus memuat angka',
            'password.max' => 'Kata sandi terlalu panjang',
        ];
    }
}
