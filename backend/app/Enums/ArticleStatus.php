<?php

namespace App\Enums;

/** Alur status artikel: draf -> ditinjau -> terbit. "Kembalikan" mengubah ditinjau menjadi draf. */
enum ArticleStatus: string
{
    case Draf = 'draf';
    case Ditinjau = 'ditinjau';
    case Terbit = 'terbit';

    public function label(): string
    {
        return match ($this) {
            self::Draf => 'Draf',
            self::Ditinjau => 'Menunggu tinjauan',
            self::Terbit => 'Terbit',
        };
    }
}
