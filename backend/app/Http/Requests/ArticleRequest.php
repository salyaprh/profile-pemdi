<?php

namespace App\Http\Requests;

use App\Models\Article;
use App\Support\ArticleHtmlSanitizer;
use App\Support\MediaUrl;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Isian formulir artikel (buat dan ubah). Status, penulis, dan tanggal terbit tidak termasuk:
 * itu hanya berubah lewat alur tinjauan.
 */
class ArticleRequest extends FormRequest
{
    private ?string $sanitizedBody = null;

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $article = $this->route('article');

        return [
            'title' => ['bail', 'required', 'string', 'min:5', 'max:200'],
            'slug' => ['bail',
                'nullable', 'string', 'max:220', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique(Article::class, 'slug')->ignore($article instanceof Article ? $article->id : null),
            ],
            'excerpt' => ['bail', 'required', 'string', 'min:20', 'max:300'],
            'body_html' => ['bail', 'required', 'string', 'max:'.ArticleHtmlSanitizer::MAX_LENGTH],
            'category_id' => ['bail', 'required', 'integer', Rule::exists('categories', 'id')],
            'cover_url' => ['bail',
                'nullable', 'string', 'max:255',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (is_string($value) && ! MediaUrl::isAllowedCover($value)) {
                        $fail('Gambar sampul harus berasal dari unggahan CMS.');
                    }
                },
            ],
            'source' => ['bail', 'nullable', 'string', 'max:255'],
            // Penguncian optimistis: waktu `updated_at` artikel saat formulir dibuka.
            'updated_at' => ['bail', 'nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul wajib diisi.',
            'title.min' => 'Judul minimal 5 karakter.',
            'title.max' => 'Judul maksimal 200 karakter.',
            'slug.regex' => 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (mis. layanan-digital-asn).',
            'slug.unique' => 'Slug ini sudah dipakai artikel lain.',
            'slug.max' => 'Slug maksimal 220 karakter.',
            'excerpt.required' => 'Ringkasan wajib diisi.',
            'excerpt.min' => 'Ringkasan minimal 20 karakter.',
            'excerpt.max' => 'Ringkasan maksimal 300 karakter.',
            'body_html.required' => 'Isi artikel wajib diisi.',
            'body_html.max' => 'Isi artikel terlalu panjang.',
            'category_id.required' => 'Kategori wajib dipilih.',
            'category_id.exists' => 'Kategori tidak ditemukan.',
            'source.max' => 'Sumber maksimal 255 karakter.',
        ];
    }

    /**
     * Isi disaring setelah lolos validasi dasar; isi yang kosong setelah disaring (mis. hanya
     * berisi <script>) ditolak.
     *
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('body_html')) {
                    return;
                }
                $this->sanitizedBody = app(ArticleHtmlSanitizer::class)->sanitize($this->string('body_html')->value());
                if (! ArticleHtmlSanitizer::hasContent($this->sanitizedBody)) {
                    $validator->errors()->add('body_html', 'Isi artikel wajib diisi.');
                }
            },
        ];
    }

    /**
     * Data siap simpan (isi sudah disaring, teks dirapikan).
     *
     * @return array{title: string, slug: ?string, excerpt: string, body_html: string, category_id: int, cover_url: ?string, source: ?string}
     */
    public function articleData(): array
    {
        $source = trim((string) $this->input('source'));
        $slug = $this->input('slug');

        return [
            'title' => trim($this->string('title')->value()),
            'slug' => is_string($slug) && $slug !== '' ? $slug : null,
            'excerpt' => trim($this->string('excerpt')->value()),
            'body_html' => (string) $this->sanitizedBody,
            'category_id' => $this->integer('category_id'),
            'cover_url' => $this->input('cover_url') ?: null,
            'source' => $source !== '' ? $source : null,
        ];
    }
}
