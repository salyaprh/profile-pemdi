<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/** Ganti kata sandi akun sendiri: kata sandi saat ini wajib, dan yang baru harus berbeda. */
class ChangePasswordRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['bail', 'required', 'string', 'current_password:web'],
            'password' => ['bail', 'required', 'string', 'max:255', 'confirmed', 'different:current_password', Password::defaults()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Kata sandi saat ini wajib diisi',
            'current_password.current_password' => 'Kata sandi saat ini salah.',
            'password.required' => 'Kata sandi wajib diisi',
            'password.confirmed' => 'Konfirmasi tidak sama dengan kata sandi baru',
            'password.different' => 'Kata sandi baru harus berbeda dari yang sekarang',
            ...PasswordMessages::all(),
        ];
    }
}
