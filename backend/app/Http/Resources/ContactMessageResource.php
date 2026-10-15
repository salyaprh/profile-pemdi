<?php

namespace App\Http\Resources;

use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Pesan kontak untuk kotak masuk Admin (kontrak: frontend/src/admin/messages/api.ts). Daftar hanya
 * memuat potongan isi; nomor ponsel dan isi lengkap hanya di detail.
 *
 * @mixin ContactMessage
 */
class ContactMessageResource extends JsonResource
{
    private bool $detail = false;

    public function detail(): static
    {
        $this->detail = true;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $summary = [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'subject' => $this->subject,
            'preview' => Str::limit(Str::squish($this->message), 140),
            'received_at' => $this->created_at?->toIso8601String(),
            'read_at' => $this->read_at?->toIso8601String(),
        ];

        return $this->detail
            ? $summary + ['phone' => $this->phone, 'message' => $this->message]
            : $summary;
    }
}
