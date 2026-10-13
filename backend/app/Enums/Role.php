<?php

namespace App\Enums;

/**
 * Peran pengguna CMS (pola maker-checker).
 *
 * - Admin: mengelola semua konten, menerbitkan, pengguna, dan pengaturan.
 * - Penulis: menulis artikel miliknya sendiri lalu mengajukannya untuk ditinjau Admin.
 */
enum Role: string
{
    case Admin = 'admin';
    case Penulis = 'penulis';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Penulis => 'Penulis',
        };
    }
}
