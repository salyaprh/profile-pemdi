<?php

namespace App\Http\Requests;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Tambah dan ubah pengguna (Admin). `password` hanya untuk akun baru; pengaturan ulang kata sandi
 * akun yang sudah ada lewat ResetPasswordRequest.
 */
class UserRequest extends FormRequest
{
    private function target(): ?User
    {
        $user = $this->route('user');

        return $user instanceof User ? $user : null;
    }

    protected function prepareForValidation(): void
    {
        // Email tidak peka huruf besar/kecil: disimpan dan dibandingkan dalam huruf kecil.
        $email = $this->input('email');
        if (is_string($email)) { // bukan teks (mis. array): dibiarkan agar ditolak aturan `string`
            $this->merge(['email' => mb_strtolower(trim($email))]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $creating = $this->target() === null;

        return [
            'name' => ['bail', 'required', 'string', 'min:3', 'max:255'],
            // bail + max lebih dulu: validator email (RFC) sangat boros memori pada string yang sangat panjang.
            'email' => ['bail', 'required', 'string', 'max:255', 'email', Rule::unique(User::class, 'email')->ignore($this->target()?->id)],
            'role' => ['bail', 'required', Rule::in(array_column(Role::cases(), 'value'))],
            'is_active' => ['bail', $creating ? 'prohibited' : 'required', 'boolean'],
            'password' => ['bail', $creating ? 'required' : 'prohibited', 'string', 'max:255', Password::defaults()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi',
            'name.min' => 'Minimal 3 karakter',
            'email.required' => 'Email wajib diisi',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email ini sudah terdaftar.',
            'role.required' => 'Peran wajib dipilih',
            'role.in' => 'Peran tidak dikenal.',
            'password.required' => 'Kata sandi wajib diisi',
            'password.prohibited' => 'Kata sandi akun yang sudah ada diatur ulang lewat Atur ulang kata sandi.',
            'is_active.prohibited' => 'Akun baru selalu dibuat aktif.',
            ...PasswordMessages::all(),
        ];
    }

    /**
     * @return array{name: string, email: string, role: Role}
     */
    public function profileData(): array
    {
        return [
            'name' => trim($this->string('name')->value()),
            'email' => $this->string('email')->value(),
            'role' => Role::from($this->string('role')->value()),
        ];
    }
}
