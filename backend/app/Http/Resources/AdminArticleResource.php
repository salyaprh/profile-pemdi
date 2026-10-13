<?php

namespace App\Http\Resources;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Artikel untuk panel admin. `can` berisi aksi yang boleh dilakukan pengguna saat ini (dari
 * ArticlePolicy), sehingga frontend hanya menampilkan tombol yang valid; server tetap memeriksa ulang.
 *
 * @mixin Article
 */
class AdminArticleResource extends JsonResource
{
    /** Sertakan isi lengkap (body_html) hanya pada respons satu artikel, bukan daftar. */
    public bool $withBody = false;

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
        $user = $request->user();
        $can = fn (string $ability): bool => $user?->can($ability, $this->resource) ?? false;
        $trashed = $this->trashed();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body_html' => $this->when($this->withBody, $this->body_html),
            'cover_url' => $this->cover_url,
            'source' => $this->source,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'review_note' => $this->review_note,
            'category' => ['id' => $this->category->id, 'name' => $this->category->name],
            'author' => ['id' => $this->author->id, 'name' => $this->author->name],
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'can' => [
                'update' => ! $trashed && $can('update'),
                'delete' => ! $trashed && $can('delete'),
                'restore' => $trashed && $can('restore'),
                'force_delete' => $trashed && $can('forceDelete'),
                'submit' => ! $trashed && $can('submit'),
                'withdraw' => ! $trashed && $can('withdraw'),
                'publish' => ! $trashed && $can('publish'),
                'return' => ! $trashed && $can('return'),
                'unpublish' => ! $trashed && $can('unpublish'),
            ],
        ];
    }
}
