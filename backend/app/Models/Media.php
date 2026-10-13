<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['path', 'og_path', 'original_name', 'size', 'width', 'height', 'uploaded_by'])]
class Media extends Model
{
    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** URL relatif (satu origin), mis. /storage/media/<uuid>.webp. */
    public function url(): string
    {
        return '/storage/'.$this->path;
    }

    /** Versi 1200x630 untuk pratinjau tautan (og:image). */
    public function ogUrl(): string
    {
        return '/storage/'.$this->og_path;
    }
}
