<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Pengguna untuk daftar dan detail di panel Admin (kontrak: frontend/src/admin/users/api.ts).
 * Hash kata sandi dan token ingat-saya tidak pernah ikut.
 *
 * @mixin User
 */
class ManagedUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'must_change_password' => $this->must_change_password,
            'articles_count' => $this->whenCounted('articles'),
        ];
    }
}
