<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Catatan perbaikan dari Admin saat mengembalikan pengajuan ke Penulis. */
class ReturnArticleRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'min:5', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'note.required' => 'Catatan perbaikan wajib diisi agar Penulis tahu apa yang harus diubah.',
            'note.min' => 'Catatan minimal 5 karakter.',
            'note.max' => 'Catatan maksimal 1000 karakter.',
        ];
    }
}
