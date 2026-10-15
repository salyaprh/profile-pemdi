<?php

namespace App\Models;

use App\Enums\ActivityAction;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Jejak audit aksi di CMS. Catatan hanya ditambah lewat record(), tidak pernah diubah, dan dihapus
 * otomatis setelah masa simpan (config pemdi.activity_retention_months) oleh `model:prune`.
 */
#[Fillable(['user_id', 'action', 'description', 'subject_type', 'subject_id', 'ip_address'])]
class ActivityLog extends Model
{
    use MassPrunable;

    public const UPDATED_AT = null;

    /** @return Builder<static> */
    public function prunable(): Builder
    {
        return static::query()->where(
            'created_at',
            '<=',
            now()->subMonths((int) config('pemdi.activity_retention_months')),
        );
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    /**
     * Mencatat aksi. Pelaku default-nya pengguna yang sedang login; isi `$user` untuk aksi
     * sebelum login selesai (mis. percobaan masuk) atau dari konsol.
     */
    public static function record(ActivityAction $action, string $description, ?Model $subject = null, ?User $user = null): self
    {
        $actor = $user ?? auth()->user();

        return self::create([
            'user_id' => $actor?->getKey(),
            'action' => $action->value,
            'description' => mb_substr($description, 0, 500),
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            // Aksi dari konsol server (mis. pemdi:buat-admin) tercatat dengan IP 127.0.0.1.
            'ip_address' => request()->ip(),
        ]);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return MorphTo<Model, $this> */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}
