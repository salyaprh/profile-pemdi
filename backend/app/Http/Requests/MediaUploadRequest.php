<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
{
    /** Ukuran maksimum dalam KB (5 MB). Server PHP harus mengizinkan unggahan sebesar ini. */
    public const MAX_KILOBYTES = 5120;

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            // `image` di Laravel menolak SVG (bisa berisi skrip). Batas dimensi mencegah "bom
            // dekompresi" (berkas kecil yang membengkak menjadi gambar raksasa di memori).
            'file' => ['bail',
                'required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_KILOBYTES,
                'dimensions:min_width=200,min_height=200,max_width=8000,max_height=8000',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Pilih gambar yang akan diunggah.',
            'file.uploaded' => 'Gambar gagal diunggah. Ukurannya mungkin melebihi batas server.',
            'file.file' => 'Gambar gagal diunggah.',
            'file.image' => 'Berkas harus berupa gambar JPG, PNG, atau WebP.',
            'file.mimes' => 'Berkas harus berupa gambar JPG, PNG, atau WebP.',
            'file.max' => 'Ukuran gambar maksimal 5 MB.',
            'file.dimensions' => 'Ukuran gambar minimal 200×200 piksel dan maksimal 8000×8000 piksel.',
        ];
    }
}
