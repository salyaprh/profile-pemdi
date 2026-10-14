<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/** Kata sandi sementara baru untuk pengguna lain, ditetapkan Admin. */
class ResetPasswordRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'password' => ['bail', 'required', 'string', 'max:255', Password::defaults()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['password.required' => 'Kata sandi wajib diisi', ...PasswordMessages::all()];
    }
}
