<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Pengaturan situs (Admin). Aturan dan pesannya sama dengan validate() di
 * frontend/src/admin/pages/SettingsPage.tsx. Tautan media sosial hanya https.
 */
class SiteSettingsRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'description' => ['required', 'string', 'min:20', 'max:300'],
            'hero_stats' => ['required', 'array', 'size:3'],
            'hero_stats.*.value' => ['required', 'string', 'max:10'],
            'hero_stats.*.label' => ['required', 'string', 'max:60'],
            'contact.email' => ['nullable', 'string', 'email', 'max:254'],
            'contact.phone' => ['nullable', 'string', 'regex:/^\+?[\d\s().-]{6,30}$/'],
            'contact.address' => ['nullable', 'string', 'max:300'],
            'social.facebook' => ['nullable', 'string', 'url:https', 'max:255'],
            'social.instagram' => ['nullable', 'string', 'url:https', 'max:255'],
            'social.x' => ['nullable', 'string', 'url:https', 'max:255'],
            'social.youtube' => ['nullable', 'string', 'url:https', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'description.required' => 'Deskripsi minimal 20 karakter',
            'description.min' => 'Deskripsi minimal 20 karakter',
            'description.max' => 'Deskripsi maksimal 300 karakter',
            'hero_stats.size' => 'Harus ada tepat 3 angka',
            'hero_stats.*.value.required' => 'Angka wajib diisi',
            'hero_stats.*.value.max' => 'Angka maksimal 10 karakter',
            'hero_stats.*.label.required' => 'Keterangan wajib diisi',
            'hero_stats.*.label.max' => 'Keterangan maksimal 60 karakter',
            'contact.email.email' => 'Format email tidak valid',
            'contact.phone.regex' => 'Nomor telepon hanya boleh berisi angka, spasi, +, -, titik, dan kurung',
            'social.*.url' => 'Gunakan alamat lengkap yang diawali https://',
        ];
    }

    /**
     * Hanya kunci yang dikenal dan sudah dipangkas, dalam bentuk SiteSettings.
     *
     * @return array<string, mixed>
     */
    public function settings(): array
    {
        $trim = fn (?string $value): ?string => ($value = trim((string) $value)) === '' ? null : $value;

        return [
            'description' => trim($this->string('description')->value()),
            'hero_stats' => array_map(
                fn (array $stat): array => ['value' => trim((string) $stat['value']), 'label' => trim((string) $stat['label'])],
                array_values($this->array('hero_stats')),
            ),
            'contact' => [
                'email' => $trim($this->input('contact.email')),
                'phone' => $trim($this->input('contact.phone')),
                'address' => $trim($this->input('contact.address')),
            ],
            'social' => [
                'facebook' => $trim($this->input('social.facebook')),
                'instagram' => $trim($this->input('social.instagram')),
                'x' => $trim($this->input('social.x')),
                'youtube' => $trim($this->input('social.youtube')),
            ],
        ];
    }
}
