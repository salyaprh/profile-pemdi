<?php

namespace App\Http\Resources;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Artikel untuk situs publik (kontrak: frontend/src/services/content.ts). Hanya kolom yang memang
 * tampil di situs: tanpa id internal, status, catatan tinjauan, atau email penulis.
 *
 * @mixin Article
 */
class PublicArticleResource extends JsonResource
{
    private bool $withBody = false;

    /** Detail artikel: ikut isi HTML (sudah disaring saat disimpan), sumber, dan waktu baca. */
    public function withBody(): static
    {
        $this->withBody = true;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $summary = [
            'slug' => $this->slug,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            'cover_url' => $this->cover_url,
            'published_at' => $this->published_at?->toIso8601String(),
            'category' => ['name' => $this->category->name, 'slug' => $this->category->slug],
            'author' => ['name' => $this->author->name],
        ];

        if (! $this->withBody) {
            return $summary;
        }

        return $summary + [
            'body_html' => $this->body_html,
            'source' => $this->source,
            'reading_minutes' => $this->readingMinutes(),
        ];
    }
}
