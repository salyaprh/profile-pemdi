<?php

namespace App\Models;

use Database\Factories\ContactMessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;

/**
 * Pesan dari formulir "Hubungi kami". Semua data pengirim terenkripsi di database (dibaca dan
 * ditulis lewat cast `encrypted`), dan pesan dihapus otomatis setelah masa simpan
 * (config pemdi.contact.retention_months) oleh `php artisan model:prune` yang dijadwalkan harian.
 */
#[Fillable(['name', 'email', 'phone', 'subject', 'message'])]
class ContactMessage extends Model
{
    /** @use HasFactory<ContactMessageFactory> */
    use HasFactory, MassPrunable;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'encrypted',
            'email' => 'encrypted',
            'phone' => 'encrypted',
            'subject' => 'encrypted',
            'message' => 'encrypted',
            'read_at' => 'datetime',
        ];
    }

    /** @return Builder<static> */
    public function prunable(): Builder
    {
        return static::query()->where(
            'created_at',
            '<=',
            now()->subMonths((int) config('pemdi.contact.retention_months')),
        );
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
