<?php

namespace App\Models;

use App\Enums\ArticleStatus;
use Database\Factories\ArticleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Isi artikel. `status`, `review_note`, `published_at`, dan `author_id` sengaja tidak bisa diisi
 * massal: hanya berubah lewat alur tinjauan (Admin/Penulis), bukan dari isian formulir.
 */
#[Fillable(['title', 'slug', 'excerpt', 'body_html', 'cover_url', 'source', 'category_id'])]
class Article extends Model
{
    /** @use HasFactory<ArticleFactory> */
    use HasFactory, SoftDeletes;

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => 'draf',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ArticleStatus::class,
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->author_id === $user->id;
    }

    /**
     * Slug unik dari judul (termasuk artikel di sampah, karena slug-nya tetap tercatat).
     * Bila sudah dipakai, diberi akhiran -2, -3, dan seterusnya.
     */
    public static function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        // Dipotong 200 karakter (sisa untuk akhiran); tanda hubung di ujung potongan dibuang.
        $base = rtrim(Str::limit(Str::slug($title), 200, ''), '-') ?: 'artikel';
        $slug = $base;

        $taken = fn (string $candidate): bool => self::withTrashed()
            ->where('slug', $candidate)
            ->when($ignoreId !== null, fn (Builder $query) => $query->whereKeyNot($ignoreId))
            ->exists();

        for ($suffix = 2; $taken($slug); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    /** Perkiraan waktu baca (200 kata per menit, minimal 1 menit). */
    public function readingMinutes(): int
    {
        $text = html_entity_decode(strip_tags(str_replace('>', '> ', $this->body_html)), ENT_QUOTES | ENT_HTML5);
        $words = preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return max(1, (int) ceil(count($words) / 200));
    }

    /**
     * Artikel yang boleh tampil di situs publik.
     *
     * @param  Builder<Article>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', ArticleStatus::Terbit)->where('published_at', '<=', now());
    }
}
